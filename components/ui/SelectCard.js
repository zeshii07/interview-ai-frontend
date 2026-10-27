import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * SelectCard
 *
 * A selectable card with icon + title + description.
 * Used on the interview type, role, and preference selection screens.
 *
 * Props:
 *   title       : string
 *   description : string?
 *   icon        : Ionicons name
 *   selected    : boolean
 *   onPress     : () => void
 *   trailing    : ReactNode?  (e.g. a small label or badge on the right)
 */
export default function SelectCard({
  title,
  description,
  icon = 'radio-button-off-outline',
  selected = false,
  onPress,
  trailing,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon}
          size={20}
          color={selected ? '#FFFFFF' : Colors.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, selected && styles.descriptionSelected]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>

      {trailing ? <View>{trailing}</View> : null}

      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={selected ? Colors.primary : Colors.textMuted}
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
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
    ...Shadows.small,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  titleSelected: {
    color: Colors.primary,
  },
  description: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  descriptionSelected: {
    color: Colors.textSecondary,
  },
});
