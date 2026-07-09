import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for AI responses
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// Interview APIs - FIXED: Added '/api' to all routes!
export const interviewAPI = {
  getRoles: () => api.get('/api/interview/roles'),
  
  generateQuestion: (data) => api.post('/api/interview/generate-question', data),
  
  evaluateAnswer: (data) => api.post('/api/interview/evaluate-answer', data),
  
  analyzeResume: (data) => api.post('/api/interview/analyze-resume', data),
  
  getQuestionBank: (data) => api.post('/api/interview/question-bank', data),
};

export default api;