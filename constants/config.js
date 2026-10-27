// Always use the live backend URL for both development and production
export const API_BASE_URL = 'https://hirely-backend-3nzs.onrender.com';

export const ROLES = [
  { value: 'AI/ML Engineer', icon: 'brain-outline' },
  { value: 'Frontend Developer', icon: 'logo-react' },
  { value: 'Backend Developer', icon: 'server-outline' },
  { value: 'Full Stack Developer', icon: 'code-slash-outline' },
  { value: 'Mobile Developer', icon: 'phone-portrait-outline' },
  { value: 'DevOps Engineer', icon: 'git-branch-outline' },
  { value: 'Data Scientist', icon: 'analytics-outline' },
  { value: 'Cloud Engineer', icon: 'cloud-outline' },
  { value: 'UI/UX Designer', icon: 'color-palette-outline' },
  { value: 'Product Manager', icon: 'briefcase-outline' },
];

export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: '#10B981', icon: '🌱', description: 'Fundamentals and junior-level questions' },
  { value: 'intermediate', label: 'Intermediate', color: '#F59E0B', icon: '⚡', description: 'Practical implementation and trade-offs' },
  { value: 'expert', label: 'Expert', color: '#EF4444', icon: '🔥', description: 'Advanced architecture and complex scenarios' },
];

export const QUESTION_TYPES = [
  { value: 'behavioral', label: 'Behavioral', icon: '🧠' },
  { value: 'technical', label: 'Technical', icon: '💻' },
  { value: 'situational', label: 'Situational', icon: '🎯' },
];

export const INTERVIEW_TYPES = [
  { value: 'general', label: 'General', icon: 'chatbubbles-outline', description: 'Mixed practice questions across topics' },
  { value: 'role', label: 'Role-based', icon: 'briefcase-outline', description: 'Tailored to your specific role' },
  { value: 'technical', label: 'Technical', icon: 'code-slash-outline', description: 'Coding & system design deep-dives' },
  { value: 'behavioral', label: 'Behavioral', icon: 'people-outline', description: 'STAR-format people questions' },
  { value: 'mock', label: 'Mock Interview', icon: 'mic-outline', description: 'Full simulated interview session' },
];

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry (0-2 yrs)', icon: 'leaf-outline' },
  { value: 'mid', label: 'Mid (3-5 yrs)', icon: 'trending-up-outline' },
  { value: 'senior', label: 'Senior (6+ yrs)', icon: 'star-outline' },
  { value: 'lead', label: 'Lead / Manager', icon: 'people-circle-outline' },
];

export const LANGUAGES = [
  { value: 'English', label: 'English', code: 'EN' },
  { value: 'Urdu', label: 'Urdu', code: 'UR' },
  { value: 'Hindi', label: 'Hindi', code: 'HI' },
  { value: 'Arabic', label: 'Arabic', code: 'AR' },
  { value: 'Spanish', label: 'Spanish', code: 'ES' },
  { value: 'French', label: 'French', code: 'FR' },
  { value: 'German', label: 'German', code: 'DE' },
];

export const QUESTION_COUNT_OPTIONS = [
  { value: 5, label: '5 questions', description: 'Quick warm-up (~10 min)' },
  { value: 10, label: '10 questions', description: 'Standard session (~20 min)' },
  { value: 15, label: '15 questions', description: 'Deep practice (~30 min)' },
];

export const TIME_LIMIT_OPTIONS = [
  { value: 0, label: 'No limit', icon: 'infinite-outline' },
  { value: 60, label: '60s / question', icon: 'time-outline' },
  { value: 90, label: '90s / question', icon: 'time-outline' },
  { value: 120, label: '2 min / question', icon: 'time-outline' },
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

export const EXPERIENCE_FILTERS = [
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

export const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js',
  'Python', 'Java', 'Kotlin', 'Swift', 'Go', 'Rust',
  'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB',
  'GraphQL', 'REST API', 'CI/CD', 'Machine Learning',
  'TensorFlow', 'PyTorch', 'Data Analysis', 'Figma', 'UI/UX',
  'Product Management', 'Agile', 'Scrum', 'Communication', 'Leadership',
];
