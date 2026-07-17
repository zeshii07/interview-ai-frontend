import { create } from 'zustand';

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
  year: '',
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

const initialResume = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  portfolio: '',
  targetRole: '',
  jobDescription: '',
  summary: '',
  experience: [emptyExperience()],
  education: [emptyEducation()],
  skillsText: '',
  skills: [],
  projects: [],
  certifications: [],
};

const useResumeBuilderStore = create((set) => ({
  draft: initialResume,
  optimizedResume: null,
  suggestions: [],

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

  setOptimizedResult: (resume, suggestions = []) =>
    set({
      optimizedResume: resume,
      suggestions: Array.isArray(suggestions) ? suggestions : [],
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
    }),
}));

export default useResumeBuilderStore;
