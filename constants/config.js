// Always use the live Railway URL for both development and production
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
  'Product Manager'
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