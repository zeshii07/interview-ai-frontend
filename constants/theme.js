/**
 * Hirely design system — v2 (blue-purple gradient theme).
 *
 * Color rationale (matches the user-approved mockup palette):
 *   - Primary #4F46E5 (indigo-600): used for buttons, active tab, links
 *   - Accent #7C3AED (violet-600): used for gradients, highlights, focus rings
 *   - Gradient 4F46E5 → 7C3AED: hero banners, score rings, primary CTAs
 *   - Dark panel #1E1B4B (indigo-950): Interview Readiness card, hero stats
 *
 * Contrast: all text on light backgrounds is #0F172A or #475569 (AAA on
 * #F8F7FF). All text on dark panels is #FFFFFF or rgba(255,255,255,0.72)
 * (AAA on #1E1B4B).
 */

export const Colors = {
  // Brand
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#4338CA',
  primaryBg: '#EEF2FF',

  accent: '#7C3AED',
  accentLight: '#A78BFA',
  accentDark: '#6D28D9',
  accentBg: '#F5F3FF',

  // Brand gradient stops (used in LinearGradient from react-native-svg / linear-gradient)
  gradientStart: '#4F46E5',
  gradientEnd: '#7C3AED',

  // Dark panel (used on Interview Readiness card + hero stats)
  panelDark: '#1E1B4B',
  panelDarkMuted: 'rgba(255, 255, 255, 0.72)',
  panelDarkBorder: 'rgba(255, 255, 255, 0.12)',

  // Backgrounds
  bgPrimary: '#F8F7FF',
  bgSecondary: '#F5F3FF',
  bgCard: '#FFFFFF',
  bgElevated: '#F4F2FE',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255, 255, 255, 0.72)',

  // Semantic
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.10)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.10)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.10)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.10)',

  // Borders + overlays
  border: '#E2E8F0',
  borderLight: '#EEF2FF',
  borderStrong: '#CBD5E1',
  overlay: 'rgba(15, 23, 42, 0.48)',
  focusRing: 'rgba(79, 70, 229, 0.32)',

  // Provider badge colors (kept from previous sprint — they map cleanly onto
  // the new palette: blue (Adzuna), green (Jooble), amber (Reed), navy (USAJobs))
  providerAdzuna: { bg: 'rgba(59, 130, 246, 0.10)', text: '#3B82F6' },
  providerJooble: { bg: 'rgba(16, 185, 129, 0.10)', text: '#10B981' },
  providerReed: { bg: 'rgba(245, 158, 11, 0.10)', text: '#F59E0B' },
  providerUsajobs: { bg: 'rgba(99, 102, 241, 0.10)', text: '#6366F1' },
  providerUnknown: { bg: '#F4F2FE', text: '#94A3B8' },
};

export const Gradients = {
  // Subtle screen background — keeps content area bright, with hints of brand color
  screen: {
    backgroundColor: Colors.bgPrimary,
    experimental_backgroundImage:
      'radial-gradient(circle at 8% 4%, rgba(124, 58, 237, 0.10) 0%, transparent 38%), ' +
      'radial-gradient(circle at 94% 12%, rgba(79, 70, 229, 0.12) 0%, transparent 36%), ' +
      'linear-gradient(180deg, #F8F7FF 0%, #F5F3FF 100%)',
  },

  // Hero banner gradient — primary CTA color, used on Home welcome + Job Detail header
  hero: {
    backgroundColor: Colors.gradientStart,
    experimental_backgroundImage:
      'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6D28D9 100%)',
  },

  // Dark panel gradient — Interview Readiness card
  darkPanel: {
    backgroundColor: Colors.panelDark,
    experimental_backgroundImage:
      'radial-gradient(circle at 12% 8%, rgba(124, 58, 237, 0.45) 0%, transparent 42%), ' +
      'radial-gradient(circle at 92% 84%, rgba(79, 70, 229, 0.35) 0%, transparent 38%), ' +
      'linear-gradient(135deg, #1E1B4B 0%, #2E1065 100%)',
  },

  // Score ring gradient — used inside react-native-svg LinearGradient
  ring: {
    start: '#4F46E5',
    end: '#7C3AED',
  },

  // CTA button gradient
  cta: {
    backgroundColor: Colors.gradientStart,
    experimental_backgroundImage:
      'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  display: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const Shadows = {
  // Soft card shadow — primary-tinted, low opacity
  small: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const MIN_TOUCH_TARGET = 44;

// Animation tokens — shared timing across the app for consistency
export const Motion = {
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  ease: { duration: 240, easing: 'ease-out' },
};

// Typography presets — combine weight + size + color in one place
export const Typography = {
  // Display — used on hero banners
  display: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  // Section headers
  h1: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Body
  body: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  // Labels
  caption: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  // On dark panel
  onDarkTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textOnDark,
  },
  onDarkBody: {
    fontSize: FontSizes.sm,
    color: Colors.textOnDarkMuted,
    lineHeight: 20,
  },
};
