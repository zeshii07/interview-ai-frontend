// Always use the live backend URL for both development and production
// so that the app works when you build the APK
export const API_BASE_URL = 'https://hirely-backend-3nzs.onrender.com';

export const ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'DevOps Engineer',
  'Data Scientist',
  'UI/UX Designer',
  'Product Manager',
];

export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: '#00B894', icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', color: '#FDCB6E', icon: '⚡' },
  { value: 'expert', label: 'Expert', color: '#FF6B6B', icon: '🔥' },
];

export const QUESTION_TYPES = [
  { value: 'behavioral', label: 'Behavioral', icon: '🧠' },
  { value: 'technical', label: 'Technical', icon: '💻' },
  { value: 'situational', label: 'Situational', icon: '🎯' },
];

// ─── Job search ─────────────────────────────────────────────────────────────

export const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

export const DATE_POSTED_OPTIONS = [
  { value: '24h', label: 'Past 24 hours' },
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
];

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry-level' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

export const SALARY_PRESETS = [
  { value: null, label: 'Any salary' },
  { value: { min: 30000, max: null }, label: '$30k+' },
  { value: { min: 60000, max: null }, label: '$60k+' },
  { value: { min: 100000, max: null }, label: '$100k+' },
  { value: { min: 150000, max: null }, label: '$150k+' },
  { value: { min: 200000, max: null }, label: '$200k+' },
];

// Curated skills suggestions for the skills chip input
export const COMMON_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'React Native',
  'Node.js',
  'Python',
  'Java',
  'Kotlin',
  'Swift',
  'Go',
  'Rust',
  'AWS',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'MongoDB',
  'GraphQL',
  'REST API',
  'CI/CD',
  'Machine Learning',
  'TensorFlow',
  'PyTorch',
  'Data Analysis',
  'Figma',
  'UI/UX',
  'Product Management',
  'Agile',
  'Scrum',
  'Communication',
  'Leadership',
];
