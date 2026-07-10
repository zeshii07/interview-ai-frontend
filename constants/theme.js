// export const Colors = {
//   // Primary (Deep Indigo/Purple - Very professional)
//   primary: '#7C3AED',
//   primaryLight: '#A78BFA',
//   primaryDark: '#5B21B6',
//   primaryBg: 'rgba(124, 58, 237, 0.1)',
  
//   // Secondary (Cyan/Teal for contrast)
//   secondary: '#06B6D4',
//   secondaryLight: '#67E8F9',
  
//   // Backgrounds (Rich Dark Mode - Not pure black)
//   bgPrimary: '#0B0D17',
//   bgSecondary: '#111427',
//   bgCard: '#161933',
//   bgElevated: '#1E2147',
  
//   // Text
//   textPrimary: '#F8FAFC',
//   textSecondary: '#94A3B8',
//   textMuted: '#64748B',
  
//   // Status
//   success: '#10B981',
//   warning: '#F59E0B',
//   error: '#EF4444',
//   info: '#3B82F6',
  
//   // Borders (Very subtle)
//   border: 'rgba(255, 255, 255, 0.06)',
//   borderLight: 'rgba(255, 255, 255, 0.1)',
// };

// export const Spacing = {
//   xs: 4,
//   sm: 8,
//   md: 16,
//   lg: 24,
//   xl: 32,
//   xxl: 48,
// };

// export const FontSizes = {
//   xs: 12,
//   sm: 14,
//   md: 16,
//   lg: 18,
//   xl: 22,
//   xxl: 28,
//   xxxl: 36,
// };

// export const Radius = {
//   sm: 8,
//   md: 12,
//   lg: 16,
//   xl: 24,
//   full: 9999,
// };

// export const Shadows = {
//   small: {
//     shadowColor: '#000000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   medium: {
//     shadowColor: '#000000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.2,
//     shadowRadius: 16,
//     elevation: 8,
//   },
//   primary: {
//     shadowColor: '#7C3AED',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 6,
//   }
// };


export const Colors = {
  // Primary (Deep Indigo/Purple - Very professional)
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryBg: 'rgba(124, 58, 237, 0.1)',

  // Secondary (Cyan/Teal for contrast)
  secondary: '#06B6D4',
  secondaryLight: '#67E8F9',

  // Backgrounds (Rich Dark Mode - Not pure black)
  bgPrimary: '#0B0D17',
  bgSecondary: '#111427',
  bgCard: '#161933',
  bgElevated: '#1E2147',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Borders (Very subtle)
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.1)',

  // Overlay / focus (used by modals, loading states, and accessible focus rings)
  overlay: 'rgba(6, 7, 15, 0.82)',
  focusRing: 'rgba(124, 58, 237, 0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Minimum touch target per iOS HIG / Material guidance — reuse anywhere a
// tappable element might otherwise render smaller than this.
export const MIN_TOUCH_TARGET = 44;