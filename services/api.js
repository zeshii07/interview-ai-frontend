import axios from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

export const SUPPORTED_INTERVIEW_LANGUAGES = [
  'English',
  'Urdu',
  'Hindi',
  'Arabic',
  'Spanish',
  'French',
  'German',
];

function normalizeLanguage(language) {
  const requested = String(language || '').trim().toLowerCase();
  return (
    SUPPORTED_INTERVIEW_LANGUAGES.find((item) => item.toLowerCase() === requested) ||
    'English'
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Slow-connection indicator
//
// A tiny pub/sub so any screen can subscribe to "the network has been slow for
// the last 12 seconds" and show a banner. Default axios timeout was 60s — too
// long for bad networks. We now surface a UI hint at 12s instead of silently
// hanging.
// ────────────────────────────────────────────────────────────────────────────

const slowNetworkListeners = new Set();
let slowNetworkActive = false;

export const subscribeSlowNetwork = (cb) => {
  slowNetworkListeners.add(cb);
  cb(slowNetworkActive);
  return () => slowNetworkListeners.delete(cb);
};

const setSlowNetwork = (active) => {
  if (active === slowNetworkActive) return;
  slowNetworkActive = active;
  slowNetworkListeners.forEach((cb) => cb(active));
};

// ────────────────────────────────────────────────────────────────────────────
// Retry with exponential backoff
//
// Retries only on network errors and 5xx — NOT on 4xx (those are user errors
// and retrying won't help). Default: 2 retries, 800ms → 1600ms backoff.
// ────────────────────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 800;

const isRetryable = (error) => {
  if (!error) return false;
  // Network error (no response received)
  if (!error.response) return true;
  // 5xx
  const status = error.response.status;
  return status >= 500 && status < 600;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ────────────────────────────────────────────────────────────────────────────
// Per-request dedup map: if the same GET URL is already in flight, return
// its promise instead of firing a duplicate request.
// ────────────────────────────────────────────────────────────────────────────

const inFlightGets = new Map();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // was 60s — too long for a phone on a flaky network
  headers: { Accept: 'application/json' },
});

// ── Request interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Per-request slow-network timer. If the request takes >12s, flip the
    // global slow-network flag so the UI can show a banner. Cleared on
    // response/error.
    const requestId = `${config.method || 'get'} ${config.url}`;
    config.metadata = {
      requestId,
      startedAt: Date.now(),
      slowTimer: setTimeout(() => setSlowNetwork(true), 12000),
    };

    if (__DEV__) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Dedup identical GETs
    if ((config.method || 'get').toLowerCase() === 'get' && config.dedupable !== false) {
      const key = requestId;
      if (inFlightGets.has(key)) {
        return inFlightGets.get(key);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: retry + slow-network cleanup + dedup ─────────────
api.interceptors.response.use(
  async (response) => {
    const meta = response.config?.metadata;
    if (meta?.slowTimer) clearTimeout(meta.slowTimer);

    // Response received within 12s — network is healthy again
    setSlowNetwork(false);

    // Resolve deduped GETs
    const key = `${response.config?.method || 'get'} ${response.config?.url}`;
    if (inFlightGets.has(key)) {
      const promise = inFlightGets.get(key);
      inFlightGets.delete(key);
      promise.resolve(response.data);
    }

    return response.data;
  },
  async (error) => {
    const meta = error.config?.metadata;
    if (meta?.slowTimer) clearTimeout(meta.slowTimer);

    // Reject deduped GETs
    const key = `${error.config?.method || 'get'} ${error.config?.url}`;
    if (inFlightGets.has(key)) {
      const promise = inFlightGets.get(key);
      inFlightGets.delete(key);
      promise.reject(error);
    }

    // Retry logic
    const retryCount = error.config?.__retryCount || 0;
    if (retryCount < MAX_RETRIES && isRetryable(error)) {
      error.config.__retryCount = retryCount + 1;
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      if (__DEV__) {
        console.warn(
          `API retry ${retryCount + 1}/${MAX_RETRIES} for ${error.config?.url} after ${backoff}ms`
        );
      }
      await sleep(backoff);
      return api.request(error.config);
    }

    if (__DEV__) {
      console.error('API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
    }

    // User-facing message — surface a friendly string, not the raw axios error
    let message;
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
      message = 'The request took too long. Check your connection and try again.';
    } else if (!error.response) {
      message = 'Network error. Please check your internet connection.';
    } else if (error.response.status >= 500) {
      message = 'Our servers are having trouble. Please try again shortly.';
    } else {
      message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Something went wrong.';
    }

    return Promise.reject(new Error(message));
  }
);

// Wrap api.get so dedup is set up correctly
const originalGet = api.get.bind(api);
api.get = (url, config = {}) => {
  const key = `get ${url}`;
  if (!config.dedupable || config.dedupable !== false) {
    if (inFlightGets.has(key)) {
      return inFlightGets.get(key).promise;
    }
    let resolveFn, rejectFn;
    const promise = new Promise((res, rej) => {
      resolveFn = res;
      rejectFn = rej;
    });
    inFlightGets.set(key, { promise, resolve: resolveFn, reject: rejectFn });
    originalGet(url, config).then(resolveFn, rejectFn);
    return promise;
  }
  return originalGet(url, config);
};

// ────────────────────────────────────────────────────────────────────────────
// AbortController helper — lets callers cancel a request on unmount.
//
//   const ctrl = makeAbortable();
//   try { await interviewAPI.generateQuestion({ ..., signal: ctrl.signal }); }
//   catch (e) { if (!isAbortError(e)) throw e; }
//   // in useEffect cleanup: ctrl.abort();
// ────────────────────────────────────────────────────────────────────────────

export const makeAbortable = () => {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    abort: () => controller.abort(),
  };
};

export const isAbortError = (error) =>
  error?.name === 'AbortError' ||
  error?.code === 'ERR_CANCELED' ||
  /aborted/i.test(error?.message || '');

// ────────────────────────────────────────────────────────────────────────────

function normalizeRecentQuestions(previousQuestions = []) {
  if (!Array.isArray(previousQuestions)) {
    return [];
  }

  return previousQuestions
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      return String(item?.question || '').trim();
    })
    .filter(Boolean)
    .slice(-8);
}

// ────────────────────────────────────────────────────────────────────────────
// API namespaces
// ────────────────────────────────────────────────────────────────────────────

export const interviewAPI = {
  transcribeAudio: async (uri, language = 'English', signal) => {
    if (!uri) {
      throw new Error('Audio URI is missing.');
    }

    const extension =
      uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'm4a';

    const mimeTypes = {
      m4a: 'audio/mp4',
      mp4: 'audio/mp4',
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
      aac: 'audio/aac',
      webm: 'audio/webm',
    };

    const formData = new FormData();

    formData.append('audio', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: `recording-${Date.now()}.${extension}`,
      type: mimeTypes[extension] || 'audio/mp4',
    });
    formData.append('language', normalizeLanguage(language));

    return api.post('/api/interview/transcribe', formData, {
      timeout: 120000,
      signal,
      headers: { Accept: 'application/json' },
      dedupable: false,
    });
  },

  getRoles: () => api.get('/api/interview/roles'),

  generateQuestion: ({ role, difficulty, questionType = 'mixed', language = 'English', previousQuestions = [], signal }) =>
    api.post(
      '/api/interview/generate-question',
      {
        role,
        difficulty,
        questionType,
        language: normalizeLanguage(language),
        previousQuestions: normalizeRecentQuestions(previousQuestions),
      },
      { timeout: 60000, signal, dedupable: false }
    ),

  evaluateAnswer: ({ role, difficulty, question, questionCategory, userAnswer, language = 'English', signal }) =>
    api.post(
      '/api/interview/evaluate-answer',
      {
        role,
        difficulty,
        question,
        questionCategory,
        userAnswer,
        language: normalizeLanguage(language),
      },
      { timeout: 90000, signal, dedupable: false }
    ),

  analyzeResume: (data, signal) => {
    if (!data.file) {
      return api.post(
        '/api/interview/analyze-resume',
        {
          ...data,
          language: normalizeLanguage(data.language),
        },
        { timeout: 90000, signal, dedupable: false }
      );
    }

    const formData = new FormData();

    formData.append('resume', {
      uri: Platform.OS === 'ios' ? data.file.uri.replace('file://', '') : data.file.uri,
      name: data.file.name,
      type: data.file.mimeType || 'application/octet-stream',
    });

    formData.append('jobDescription', data.jobDescription || '');
    formData.append('language', normalizeLanguage(data.language));

    return api.post('/api/interview/analyze-resume', formData, {
      timeout: 90000,
      signal,
      dedupable: false,
    });
  },

  getQuestionBank: ({ role, count = 10, difficulty = 'mixed', language = 'English', signal }) =>
    api.post(
      '/api/interview/question-bank',
      {
        role,
        count,
        difficulty,
        language: normalizeLanguage(language),
      },
      { timeout: 90000, signal, dedupable: false }
    ),
};

export const resumeAPI = {
  generate: (data, signal) =>
    api.post('/api/resume/generate', data, { timeout: 90000, signal, dedupable: false }),
};

// NEW: Job search API
export const jobsAPI = {
  search: (params, signal) =>
    api.post('/api/jobs/search', params, {
      timeout: 30000,
      signal,
      dedupable: false,
    }),

  getProviders: () => api.get('/api/jobs/providers'),

  health: () => api.get('/api/jobs/health'),
};

export default api;
