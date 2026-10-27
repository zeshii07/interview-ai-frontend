import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * interviewFlowStore
 *
 * Holds the new Sprint 2 interview-flow state — interview type, selected role,
 * preferences (experience, question count, time limit), mock-interview progress,
 * and the final results snapshot. Decoupled from the existing interviewStore
 * (which holds the Q&A mechanics) so we don't have to refactor that store.
 *
 * Lifecycle:
 *   1. Pick interview type    → setInterviewType()
 *   2. Pick role               → setRole()
 *   3. Set preferences         → setPreferences()
 *   4. Run Q&A or mock         → screens use this store for config
 *   5. Capture results         → setResults()
 *   6. Reset for next time     → resetFlow()
 */

const useInterviewFlowStore = create(
  persist(
    (set, get) => ({
      // Flow state
      interviewType: null,        // 'general' | 'role' | 'technical' | 'behavioral' | 'mock'
      role: null,                  // e.g. 'Frontend Developer'
      experienceLevel: 'mid',     // 'entry' | 'mid' | 'senior' | 'lead'
      difficulty: 'intermediate',  // 'beginner' | 'intermediate' | 'expert'
      language: 'English',
      questionCount: 10,           // 5 / 10 / 15
      timeLimitPerQuestion: 90,   // 0 / 60 / 90 / 120 seconds (0 = no limit)

      // Mock interview progress
      currentQuestionIndex: 0,
      mockStarted: false,
      mockStartedAt: null,

      // Final results snapshot (captured when session ends)
      results: null,              // { score, maxScore, strengths, weaknesses, questionCount, durationSec, role, type }
      lastSessionId: null,

      // Actions
      setInterviewType: (type) => set({ interviewType: type }),
      setRole: (role) => set({ role }),
      setExperienceLevel: (level) => set({ experienceLevel: level }),
      setDifficulty: (d) => set({ difficulty: d }),
      setLanguage: (l) => set({ language: l }),
      setQuestionCount: (n) => set({ questionCount: n }),
      setTimeLimitPerQuestion: (s) => set({ timeLimitPerQuestion: s }),

      setPreferences: (prefs) => set({
        experienceLevel: prefs.experienceLevel || get().experienceLevel,
        difficulty: prefs.difficulty || get().difficulty,
        language: prefs.language || get().language,
        questionCount: prefs.questionCount || get().questionCount,
        timeLimitPerQuestion: prefs.timeLimitPerQuestion ?? get().timeLimitPerQuestion,
      }),

      startMock: () => set({
        mockStarted: true,
        mockStartedAt: Date.now(),
        currentQuestionIndex: 0,
      }),

      advanceQuestion: () => set((state) => ({
        currentQuestionIndex: state.currentQuestionIndex + 1,
      })),

      setResults: (results) => set({
        results,
        lastSessionId: String(Date.now()),
        mockStarted: false,
      }),

      resetFlow: () => set({
        interviewType: null,
        role: null,
        experienceLevel: 'mid',
        difficulty: 'intermediate',
        language: 'English',
        questionCount: 10,
        timeLimitPerQuestion: 90,
        currentQuestionIndex: 0,
        mockStarted: false,
        mockStartedAt: null,
        results: null,
      }),
    }),
    {
      name: 'hirely-interview-flow-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only the user's default preferences — not the in-flight mock state
      partialize: (state) => ({
        experienceLevel: state.experienceLevel,
        difficulty: state.difficulty,
        language: state.language,
        questionCount: state.questionCount,
        timeLimitPerQuestion: state.timeLimitPerQuestion,
      }),
    }
  )
);

export default useInterviewFlowStore;
