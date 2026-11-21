import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';

/**
 * ComingSoonRow
 *
 * Compact single-line row for unreleased tools: small muted icon tile,
 * title, and a "Soon" pill on the right. Deliberately quieter than the
 * working tools — the grid stays reserved for things users can open now.
 * Not pressable.
 *
 * Props: title, icon, accent, accentBg
 */
export default function ComingSoonRow({ title, icon = 'cube-outline', accent, accentBg }) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconTile,
          { backgroundColor: accentBg || Colors.bgElevated },
        ]}
      >
        <Ionicons name={icon} size={16} color={accent || Colors.textMuted} />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.pill}>
        <Text style={styles.pillText}>Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pill: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
