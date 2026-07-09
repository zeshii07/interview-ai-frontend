import { create } from 'zustand';
import { interviewAPI } from '../services/api';
import { saveHistory, loadHistory } from '../utils/storage';

const useInterviewStore = create((set, get) => ({
  // Interview session state
  currentRole: null,
  currentDifficulty: 'intermediate',
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
  questionBank: [],
  
  // Error
  error: null,

  // Actions
  setRole: (role) => set({ currentRole: role }),
  setDifficulty: (difficulty) => set({ currentDifficulty: difficulty }),
  setAnswer: (answer) => set({ currentAnswer: answer }),
  clearError: () => set({ error: null }),

  // NEW: Load data from storage on app start
  initializeApp: async () => {
    try {
      const history = await loadHistory();
      set({ interviewHistory: history, isInitializing: false });
    } catch (error) {
      console.error('Init error:', error);
      set({ isInitializing: false });
    }
  },

  // Generate new question
  generateQuestion: async (role, difficulty, questionType) => {
    set({ isGeneratingQuestion: true, error: null, currentFeedback: null, currentAnswer: '' });
    try {
      const response = await interviewAPI.generateQuestion({
        role: role || get().currentRole,
        difficulty: difficulty || get().currentDifficulty,
        questionType: questionType || 'behavioral',
      });
      
      if (response.success) {
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
    const { currentRole, currentDifficulty, currentQuestion, currentAnswer } = get();
    
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
      });

      if (response.success) {
        const feedback = response.data;
        
        const historyItem = {
          id: Date.now(),
          role: currentRole,
          difficulty: currentDifficulty,
          question: currentQuestion.question,
          answer: currentAnswer,
          feedback: feedback,
          timestamp: new Date().toISOString(),
        };

        const newHistory = [historyItem, ...get().interviewHistory];
        
        // NEW: Save to local storage!
        await saveHistory(newHistory);

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
  analyzeResume: async (resumeText, jobDescription) => {
    set({ isAnalyzingResume: true, error: null });
    try {
      const response = await interviewAPI.analyzeResume({ resumeText, jobDescription });
      
      if (response.success) {
        set({ isAnalyzingResume: false });
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      set({ error: error.message, isAnalyzingResume: false });
      throw error;
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
    await saveHistory([]);
    set({ interviewHistory: [] });
  },
}));

export default useInterviewStore;