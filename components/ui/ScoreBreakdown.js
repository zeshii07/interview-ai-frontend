import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import ProgressBar from './ProgressBar';

/**
 * ScoreBreakdown
 *
 * Shows per-category scores from an interview evaluation.
 * Used on the AI Feedback screen and the Results screen.
 *
 * Props:
 *   breakdown : Array<{ label, score, maxScore }>
 *               e.g. [{ label: 'Format', score: 8, maxScore: 10 }, ...]
 */
export default function ScoreBreakdown({ breakdown = [] }) {
  if (!breakdown.length) return null;

  return (
    <View style={styles.container}>
      {breakdown.map((item) => {
        const pct = item.maxScore > 0 ? item.score / item.maxScore : 0;
        const variant = pct >= 0.75 ? 'success' : pct >= 0.5 ? 'warning' : 'error';
        return (
          <View key={item.label} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.score}>
                {item.score}<Text style={styles.maxScore}>/{item.maxScore}</Text>
              </Text>
            </View>
            <ProgressBar progress={pct} variant={variant} height={6} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  row: {
    gap: Spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  score: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  maxScore: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
