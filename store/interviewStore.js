import { create } from 'zustand';
import { interviewAPI } from '../services/api';
import { saveHistory, loadHistory } from '../utils/storage';

const useInterviewStore = create((set, get) => ({
  // Interview session state
  currentRole: null,
  currentDifficulty: 'intermediate',
  currentLanguage: 'English',
  currentQuestion: null,
  currentAnswer: '',
  currentFeedback: null,
  
  // Loading states
  isGeneratingQuestion: false,
  isEvaluating: false,
  isAnalyzingResume: false,
  isInitializing: true, // New: for loading screen
  
  // History
  interviewHistory: [],
  userId: null,
  questionBank: [],
  
  // Error
  error: null,

  // Actions
  setRole: (role) => set({ currentRole: role }),
  setDifficulty: (difficulty) => set({ currentDifficulty: difficulty }),
  setLanguage: (language) => set({ currentLanguage: language }),
  setAnswer: (answer) => set({ currentAnswer: answer }),
  clearError: () => set({ error: null }),

  // NEW: Load data from storage on app start
  initializeApp: async (userId) => {
    set({ interviewHistory: [], userId: userId || null, isInitializing: true });
    try {
      const history = await loadHistory(userId);
      set({ interviewHistory: history, userId: userId || null, isInitializing: false });
    } catch (error) {
      console.error('Init error:', error);
      set({ isInitializing: false });
    }
  },

  // Generate new question
  generateQuestion: async (role, difficulty, questionType, language) => {
    set({ isGeneratingQuestion: true, error: null, currentFeedback: null, currentAnswer: '' });
    try {
      const response = await interviewAPI.generateQuestion({
        role: role || get().currentRole,
        difficulty: difficulty || get().currentDifficulty,
        questionType: questionType || 'behavioral',
        language: language || get().currentLanguage,
      });
      
      if (response.success) {
        const requestedLanguage = language || get().currentLanguage;
        if (requestedLanguage !== 'English' && response.data?.language !== requestedLanguage) {
          throw new Error(`The live API is outdated and did not honor ${requestedLanguage}. Deploy backend API v2 before starting the interview.`);
        }
        set({ 
          currentQuestion: response.data,
          isGeneratingQuestion: false 
        });
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: error.message, isGeneratingQuestion: false });
      throw error;
    }
  },

  // Submit answer and get feedback
  submitAnswer: async () => {
    const { currentRole, currentDifficulty, currentLanguage, currentQuestion, currentAnswer } = get();
    
    if (!currentAnswer.trim()) {
      set({ error: 'Please provide an answer' });
      return;
    }

    set({ isEvaluating: true, error: null });
    try {
      const response = await interviewAPI.evaluateAnswer({
        role: currentRole,
        difficulty: currentDifficulty,
        question: currentQuestion.question,
        userAnswer: currentAnswer,
        language: currentLanguage,
      });

      if (response.success) {
        const feedback = response.data;
        
        const historyItem = {
          id: Date.now(),
          role: currentRole,
          difficulty: currentDifficulty,
          language: currentLanguage,
          question: currentQuestion.question,
          answer: currentAnswer,
          feedback: feedback,
          timestamp: new Date().toISOString(),
        };

        const newHistory = [historyItem, ...get().interviewHistory];
        
        // NEW: Save to local storage!
        await saveHistory(newHistory, get().userId);

        set(state => ({
          currentFeedback: feedback,
          isEvaluating: false,
          interviewHistory: newHistory,
        }));

        return feedback;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: error.message, isEvaluating: false });
      throw error;
    }
  },

  // Load question bank
  loadQuestionBank: async (role) => {
    set({ isGeneratingQuestion: true, error: null });
    try {
      const response = await interviewAPI.getQuestionBank({ role, count: 10 });
      
      if (response.success) {
        set({ questionBank: response.data, isGeneratingQuestion: false });
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: error.message, isGeneratingQuestion: false });
      throw error;
    }
  },

  // Analyze resume
  analyzeResume: async (resumeText, jobDescription, file) => {
    set({ isAnalyzingResume: true, error: null });
    try {
      const response = await interviewAPI.analyzeResume({ resumeText, jobDescription, file });
      
      if (response.success) {
        set({ isAnalyzingResume: false });
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const legacyUploadError = file && /50 characters|resume text/i.test(error.message);
      const resolvedError = legacyUploadError
        ? new Error('The live backend is still on API v1 and cannot accept resume files. Deploy backend API v2, then retry this upload.')
        : error;
      set({ error: resolvedError.message, isAnalyzingResume: false });
      throw resolvedError;
    }
  },

  // Reset current session
  resetSession: () => set({
    currentQuestion: null,
    currentAnswer: '',
    currentFeedback: null,
  }),

  // Clear all history (also clears storage)
  clearHistory: async () => {
    await saveHistory([], get().userId);
    set({ interviewHistory: [] });
  },
}));

export default useInterviewStore;
