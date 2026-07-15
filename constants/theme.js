export const Colors = {
  primary: '#5B35E8', primaryLight: '#6D4AF0', primaryDark: '#3F22B8', primaryBg: '#EEE9FF',
  secondary: '#087F8C', secondaryLight: '#D9F6F7',
  bgPrimary: '#F8F7FF', bgSecondary: '#F0F4FF', bgCard: '#FFFFFF', bgElevated: '#F4F1FF',
  textPrimary: '#151329', textSecondary: '#444258', textMuted: '#676579',
  success: '#087A55', warning: '#A85C08', error: '#B92F45', info: '#245FC7',
  border: '#DDD9EC', borderLight: '#CDC5E8', overlay: 'rgba(21, 19, 41, 0.48)',
  focusRing: 'rgba(91, 53, 232, 0.28)',
};

// Color stays near the edges so content retains a bright, high-contrast center.
export const Gradients = {
  screen: {
    backgroundColor: Colors.bgPrimary,
    experimental_backgroundImage: 'radial-gradient(circle at 8% 4%, rgba(214, 232, 255, 0.95) 0%, transparent 38%), radial-gradient(circle at 94% 18%, rgba(232, 218, 255, 0.9) 0%, transparent 34%), linear-gradient(145deg, #FBFDFF 0%, #F7F4FF 52%, #F1FAFF 100%)',
  },
  hero: {
    backgroundColor: '#EEE9FF',
    experimental_backgroundImage: 'linear-gradient(135deg, #E9F4FF 0%, #EFE8FF 48%, #FAF1FF 100%)',
  },
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const FontSizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, xxxl: 36 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const Shadows = {
  small: { boxShadow: '0 3px 12px rgba(48, 37, 91, 0.08)' },
  medium: { boxShadow: '0 10px 28px rgba(48, 37, 91, 0.11)' },
  primary: { boxShadow: '0 8px 20px rgba(91, 53, 232, 0.22)' },
};
export const MIN_TOUCH_TARGET = 44;
