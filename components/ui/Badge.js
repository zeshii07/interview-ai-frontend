import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';

/**
 * Badge
 *
 * Small status pill. Variants map to the semantic colors.
 *
 * Props:
 *   label   : string
 *   variant : 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
 *   icon    : Ionicons name? (rendered on the left)
 *   size    : 'sm' | 'md'
 */
export default function Badge({ label, variant = 'primary', icon, size = 'sm' }) {
  const variantStyles = {
    primary: { bg: Colors.primaryBg, text: Colors.primary },
    success: { bg: Colors.successBg, text: Colors.success },
    warning: { bg: Colors.warningBg, text: Colors.warning },
    error: { bg: Colors.errorBg, text: Colors.error },
    info: { bg: Colors.infoBg, text: Colors.info },
    neutral: { bg: Colors.bgElevated, text: Colors.textSecondary },
  };
  const vs = variantStyles[variant] || variantStyles.primary;

  const sizeStyles = {
    sm: { paddingY: 3, fontSize: FontSizes.xs, iconSize: 11 },
    md: { paddingY: 5, fontSize: FontSizes.sm, iconSize: 13 },
  }[size];

  return (
    <View style={[styles.badge, { backgroundColor: vs.bg, paddingVertical: sizeStyles.paddingY }]}>
      {icon && typeof icon === 'string' ? (
        <Ionicons name={icon} size={sizeStyles.iconSize} color={vs.text} style={{ marginRight: 3 }} />
      ) : null}
      <Text style={[styles.text, { color: vs.text, fontSize: sizeStyles.fontSize }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
