import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * WideToolCard
 *
 * A full-width horizontal tool card: tinted icon tile on the left, title +
 * description in the middle, chevron on the right. Used for the
 * "Recommended" cards on the Tools screen and the slim full-width cards on
 * Home — a deliberately different shape from the 2-column ToolCard grid so
 * the screens don't feel like the same card everywhere.
 *
 * Variants:
 *   - default : white card, per-tool tinted icon tile
 *   - featured: indigo card with white text (primary recommendations)
 *
 * Props:
 *   title, description, icon, accent, accentBg, onPress
 *   featured?: boolean
 */
export default function WideToolCard({
  title,
  description,
  icon = 'cube-outline',
  accent,
  accentBg,
  onPress,
  featured = false,
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const tileBg = featured ? 'rgba(255, 255, 255, 0.20)' : accentBg || Colors.primaryBg;
  const iconColor = featured ? '#FFFFFF' : accent || Colors.primary;

  return (
    <Wrapper
      style={[styles.card, featured && styles.cardFeatured]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {featured ? <View style={styles.featuredOverlay} pointerEvents="none" /> : null}

      <View style={[styles.iconTile, { backgroundColor: tileBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>

      <View style={styles.copy}>
        <Text
          style={[styles.title, featured && styles.titleFeatured]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={[styles.description, featured && styles.descriptionFeatured]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={featured ? 'rgba(255, 255, 255, 0.85)' : Colors.textMuted}
      />
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.small,
  },
  cardFeatured: {
    backgroundColor: Colors.gradientStart,
    borderColor: 'transparent',
    ...Shadows.primary,
  },
  // RN has no CSS backgroundImage — approximate the brand gradient the same
  // way GradientHero does (solid indigo base + soft radial overlay).
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderTopRightRadius: Radius.xl,
    borderBottomLeftRadius: Radius.lg,
    opacity: 0.5,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  titleFeatured: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  descriptionFeatured: {
    color: 'rgba(255, 255, 255, 0.80)',
  },
});
