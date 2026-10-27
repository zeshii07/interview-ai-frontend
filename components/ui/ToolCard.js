import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * ToolCard
 *
 * A card on the Home / Tools grid. Icon + title + description + chevron.
 *
 * Variants:
 *   - default    : white card with subtle shadow, purple icon background
 *   - featured   : gradient background, white text (used for the primary CTA tool)
 *   - comingSoon : white card with muted "Coming soon" badge
 *
 * Props:
 *   title, description, icon (Ionicons name), route, onPress
 *   featured?: boolean
 *   comingSoon?: boolean
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

        {comingSoon ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming soon</Text>
          </View>
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
    minHeight: 132,
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  cardFeatured: {
    backgroundColor: Colors.gradientStart,
    borderColor: 'transparent',
    backgroundImage:
      'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    ...Shadows.primary,
  },
  cardDisabled: {
    opacity: 0.85,
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.border,
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
  comingSoonBadge: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
