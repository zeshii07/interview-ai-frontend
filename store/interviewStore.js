import { create } from 'zustand';

import { interviewAPI } from '../services/api';
import { saveHistory, loadHistory } from '../utils/storage';
import {
  deleteCloudHistory,
  loadCloudHistory,
  migrateHistoryToCloud,
  saveCloudHistoryItem,
} from '../services/historyService';
import {
  getRecentQuestionTexts,
  normalizeGeneratedQuestion,
  normalizeEvaluation,
} from '../utils/interviewPayload';

const compactHistoryItem = (item) => {
  const date = item?.updatedAt || item?.timestamp || new Date().toISOString();
  const averageScore = Number(
    item?.averageScore ?? item?.feedback?.rating ?? 0
  );

  return {
    id: String(item?.id || Date.now()),
    role: String(item?.role || 'Interview'),
    difficulty: String(item?.difficulty || 'intermediate'),
    averageScore: Math.round(averageScore * 10) / 10,
    startedAt: item?.startedAt || date,
    updatedAt: date,
  };
};

const useInterviewStore = create((set, get) => ({
  currentRole: null,
  currentDifficulty: 'intermediate',
  currentLanguage: 'English',
  currentQuestion: null,
  currentAnswer: '',
  currentFeedback: null,
  sessionQuestions: [],
  currentSessionId: null,
  sessionScoreTotal: 0,
  sessionAnswerCount: 0,

  isGeneratingQuestion: false,
  isEvaluating: false,
  isAnalyzingResume: false,
  isInitializing: true,

  interviewHistory: [],
  userId: null,
  questionBank: [],

  error: null,

  setRole: (role) => set({ currentRole: role }),
  setDifficulty: (difficulty) =>
    set({ currentDifficulty: difficulty }),
  setLanguage: (language) =>
    set({ currentLanguage: language }),
  setAnswer: (answer) => set({ currentAnswer: answer }),
  clearError: () => set({ error: null }),

  initializeApp: async (userId) => {
    set({
      interviewHistory: [],
      userId: userId || null,
      isInitializing: true,
    });

    try {
      const localHistory = await loadHistory(userId);
      let history = localHistory;

      if (userId) {
        try {
          const cloudHistory = await loadCloudHistory(userId);
          if (cloudHistory.length) {
            const cloudIds = new Set(
              cloudHistory.map((item) => String(item.id))
            );
            const pendingLocalHistory = localHistory.filter(
              (item) => !cloudIds.has(String(item.id))
            );

            if (pendingLocalHistory.length) {
              await migrateHistoryToCloud(userId, pendingLocalHistory);
            }

            history = [...cloudHistory, ...pendingLocalHistory].sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            );
            await saveHistory(history, userId);
          } else if (localHistory.length) {
            await migrateHistoryToCloud(userId, localHistory);
          }
        } catch (cloudError) {
          console.error('Cloud history sync failed:', cloudError);
        }
      }

      history = (Array.isArray(history) ? history : [])
        .map(compactHistoryItem)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
        );

      await saveHistory(history, userId);
      if (userId) {
        try {
          await migrateHistoryToCloud(userId, history);
        } catch (cloudError) {
          console.error('Cloud history compaction failed:', cloudError);
        }
      }

      set({
        interviewHistory: Array.isArray(history) ? history : [],
        userId: userId || null,
        isInitializing: false,
      });
    } catch (error) {
      console.error('Init error:', error);
      set({ isInitializing: false });
    }
  },

  startNewInterview: () =>
    set({
      currentSessionId: String(Date.now()),
      sessionScoreTotal: 0,
      sessionAnswerCount: 0,
      currentQuestion: null,
      currentAnswer: '',
      currentFeedback: null,
      sessionQuestions: [],
      error: null,
    }),

  generateQuestion: async (
    role,
    difficulty,
    questionType = 'mixed',
    language
  ) => {
    const state = get();

    const resolvedRole = role || state.currentRole;
    const resolvedDifficulty =
      difficulty || state.currentDifficulty;
    const resolvedLanguage =
      language || state.currentLanguage || 'English';

    const previousQuestions = getRecentQuestionTexts(
      state.sessionQuestions,
      8
    );

    set({
      isGeneratingQuestion: true,
      error: null,
      currentFeedback: null,
      currentAnswer: '',
    });

    try {
      const response = await interviewAPI.generateQuestion({
        role: resolvedRole,
        difficulty: resolvedDifficulty,
        questionType: questionType || 'mixed',
        language: resolvedLanguage,
        previousQuestions,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || 'Failed to generate question.'
        );
      }

      const nextQuestion = normalizeGeneratedQuestion(
        response.data
      );

      if (
        resolvedLanguage !== 'English' &&
        nextQuestion.language !== resolvedLanguage
      ) {
        throw new Error(
          `The backend did not honor ${resolvedLanguage}. Redeploy the upgraded API and try again.`
        );
      }

      set((current) => ({
        currentQuestion: nextQuestion,
        sessionQuestions: [
          ...current.sessionQuestions,
          nextQuestion,
        ].slice(-20),
        isGeneratingQuestion: false,
      }));

      return nextQuestion;
    } catch (error) {
      set({
        error: error.message,
        isGeneratingQuestion: false,
      });

      throw error;
    }
  },

  submitAnswer: async () => {
    const {
      currentRole,
      currentDifficulty,
      currentLanguage,
      currentQuestion,
      currentAnswer,
    } = get();

    const questionText =
      typeof currentQuestion === 'string'
        ? currentQuestion
        : currentQuestion?.question;

    const questionCategory =
      typeof currentQuestion === 'object'
        ? currentQuestion?.category
        : undefined;

    if (!questionText) {
      const error = new Error(
        'Generate a question before submitting an answer.'
      );
      set({ error: error.message });
      throw error;
    }

    if (currentAnswer.trim().length < 20) {
      const error = new Error(
        'Please provide a more detailed answer of at least 20 characters.'
      );
      set({ error: error.message });
      throw error;
    }

    set({ isEvaluating: true, error: null });

    try {
      const response = await interviewAPI.evaluateAnswer({
        role: currentRole,
        difficulty: currentDifficulty,
        question: questionText,
        questionCategory,
        userAnswer: currentAnswer,
        language: currentLanguage,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || 'Failed to evaluate answer.'
        );
      }

      const feedback = normalizeEvaluation(response.data);

      const state = get();
      const sessionId = state.currentSessionId || String(Date.now());
      const sessionScoreTotal =
        state.sessionScoreTotal + Number(feedback.rating || 0);
      const sessionAnswerCount = state.sessionAnswerCount + 1;
      const averageScore =
        Math.round((sessionScoreTotal / sessionAnswerCount) * 10) / 10;
      const now = new Date().toISOString();

      const historyItem = {
        id: sessionId,
        role: currentRole,
        difficulty: currentDifficulty,
        averageScore,
        startedAt:
          state.interviewHistory.find(
            (item) => String(item.id) === sessionId
          )?.startedAt || now,
        updatedAt: now,
      };

      const newHistory = [
        historyItem,
        ...state.interviewHistory.filter(
          (item) => String(item.id) !== sessionId
        ),
      ];

      const userId = get().userId;
      await saveHistory(newHistory, userId);

      if (userId) {
        try {
          await saveCloudHistoryItem(userId, historyItem);
        } catch (cloudError) {
          console.error('Cloud history save failed:', cloudError);
        }
      }

      set({
        currentFeedback: feedback,
        isEvaluating: false,
        interviewHistory: newHistory,
        currentSessionId: sessionId,
        sessionScoreTotal,
        sessionAnswerCount,
      });

      return feedback;
    } catch (error) {
      set({
        error: error.message,
        isEvaluating: false,
      });

      throw error;
    }
  },

  loadQuestionBank: async (
    role,
    count = 10,
    difficulty = 'mixed',
    language
  ) => {
    const resolvedLanguage =
      language || get().currentLanguage || 'English';

    set({
      isGeneratingQuestion: true,
      error: null,
    });

    try {
      const response = await interviewAPI.getQuestionBank({
        role,
        count,
        difficulty,
        language: resolvedLanguage,
      });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            'Failed to generate question bank.'
        );
      }

      const questions = Array.isArray(response.data)
        ? response.data
        : [];

      set({
        questionBank: questions,
        isGeneratingQuestion: false,
      });

      return questions;
    } catch (error) {
      set({
        error: error.message,
        isGeneratingQuestion: false,
      });

      throw error;
    }
  },

  analyzeResume: async (
    resumeText,
    jobDescription,
    file
  ) => {
    set({
      isAnalyzingResume: true,
      error: null,
    });

    try {
      const response = await interviewAPI.analyzeResume({
        resumeText,
        jobDescription,
        file,
        language: get().currentLanguage,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || 'Failed to analyze resume.'
        );
      }

      set({ isAnalyzingResume: false });
      return response.data;
    } catch (error) {
      const legacyUploadError =
        file &&
        /50 characters|resume text/i.test(
          error.message
        );

      const resolvedError = legacyUploadError
        ? new Error(
            'The live backend cannot accept resume files yet. Deploy the upgraded API and retry.'
          )
        : error;

      set({
        error: resolvedError.message,
        isAnalyzingResume: false,
      });

      throw resolvedError;
    }
  },

  resetQuestionState: () =>
    set({
      currentQuestion: null,
      currentAnswer: '',
      currentFeedback: null,
      error: null,
    }),

  // Kept for compatibility with existing screens.
  // It resets only the current question, not recent-question history.
  resetSession: () =>
    set({
      currentQuestion: null,
      currentAnswer: '',
      currentFeedback: null,
      error: null,
    }),

  clearHistory: async () => {
    const userId = get().userId;
    await saveHistory([], userId);
    if (userId) await deleteCloudHistory(userId);
    set({ interviewHistory: [] });
  },
}));

export default useInterviewStore;
