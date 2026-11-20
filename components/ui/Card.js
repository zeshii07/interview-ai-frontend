import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '../../constants/theme';

/**
 * Card — the generic design-system card container.
 *
 * This file previously (accidentally) contained a copy of ShareCard, which
 * ignores `children`/`style`/`padding` — so screens that used <Card> as a
 * container (e.g. the Question Bank) silently rendered a share-image card
 * instead of their content. This is now the plain white card container those
 * screens expect.
 *
 * Props:
 *   children : ReactNode
 *   style    : additional style for the card
 *   padding  : 'none' | 'sm' | 'md' | 'lg'   (default 'md')
 *   variant  : 'default' | 'error'           (error = red tinted border/background)
 *   onPress  : if provided, the card becomes touchable
 */
export default function Card({ children, style, padding = 'md', variant = 'default', onPress }) {
  const paddings = {
    none: 0,
    sm: Spacing.sm,
    md: Spacing.md,
    lg: Spacing.lg,
  };
  const pad = paddings[padding] !== undefined ? paddings[padding] : paddings.md;

  const baseStyle = [styles.card, { padding: pad }, variant === 'error' && styles.cardError, style];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={baseStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  cardError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
});
