import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * HeroToolCard
 *
 * The big flagship card at the top of Home: indigo base with the same soft
 * overlay treatment GradientHero uses, large icon tile, title, one-line
 * benefit and a white "Start now" pill. Deliberately the tallest, loudest
 * card on the screen so the primary CTA stands out from the grids below.
 */
export default function HeroToolCard({ title, description, icon, badge, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.overlay1} pointerEvents="none" />
      <View style={styles.overlay2} pointerEvents="none" />

      <View style={styles.topRow}>
        <View style={styles.iconTile}>
          <Ionicons name={icon || 'sparkles-outline'} size={26} color="#FFFFFF" />
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Ionicons name="flash" size={11} color="#FFFFFF" />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
        <View style={styles.ctaPill}>
          <Text style={styles.ctaText}>Start now</Text>
          <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.gradientStart,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.primary,
  },
  // RN has no CSS gradients — layer soft translucent shapes like GradientHero
  overlay1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderTopRightRadius: Radius.xxl,
    borderBottomLeftRadius: Radius.xl,
    opacity: 0.5,
  },
  overlay2: {
    position: 'absolute',
    right: -40,
    bottom: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.80)',
    marginTop: 3,
    lineHeight: 17,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  ctaText: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: Colors.primary,
  },
});
