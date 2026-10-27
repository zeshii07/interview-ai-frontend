import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';

/**
 * FilterChip
 *
 * A small selectable pill used for quick filter toggles (Remote /
 * Full-time / Past 24h, etc.). Two variants: filled (selected) or
 * outline (unselected).
 *
 * Props:
 *   label    : string
 *   selected : boolean
 *   onPress  : () => void
 *   icon     : Ionicons name? (rendered on the left when selected)
 *   variant  : 'default' | 'accent'  — accent uses violet instead of indigo
 */
export default function FilterChip({
  label,
  selected = false,
  onPress,
  icon,
  variant = 'default',
}) {
  const activeColor = variant === 'accent' ? Colors.accent : Colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: activeColor, borderColor: activeColor }
          : { backgroundColor: Colors.bgCard, borderColor: Colors.border },
      ]}
    >
      {selected && icon && typeof icon === 'string' ? (
        <Ionicons name={icon} size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: selected ? '#FFFFFF' : Colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
