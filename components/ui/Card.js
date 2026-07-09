import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../../constants/theme';

const Card = ({ children, style, variant = 'default', padding = 'md' }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return Colors.primary + '20';
      case 'success': return Colors.success + '20';
      case 'warning': return Colors.warning + '20';
      case 'error': return Colors.error + '20';
      default: return Colors.backgroundCard;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'primary': return Colors.primary + '40';
      case 'success': return Colors.success + '40';
      case 'warning': return Colors.warning + '40';
      case 'error': return Colors.error + '40';
      default: return Colors.border;
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
      {
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
        padding: getPadding(),
      },
      style,
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadows.small,
  },
});

export default Card;