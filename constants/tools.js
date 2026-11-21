/**
 * Single source of truth for every tool surfaced in the app.
 *
 * Both the Home screen and the Tools screen render from this list, so a
 * tool can never be "Coming soon" in one place and fully working in
 * another, and names/descriptions always match.
 *
 * Fields:
 *   id          — stable identifier (also used as React key)
 *   title       — canonical full name (Tools screen, detail headers)
 *   shortTitle  — two-line title used in the compact Home grid
 *                 ('\n' forces a predictable line break)
 *   description — one-line benefit copy (keep <= ~34 chars so it fits
 *                 two lines in a half-width card)
 *   icon        — Ionicons outline name
 *   route       — expo-router path; omit for comingSoon tools
 *   category    — chip filter on the Tools screen
 *   featured    — shown as a full-width "Recommended" card on the Tools
 *                 screen; the flagship tool is also the Home hero card
 *   comingSoon  — disabled, rendered in the compact "Coming soon" list
 *   homePrimary — shown in the Home "Your Career Tools" section
 *   homeHero    — Home flagship, rendered as the big hero card
 *   homeWide    — rendered as a full-width slim card on Home (under the
 *                 2-col grid)
 *   accent/accentBg — per-tool tint so the grid feels varied and modern
 *                     (icon color + light tile background) instead of a
 *                     single brand color for everything
 */

export const TOOL_CATEGORIES = ['All', 'Resume', 'Interview', 'Insights', 'Career'];

export const TOOLS = [
  {
    id: 'resume-generator',
    title: 'ATS Resume Generator',
    shortTitle: 'ATS Resume\nGenerator',
    description: 'Generate a pro PDF resume',
    icon: 'document-text-outline',
    route: '/resume/generator',
    category: 'Resume',
    featured: true,
    homePrimary: true,
    homeHero: true,
    accent: '#4F46E5',
    accentBg: '#EEF2FF',
  },
  {
    id: 'resume-analyze',
    title: 'Analyze Your Resume',
    shortTitle: 'Analyze Your\nResume',
    description: 'AI-powered resume scoring',
    icon: 'analytics-outline',
    route: '/resume/analyze',
    category: 'Resume',
    homePrimary: true,
    accent: '#7C3AED',
    accentBg: '#F5F3FF',
  },
  {
    id: 'mock-interview',
    title: 'AI Mock Interview',
    shortTitle: 'AI Mock\nInterview',
    description: 'Full simulated interview',
    icon: 'mic-outline',
    route: '/interview/type',
    category: 'Interview',
    featured: true,
    homePrimary: true,
    accent: '#0F766E',
    accentBg: '#F0FDFA',
  },
  {
    id: 'question-bank',
    title: 'Question Bank',
    shortTitle: 'Question\nBank',
    description: 'Practice key interview questions',
    icon: 'help-circle-outline',
    route: '/questions',
    category: 'Interview',
    homePrimary: true,
    homeWide: true,
    accent: '#D97706',
    accentBg: '#FFFBEB',
  },
  {
    id: 'interview-readiness',
    title: 'Interview Readiness',
    shortTitle: 'Interview\nReadiness',
    description: 'Check your preparation score',
    icon: 'pulse-outline',
    route: '/(tabs)/progress',
    category: 'Insights',
    accent: '#E11D48',
    accentBg: '#FFF1F2',
  },
  {
    id: 'find-jobs',
    title: 'Find Jobs',
    shortTitle: 'Find\nJobs',
    description: 'Search across job boards',
    icon: 'briefcase-outline',
    route: '/(tabs)/jobs',
    category: 'Career',
    accent: '#2563EB',
    accentBg: '#EFF6FF',
  },
  {
    id: 'ai-coach',
    title: 'AI Coach',
    shortTitle: 'AI\nCoach',
    description: 'Personalized coaching',
    icon: 'headset-outline',
    category: 'Insights',
    comingSoon: true,
    accent: '#64748B',
    accentBg: '#F8FAFC',
  },
  {
    id: 'salary-insights',
    title: 'Salary Insights',
    shortTitle: 'Salary\nInsights',
    description: 'Compare salaries for your role',
    icon: 'cash-outline',
    category: 'Career',
    comingSoon: true,
    accent: '#059669',
    accentBg: '#ECFDF5',
  },
];

export function getToolById(id) {
  return TOOLS.find((tool) => tool.id === id) || null;
}

export function getFeaturedTools() {
  return TOOLS.filter((tool) => tool.featured);
}

export function getActiveTools() {
  return TOOLS.filter((tool) => !tool.comingSoon && !tool.featured);
}

export function getComingSoonTools() {
  return TOOLS.filter((tool) => tool.comingSoon);
}

/** Home: flagship tool rendered as the big hero card. */
export function getHomeHeroTool() {
  return TOOLS.find((tool) => tool.homeHero) || null;
}

/** Home: tools rendered in the 2-column grid under the hero. */
export function getHomeGridTools() {
  return TOOLS.filter(
    (tool) => tool.homePrimary && !tool.homeHero && !tool.homeWide
  );
}

/** Home: tool rendered as the full-width slim card under the grid. */
export function getHomeWideTool() {
  return TOOLS.find((tool) => tool.homeWide) || null;
}

export function getHomeComingSoonTools() {
  return TOOLS.filter((tool) => tool.comingSoon).slice(0, 2);
}

export function getToolsByCategory(category = 'All') {
  if (category === 'All') return TOOLS;
  return TOOLS.filter((tool) => tool.category === category);
}

/** Case-insensitive search over title + description + category. */
export function searchTools(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return null;
  return TOOLS.filter((tool) =>
    [tool.title, tool.description, tool.category]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}
