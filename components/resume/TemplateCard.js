import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * TemplateCard
 *
 * Selectable card for one of the 6 resume templates. Shows icon, name,
 * description, and an optional badge ("Recommended", "For students", etc.).
 *
 * Props:
 *   template  : { id, name, description, icon, accent, badge? }
 *   selected  : boolean
 *   onPress    : () => void
 */
export default function TemplateCard({ template, selected, onPress }) {
  if (!template) return null;
  const accent = template.accent || Colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        selected && [styles.cardSelected, { borderColor: accent }],
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${accent}1A` }]}>
        <Ionicons
          name={typeof template.icon === 'string' ? template.icon : 'document-text-outline'}
          size={22}
          color={accent}
        />
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{template.name}</Text>
          {template.badge ? (
            <View style={[styles.badge, { backgroundColor: `${accent}1A` }]}>
              <Text style={[styles.badgeText, { color: accent }]}>{template.badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.description} numberOfLines={2}>{template.description}</Text>
      </View>

      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={selected ? accent : Colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cardSelected: {
    backgroundColor: Colors.primaryBg,
    ...Shadows.small,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
