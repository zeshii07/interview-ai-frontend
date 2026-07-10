// Change this to your computer's IP when testing on physical device
// Use 'http://localhost:5000' for emulator
// Use 'http://YOUR_IP:5000' for physical device
export const API_BASE_URL = __DEV__ 
  ? 'interview-i-backend-production.up.railway.app'  // Changed to match your browser!
  : 'https://your-production-url.com';

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