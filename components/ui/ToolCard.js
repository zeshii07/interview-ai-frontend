import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * ToolCard
 *
 * A card on the Home / Tools grid. Icon + title + description.
 *
 * Layout contract (keeps every card in the grid exactly the same height):
 *   Row 1: icon (40) — [coming-soon chip, right-aligned]
 *   Row 2: title    (up to 2 lines, fixed lineHeight)
 *   Row 3: desc     (up to 2 lines, fixed lineHeight)
 * The card uses minHeight (never a fixed height) so nothing is ever
 * clipped, and because every card renders the same three rows with the
 * same line counts, auto-height is identical across the grid.
 *
 * Variants:
 *   - default    : white card with subtle shadow, purple icon background
 *   - featured   : indigo card with white text (used for primary CTA tools)
 *   - comingSoon : muted card with a "Coming soon" chip next to the icon
 */
export default function ToolCard({
  title,
  description,
  icon = 'cube-outline',
  onPress,
  featured = false,
  comingSoon = false,
}) {
  const isDisabled = comingSoon || !onPress;

  const Wrapper = isDisabled ? View : TouchableOpacity;

  return (
    <Wrapper
      style={[
        styles.card,
        featured && styles.cardFeatured,
        comingSoon && styles.cardDisabled,
      ]}
      onPress={isDisabled ? undefined : onPress}
      activeOpacity={0.85}
    >
      {featured ? <View style={styles.featuredOverlay} pointerEvents="none" /> : null}

      <View style={styles.iconRow}>
        <View
          style={[
            styles.iconWrap,
            featured && styles.iconWrapFeatured,
            comingSoon && styles.iconWrapDisabled,
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={featured ? '#FFFFFF' : Colors.primary}
          />
        </View>

        {comingSoon ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming soon</Text>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, marginTop: Spacing.sm }}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, featured && styles.titleFeatured]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {!comingSoon && !featured ? (
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          ) : null}
        </View>

        {description ? (
          <Text
            style={[styles.description, featured && styles.descriptionFeatured]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    // minHeight (not height) guarantees equal-height cards across the grid
    // (every card renders the same 3 rows) while never clipping content —
    // the previous fixed height:148 cut off the "Coming soon" badge and the
    // second description line on dense cards.
    minHeight: 148,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  cardFeatured: {
    backgroundColor: Colors.gradientStart,
    borderColor: 'transparent',
    ...Shadows.primary,
  },
  // RN has no CSS backgroundImage; approximate the brand gradient the same
  // way GradientHero does — a solid indigo base plus a soft radial overlay.
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderTopRightRadius: Radius.xl,
    borderBottomLeftRadius: Radius.lg,
    opacity: 0.5,
  },
  cardDisabled: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.border,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFeatured: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  iconWrapDisabled: {
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
  comingSoonBadge: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 19,
  },
  titleFeatured: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  descriptionFeatured: {
    color: 'rgba(255, 255, 255, 0.80)',
  },
});
