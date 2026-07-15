import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import {
  Colors,
  FontSizes,
  MIN_TOUCH_TARGET,
  Radius,
  Shadows,
  Spacing,
} from '../../constants/theme';

const SIZE_STYLES = {
  small: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
  },
  medium: {
    minHeight: 50,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
  },
  large: {
    minHeight: 56,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
  },
};

const getVariantStyle = (variant, disabled) => {
  if (disabled) {
    return {
      container: {
        backgroundColor: Colors.bgElevated,
        borderColor: Colors.border,
        borderWidth: 1,
      },
      text: Colors.textMuted,
      loader: Colors.textMuted,
    };
  }

  switch (variant) {
    case 'secondary':
      return {
        container: {
          backgroundColor: Colors.secondary,
          borderColor: Colors.secondary,
          borderWidth: 1,
        },
        text: Colors.textPrimary,
        loader: Colors.textPrimary,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderColor: Colors.borderLight,
          borderWidth: 1,
        },
        text: Colors.textPrimary,
        loader: Colors.primary,
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 1,
        },
        text: Colors.primaryLight || Colors.primary,
        loader: Colors.primary,
      };
    case 'primary':
    default:
      return {
        container: {
          backgroundColor: Colors.primary,
          borderColor: Colors.primary,
          borderWidth: 1,
        },
        text: Colors.textPrimary,
        loader: Colors.textPrimary,
      };
  }
};

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
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const isDisabled = disabled || loading;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.medium;
  const variantStyle = getVariantStyle(variant, disabled);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={size === 'small' ? 8 : undefined}
      style={({ pressed }) => [
        styles.button,
        variantStyle.container,
        {
          minHeight: sizeStyle.minHeight,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
        fullWidth && styles.fullWidth,
        variant === 'primary' && !isDisabled && Shadows.primary,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.loader} size="small" />
      ) : (
        <>
          {icon}
          <Text
            numberOfLines={1}
            style={[
              styles.text,
              { color: variantStyle.text, fontSize: sizeStyle.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.985 }],
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

export default Button;
