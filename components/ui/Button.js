import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/theme';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false, 
  loading = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const getStyle = () => {
    if (disabled) return { backgroundColor: Colors.bgElevated };
    switch (variant) {
      case 'primary': return { backgroundColor: Colors.primary };
      case 'secondary': return { backgroundColor: Colors.secondary };
      case 'outline': return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.borderLight };
      case 'ghost': return { backgroundColor: 'transparent' };
      default: return { backgroundColor: Colors.primary };
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textMuted;
    return Colors.textPrimary;
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm };
      case 'medium': return { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md };
      case 'large': return { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg };
      default: return { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getStyle(),
        getPadding(),
        fullWidth && styles.fullWidth,
        variant === 'primary' && !disabled && Shadows.primary,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor(), fontSize: size === 'large' ? FontSizes.lg : FontSizes.md }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button;