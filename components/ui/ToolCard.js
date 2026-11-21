import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * ToolCard
 *
 * Vertical card for the 2-column tool grids (Home + Tools). Every tool has
 * its own accent color (icon tile tint + matching top strip) so the grid
 * feels varied rather than one brand color repeated everywhere.
 *
 * Layout contract (keeps every card in the grid exactly the same height):
 *   Row 1: icon tile (44) with a 3pt accent strip on top
 *   Row 2: title    (up to 2 lines, fixed lineHeight)
 *   Row 3: desc     (up to 2 lines, fixed lineHeight)
 * minHeight (never fixed height) so nothing is ever clipped, and because
 * every card renders the same rows, auto-height is identical across the
 * grid.
 *
 * Coming-soon tools are NOT rendered with this card — they use the quieter
 * ComingSoonRow list.
 *
 * Props: title, description, icon, accent, accentBg, onPress
 */
export default function ToolCard({
  title,
  description,
  icon = 'cube-outline',
  accent,
  accentBg,
  onPress,
}) {
  const tileBg = accentBg || Colors.primaryBg;
  const iconColor = accent || Colors.primary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.accentStrip, { backgroundColor: iconColor }]} />

      <View style={styles.iconTileWrap}>
        <View style={[styles.iconTile, { backgroundColor: tileBg }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Ionicons
          name="arrow-forward"
          size={14}
          color={Colors.textMuted}
          style={styles.miniArrow}
        />
      </View>

      <View style={{ flex: 1, marginTop: Spacing.sm }}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingRight: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 0,
    // minHeight (not height) guarantees equal-height cards across the grid
    // (every card renders the same rows) while never clipping content.
    minHeight: 148,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.small,
  },
  // 3pt colored strip along the card's top edge — subtle per-tool identity
  accentStrip: {
    height: 3,
    marginLeft: -1,
    marginRight: -1,
    marginTop: -1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    opacity: 0.9,
  },
  iconTileWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniArrow: {
    opacity: 0.7,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  description: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
});
