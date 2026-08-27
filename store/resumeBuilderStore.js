import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const emptyExperience = () => ({
  role: '',
  company: '',
  location: '',
  duration: '',
  points: [''],
});

const emptyEducation = () => ({
  degree: '',
  institution: '',
  location: '',
  year: '',         // end date (e.g., "2024")
  startDate: '',    // start date (e.g., "2020") — new
  gpa: '',
});

const emptyProject = () => ({
  name: '',
  technologies: '',
  description: '',
});

const emptyCertification = () => ({
  name: '',
  issuer: '',
  year: '',
});

const emptyCustomSection = () => ({
  title: '',
  content: '',
});

const initialResume = {
  templateId: 'ats-classic',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  targetRole: '',
  jobDescription: '',
  summary: '',
  // Academic-template extras (used only when templateId === 'eu-academic' or 'academic-photo')
  nationality: '',
  dateOfBirth: '',
  placeOfBirth: '',
  languagesText: '',
  referencesText: '',
  // Photo (used only when templateId === 'academic-photo')
  photoBase64: '',     // base64-encoded image data (no data: prefix)
  photoMimeType: '',   // 'image/jpeg' or 'image/png'
  experience: [emptyExperience()],
  education: [emptyEducation()],
  skillsText: '',
  skills: [],
  projects: [],
  certifications: [],
  customSections: [],
};

const useResumeBuilderStore = create(persist((set) => ({
  draft: initialResume,
  optimizedResume: null,
  suggestions: [],
  builderHydrated: false,
  // 'ai' = server optimized, 'local' = passed through user input unchanged
  optimizationMode: null,
  // human-readable reason set when we fall back to local mode (e.g. server error)
  optimizationNote: '',
  setBuilderHydrated: (value) => set({ builderHydrated: Boolean(value) }),

  updateDraft: (field, value) =>
    set((state) => ({
      draft: { ...state.draft, [field]: value },
    })),

  updateArrayItem: (section, index, field, value) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [section]: state.draft[section].map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      },
    })),

  updateExperiencePoint: (experienceIndex, pointIndex, value) =>
    set((state) => ({
      draft: {
        ...state.draft,
        experience: state.draft.experience.map((item, itemIndex) =>
          itemIndex !== experienceIndex
            ? item
            : {
                ...item,
                points: item.points.map((point, index) =>
                  index === pointIndex ? value : point
                ),
              }
        ),
      },
    })),

  addExperiencePoint: (experienceIndex) =>
    set((state) => ({
      draft: {
        ...state.draft,
        experience: state.draft.experience.map((item, itemIndex) =>
          itemIndex === experienceIndex
            ? { ...item, points: [...item.points, ''] }
            : item
        ),
      },
    })),

  removeExperiencePoint: (experienceIndex, pointIndex) =>
    set((state) => ({
      draft: {
        ...state.draft,
        experience: state.draft.experience.map((item, itemIndex) => {
          if (itemIndex !== experienceIndex) return item;
          const points = item.points.filter((_, index) => index !== pointIndex);
          return { ...item, points: points.length ? points : [''] };
        }),
      },
    })),

  addSectionItem: (section) =>
    set((state) => {
      const factories = {
        experience: emptyExperience,
        education: emptyEducation,
        projects: emptyProject,
        certifications: emptyCertification,
        customSections: emptyCustomSection,
      };

      return {
        draft: {
          ...state.draft,
          [section]: [...state.draft[section], factories[section]()],
        },
      };
    }),

  removeSectionItem: (section, index) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [section]: state.draft[section].filter(
          (_, itemIndex) => itemIndex !== index
        ),
      },
    })),

  setOptimizedResult: (resume, suggestions = [], mode = 'ai', note = '') =>
    set({
      optimizedResume: resume,
      suggestions: Array.isArray(suggestions) ? suggestions : [],
      optimizationMode: mode,
      optimizationNote: typeof note === 'string' ? note : '',
    }),

  updateOptimizedField: (field, value) =>
    set((state) => ({
      optimizedResume: {
        ...state.optimizedResume,
        [field]: value,
      },
    })),

  replaceOptimizedResume: (resume) => set({ optimizedResume: resume }),

  resetBuilder: () =>
    set({
      draft: {
        ...initialResume,
        experience: [emptyExperience()],
        education: [emptyEducation()],
      },
      optimizedResume: null,
      suggestions: [],
      optimizationMode: null,
      optimizationNote: '',
    }),
}), {
  name: '@hirely_resume_builder',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    draft: state.draft,
    optimizedResume: state.optimizedResume,
    suggestions: state.suggestions,
    optimizationMode: state.optimizationMode,
    optimizationNote: state.optimizationNote,
  }),
  merge: (persistedState, currentState) => ({
    ...currentState,
    ...persistedState,
    draft: {
      ...initialResume,
      ...(persistedState?.draft || {}),
    },
  }),
  onRehydrateStorage: () => (state, error) => {
    if (error) console.error('Failed to restore resume draft:', error);
    if (state) state.setBuilderHydrated(true);
    else setTimeout(() => useResumeBuilderStore.setState({ builderHydrated: true }), 0);
  },
}));

export default useResumeBuilderStore;
