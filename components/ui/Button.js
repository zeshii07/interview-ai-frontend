import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * Button
 *
 * Variants:
 *   - primary   : brand gradient (4F46E5 → 7C3AED), white text, primary shadow
 *   - secondary : white background, indigo border + text
 *   - ghost     : transparent background, indigo text only
 *   - dark      : dark panel color, used inside StatCard
 *
 * Sizes:
 *   - sm        : compact (used inside dense rows like Job Detail apply bar)
 *   - md        : default
 *   - lg        : hero CTA on Home
 *
 * Props:
 *   label, onPress, icon (Ionicons name), loading, disabled, fullWidth
 */
export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIconColor(variant)} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={getIconSize(size)} color={getIconColor(variant)} style={{ marginRight: 6 }} />
          ) : null}
          <Text style={[styles.label, { color: getTextColor(variant), fontSize: getFontSize(size) }]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={getIconSize(size)} color={getIconColor(variant)} style={{ marginLeft: 6 }} />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

function getTextColor(variant) {
  return {
    primary: '#FFFFFF',
    secondary: Colors.primary,
    ghost: Colors.primary,
    dark: '#FFFFFF',
  }[variant] || Colors.textPrimary;
}

function getIconColor(variant) {
  return getTextColor(variant);
}

function getFontSize(size) {
  return { sm: FontSizes.sm, md: FontSizes.md, lg: FontSizes.lg }[size] || FontSizes.md;
}

function getIconSize(size) {
  return { sm: 13, md: 16, lg: 18 }[size] || 16;
}

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.gradientStart,
    backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    ...Shadows.primary,
  },
  secondary: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  dark: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
