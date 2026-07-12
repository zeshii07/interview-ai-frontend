import axios from "axios";
import { Platform } from "react-native";
import { API_BASE_URL } from "../constants/config";

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

export const interviewAPI = {
  transcribeAudio: async (uri) => {
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

    return api.post("/api/interview/transcribe", formData, {
      timeout: 120000,
      headers: {
        Accept: "application/json",
      },
    });
  },

  getRoles: () => api.get("/api/interview/roles"),

  generateQuestion: (data) =>
    api.post("/api/interview/generate-question", data),

  evaluateAnswer: (data) =>
    api.post("/api/interview/evaluate-answer", data),

  analyzeResume: (data) =>
    api.post("/api/interview/analyze-resume", data),

  getQuestionBank: (data) =>
    api.post("/api/interview/question-bank", data),
};

export default api;