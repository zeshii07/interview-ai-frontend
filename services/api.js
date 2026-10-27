import axios from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

export const SUPPORTED_INTERVIEW_LANGUAGES = [
  'English', 'Urdu', 'Hindi', 'Arabic', 'Spanish', 'French', 'German',
];

function normalizeLanguage(language) {
  const requested = String(language || '').trim().toLowerCase();
  return (
    SUPPORTED_INTERVIEW_LANGUAGES.find((item) => item.toLowerCase() === requested) ||
    'English'
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Slow-network pub/sub — flips a flag at 12s so screens can show a banner.
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
// Retry with exponential backoff — 2 retries, 800ms → 1600ms.
// Only retries on network errors and 5xx (not 4xx — those are user errors).
// ────────────────────────────────────────────────────────────────────────────
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 800;
const isRetryable = (error) => {
  if (!error) return false;
  if (!error.response) return true;
  const status = error.response.status;
  return status >= 500 && status < 600;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Per-request GET dedup map
const inFlightGets = new Map();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    config.metadata = {
      startedAt: Date.now(),
      slowTimer: setTimeout(() => setSlowNetwork(true), 12000),
    };
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const meta = response.config?.metadata;
    if (meta?.slowTimer) clearTimeout(meta.slowTimer);
    setSlowNetwork(false);
    return response.data;
  },
  async (error) => {
    const meta = error.config?.metadata;
    if (meta?.slowTimer) clearTimeout(meta.slowTimer);

    const retryCount = error.config?.__retryCount || 0;
    if (retryCount < MAX_RETRIES && isRetryable(error)) {
      error.config.__retryCount = retryCount + 1;
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      if (__DEV__) {
        console.warn(`API retry ${retryCount + 1}/${MAX_RETRIES} for ${error.config?.url} after ${backoff}ms`);
      }
      await sleep(backoff);
      return api.request(error.config);
    }

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

export const makeAbortable = () => {
  const controller = new AbortController();
  return { signal: controller.signal, abort: () => controller.abort() };
};

export const isAbortError = (error) =>
  error?.name === 'AbortError' ||
  error?.code === 'ERR_CANCELED' ||
  /aborted/i.test(error?.message || '');

function normalizeRecentQuestions(previousQuestions = []) {
  if (!Array.isArray(previousQuestions)) return [];
  return previousQuestions
    .map((item) => (typeof item === 'string' ? item.trim() : String(item?.question || '').trim()))
    .filter(Boolean)
    .slice(-8);
}

export const interviewAPI = {
  transcribeAudio: async (uri, language = 'English', signal) => {
    if (!uri) throw new Error('Audio URI is missing.');
    const extension = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'm4a';
    const mimeTypes = {
      m4a: 'audio/mp4', mp4: 'audio/mp4', wav: 'audio/wav',
      mp3: 'audio/mpeg', aac: 'audio/aac', webm: 'audio/webm',
    };
    const formData = new FormData();
    formData.append('audio', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: `recording-${Date.now()}.${extension}`,
      type: mimeTypes[extension] || 'audio/mp4',
    });
    formData.append('language', normalizeLanguage(language));
    return api.post('/api/interview/transcribe', formData, {
      timeout: 120000, signal,
      headers: { Accept: 'application/json' },
    });
  },

  getRoles: () => api.get('/api/interview/roles'),

  generateQuestion: ({ role, difficulty, questionType = 'mixed', language = 'English', previousQuestions = [], signal }) =>
    api.post('/api/interview/generate-question', {
      role, difficulty, questionType,
      language: normalizeLanguage(language),
      previousQuestions: normalizeRecentQuestions(previousQuestions),
    }, { timeout: 60000, signal }),

  evaluateAnswer: ({ role, difficulty, question, questionCategory, userAnswer, language = 'English', signal }) =>
    api.post('/api/interview/evaluate-answer', {
      role, difficulty, question, questionCategory, userAnswer,
      language: normalizeLanguage(language),
    }, { timeout: 90000, signal }),

  analyzeResume: (data, signal) => {
    if (!data.file) {
      return api.post('/api/interview/analyze-resume', {
        ...data, language: normalizeLanguage(data.language),
      }, { timeout: 90000, signal });
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
      timeout: 90000, signal,
    });
  },

  getQuestionBank: ({ role, count = 10, difficulty = 'mixed', language = 'English', signal }) =>
    api.post('/api/interview/question-bank', {
      role, count, difficulty, language: normalizeLanguage(language),
    }, { timeout: 90000, signal }),

  // NEW: get readiness score (computed on backend from past sessions)
  getReadiness: (userId, signal) =>
    api.post('/api/interview/readiness', { userId }, { timeout: 15000, signal }),
};

export const resumeAPI = {
  generate: (data, signal) =>
    api.post('/api/resume/generate', data, { timeout: 90000, signal }),
};

export const jobsAPI = {
  search: (params, signal) =>
    api.post('/api/jobs/search', params, { timeout: 30000, signal }),

  getProviders: () => api.get('/api/jobs/providers'),

  health: () => api.get('/api/jobs/health'),
};

export default api;
