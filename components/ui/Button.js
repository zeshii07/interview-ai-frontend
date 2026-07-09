import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/theme';

export const ButtonVariants = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
};

export const ButtonSizes = {
  small: 'small',
  medium: 'medium',
  large: 'large',
};

const Button = ({ 
  title, 
  onPress, 
  variant = ButtonVariants.primary, 
  size = ButtonSizes.medium,
  disabled = false, 
  loading = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return Colors.textMuted;
    switch (variant) {
      case 'primary': return Colors.primary;
      case 'secondary': return Colors.secondary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.background;
    switch (variant) {
      case 'primary': return Colors.text;
      case 'secondary': return Colors.background;
      case 'outline': return Colors.primary;
      case 'ghost': return Colors.primaryLight;
      default: return Colors.text;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm };
      case 'medium': return { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md };
      case 'large': return { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg };
      default: return { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return FontSizes.sm;
      case 'medium': return FontSizes.md;
      case 'large': return FontSizes.lg;
      default: return FontSizes.md;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? Colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          ...getPadding(),
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
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
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button;