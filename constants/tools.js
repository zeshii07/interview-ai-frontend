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
 *   featured    — indigo highlight card
 *   comingSoon  — disabled card with a "Coming soon" chip
 *   homePrimary — shown in the Home "Your Career Tools" grid
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
  },
  {
    id: 'interview-readiness',
    title: 'Interview Readiness',
    shortTitle: 'Interview\nReadiness',
    description: 'Check your preparation score',
    icon: 'pulse-outline',
    route: '/(tabs)/progress',
    category: 'Insights',
  },
  {
    id: 'find-jobs',
    title: 'Find Jobs',
    shortTitle: 'Find\nJobs',
    description: 'Search across job boards',
    icon: 'briefcase-outline',
    route: '/(tabs)/jobs',
    category: 'Career',
  },
  {
    id: 'ai-coach',
    title: 'AI Coach',
    shortTitle: 'AI\nCoach',
    description: 'Personalized coaching',
    icon: 'headset-outline',
    category: 'Insights',
    comingSoon: true,
  },
  {
    id: 'salary-insights',
    title: 'Salary Insights',
    shortTitle: 'Salary\nInsights',
    description: 'Compare salaries for your role',
    icon: 'cash-outline',
    category: 'Career',
    comingSoon: true,
  },
];

export function getHomePrimaryTools() {
  return TOOLS.filter((tool) => tool.homePrimary);
}

export function getHomeComingSoonTools() {
  // Small preview of what's next — always the last N comingSoon tools.
  return TOOLS.filter((tool) => tool.comingSoon).slice(0, 2);
}

export function getToolsByCategory(category = 'All') {
  if (category === 'All') return TOOLS;
  return TOOLS.filter((tool) => tool.category === category);
}
