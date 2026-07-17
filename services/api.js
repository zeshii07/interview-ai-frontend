import axios from "axios";
import { Platform } from "react-native";
import { API_BASE_URL } from "../constants/config";

export const SUPPORTED_INTERVIEW_LANGUAGES = [
  "English",
  "Urdu",
  "Hindi",
  "Arabic",
  "Spanish",
  "French",
  "German",
];

function normalizeLanguage(language) {
  const requested = String(language || "").trim().toLowerCase();
  return SUPPORTED_INTERVIEW_LANGUAGES.find(
    (item) => item.toLowerCase() === requested
  ) || "English";
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.url}`
    );

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error Details:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
    });

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Network error";

    return Promise.reject(new Error(message));
  }
);

function normalizeRecentQuestions(previousQuestions = []) {
  if (!Array.isArray(previousQuestions)) {
    return [];
  }

  return previousQuestions
    .map((item) => {
      if (typeof item === "string") return item.trim();
      return String(item?.question || "").trim();
    })
    .filter(Boolean)
    .slice(-8);
}

export const interviewAPI = {
  transcribeAudio: async (uri, language = "English") => {
    if (!uri) {
      throw new Error("Audio URI is missing.");
    }

    const extension =
      uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "m4a";

    const mimeTypes = {
      m4a: "audio/mp4",
      mp4: "audio/mp4",
      wav: "audio/wav",
      mp3: "audio/mpeg",
      aac: "audio/aac",
      webm: "audio/webm",
    };

    const formData = new FormData();

    formData.append("audio", {
      uri:
        Platform.OS === "ios"
          ? uri.replace("file://", "")
          : uri,
      name: `recording-${Date.now()}.${extension}`,
      type: mimeTypes[extension] || "audio/mp4",
    });
    formData.append("language", normalizeLanguage(language));

    return api.post("/api/interview/transcribe", formData, {
      timeout: 120000,
      headers: {
        Accept: "application/json",
      },
    });
  },

  getRoles: () => api.get("/api/interview/roles"),

  generateQuestion: ({
    role,
    difficulty,
    questionType = "mixed",
    language = "English",
    previousQuestions = [],
  }) =>
    api.post(
      "/api/interview/generate-question",
      {
        role,
        difficulty,
        questionType,
        language: normalizeLanguage(language),
        previousQuestions: normalizeRecentQuestions(previousQuestions),
      },
      {
        timeout: 90000,
      }
    ),

  evaluateAnswer: ({
    role,
    difficulty,
    question,
    questionCategory,
    userAnswer,
    language = "English",
  }) =>
    api.post(
      "/api/interview/evaluate-answer",
      {
        role,
        difficulty,
        question,
        questionCategory,
        userAnswer,
        language: normalizeLanguage(language),
      },
      {
        timeout: 120000,
      }
    ),

  analyzeResume: (data) => {
    if (!data.file) {
      return api.post("/api/interview/analyze-resume", {
        ...data,
        language: normalizeLanguage(data.language),
      }, {
        timeout: 120000,
      });
    }

    const formData = new FormData();

    formData.append("resume", {
      uri:
        Platform.OS === "ios"
          ? data.file.uri.replace("file://", "")
          : data.file.uri,
      name: data.file.name,
      type: data.file.mimeType || "application/octet-stream",
    });

    formData.append(
      "jobDescription",
      data.jobDescription || ""
    );
    formData.append("language", normalizeLanguage(data.language));

    return api.post(
      "/api/interview/analyze-resume",
      formData,
      {
        timeout: 120000,
      }
    );
  },

  getQuestionBank: ({
    role,
    count = 10,
    difficulty = "mixed",
    language = "English",
  }) =>
    api.post(
      "/api/interview/question-bank",
      {
        role,
        count,
        difficulty,
        language: normalizeLanguage(language),
      },
      {
        timeout: 120000,
      }
    ),
};

export const resumeAPI = {
  generate: (data) =>
    api.post("/api/resume/generate", data, {
      timeout: 120000,
    }),
};

export default api;
