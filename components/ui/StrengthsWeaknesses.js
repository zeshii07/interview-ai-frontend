import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';

/**
 * StrengthsWeaknesses
 *
 * Two-column list of strengths and weaknesses with icons.
 *
 * Props:
 *   strengths   : string[]
 *   weaknesses   : string[]
 */
export default function StrengthsWeaknesses({ strengths = [], weaknesses = [] }) {
  return (
    <View style={styles.container}>
      <View style={[styles.column, styles.strengthsCol]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, styles.strengthIcon]}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          </View>
          <Text style={styles.headerText}>Strengths</Text>
        </View>
        {strengths.length === 0 ? (
          <Text style={styles.emptyText}>No notable strengths yet.</Text>
        ) : (
          strengths.map((s, i) => (
            <View key={i} style={styles.itemRow}>
              <Ionicons name="checkmark" size={12} color={Colors.success} />
              <Text style={styles.itemText}>{s}</Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.column, styles.weaknessesCol]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, styles.weaknessIcon]}>
            <Ionicons name="alert-circle" size={14} color={Colors.warning} />
          </View>
          <Text style={styles.headerText}>To improve</Text>
        </View>
        {weaknesses.length === 0 ? (
          <Text style={styles.emptyText}>Nothing flagged — well done!</Text>
        ) : (
          weaknesses.map((w, i) => (
            <View key={i} style={styles.itemRow}>
              <Ionicons name="close" size={12} color={Colors.warning} />
              <Text style={styles.itemText}>{w}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  column: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  strengthsCol: {
    borderColor: 'rgba(16, 185, 129, 0.20)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  weaknessesCol: {
    borderColor: 'rgba(245, 158, 11, 0.20)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  weaknessIcon: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  headerText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: Spacing.xs + 2,
  },
  itemText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  emptyText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
