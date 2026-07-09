import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../../constants/theme';

const Card = ({ children, style, variant = 'default', padding = 'md' }) => {
  const getStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primaryBg,
          borderColor: Colors.primary + '30',
          borderWidth: 1,
        };
      case 'success':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderColor: Colors.success + '20',
          borderWidth: 1,
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          borderColor: Colors.warning + '20',
          borderWidth: 1,
        };
      case 'error':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          borderColor: Colors.error + '20',
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: Colors.bgCard,
          borderColor: Colors.border,
          borderWidth: 1,
        };
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return Spacing.sm;
      case 'md': return Spacing.md;
      case 'lg': return Spacing.lg;
      default: return Spacing.md;
    }
  };

  return (
    <View style={[
      styles.card,
      getStyle(),
      { padding: getPadding() },
      Shadows.small,
      style,
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden', // Important for glass effect
  },
});

export default Card;