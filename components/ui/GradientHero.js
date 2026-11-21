import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Elevation, Glass, Gradients, Typography } from '../../constants/theme';

/**
 * GradientHero
 *
 * The blue-purple gradient banner used at the top of the Home screen and
 * on Job Detail. Renders a title, optional subtitle, and optional trailing
 * icon (avatar, settings gear, etc.).
 *
 * On React Native we can't use CSS gradients on a View, so we approximate
 * the mockup's gradient by layering two semi-transparent radial overlays
 * on top of a solid indigo base. The result reads as a near-identical
 * gradient on device.
 *
 * Props:
 *   title       : string
 *   subtitle    : string
 *   icon        : Ionicons name (rendered on the right)
 *   onIconPress : () => void
 *   children    : ReactNode (rendered below the title row — e.g. a search bar)
 */
export default function GradientHero({ title, subtitle, icon, onIconPress, children, style }) {
  return (
    <View style={[styles.hero, style]}>
      <View style={styles.heroContent}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          {icon ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onIconPress}
              activeOpacity={0.8}
              disabled={!onIconPress}
            >
              <Ionicons name={icon} size={20} color={Colors.textOnDark} />
            </TouchableOpacity>
          ) : null}
        </View>

        {children}
      </View>

      {/* Decorative radial overlays — give the hero a soft two-tone gradient feel */}
      <View style={styles.overlay1} pointerEvents="none" />
      <View style={styles.overlay2} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...Gradients.hero, // solid indigo base + experimental gradient image
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    overflow: 'hidden',
    paddingBottom: Spacing.lg,
    ...Elevation.glowPrimary,
  },
  heroContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    position: 'relative',
    zIndex: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textOnDark,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textOnDarkMuted,
    marginTop: 2,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Glass.fillOnDark,
    borderWidth: 1,
    borderColor: Glass.hairlineOnDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.45)',
    zIndex: 1,
  },
  overlay2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(99, 102, 241, 0.30)',
    zIndex: 1,
  },
});
