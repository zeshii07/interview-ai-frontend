import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * StatCard
 *
 * The dark hero panel used on the Home screen for the "Interview Readiness"
 * score. Mimics the mockup's dark panel (#1E1B44B) with radial accent
 * overlays + a centered score ring + secondary stats + action buttons.
 *
 * Props:
 *   score             : number | null          — null renders "N/A"
 *   maxScore          : number                 — default 10
 *   interviewsCount   : number
 *   hint              : string                 — text shown when score is N/A
 *   onInsightsPress   : () => void
 *   onSharePress       : () => void
 *   insightsLabel     : string                 — default "AI Insights"
 *   shareLabel         : string                 — default "Share Score"
 */
export default function StatCard({
  score = null,
  maxScore = 10,
  interviewsCount = 0,
  hint = 'Complete your first interview to get a readiness score.',
  onInsightsPress,
  onSharePress,
  insightsLabel = 'AI Insights',
  shareLabel = 'Share Score',
}) {
  const hasScore = typeof score === 'number' && !Number.isNaN(score);
  const displayScore = hasScore ? score.toFixed(1) : 'N/A';

  // Ring math — circumference = 2πr; show progress as score / maxScore
  const radius = 56;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = hasScore ? Math.max(0, Math.min(score / maxScore, 1)) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.overlay1} pointerEvents="none" />
      <View style={styles.overlay2} pointerEvents="none" />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Interview Readiness</Text>
          <Text style={styles.subtitle}>
            {interviewsCount} {interviewsCount === 1 ? 'interview' : 'interviews'} completed
          </Text>
        </View>
        <Ionicons name="analytics-outline" size={20} color={Colors.textOnDarkMuted} />
      </View>

      <View style={styles.scoreRow}>
        {/* Score ring — approximated with overlapping circles since RN doesn't
            have native conic gradients; we use SVG in the parent screen for a
            proper animated ring. Here we just show the number for clarity. */}
        <View style={styles.scoreWrap}>
          <View style={styles.scoreRing}>
            <Text style={styles.scoreNumber}>{displayScore}</Text>
            {hasScore ? <Text style={styles.scoreMax}>/{maxScore}</Text> : null}
          </View>
          {!hasScore ? <View style={styles.scorePlaceholder} /> : null}
        </View>

        <View style={styles.scoreRight}>
          {hasScore ? (
            <>
              <Text style={styles.scoreLabel}>
                {getScoreLabel(score)}
              </Text>
              <Text style={styles.scoreDesc}>
                {getScoreDescription(score)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>No score yet</Text>
              <Text style={styles.emptyDesc}>{hint}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionPrimary]}
          onPress={onInsightsPress}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
          <Text style={styles.actionPrimaryText}>{insightsLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionGhost]}
          onPress={onSharePress}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={14} color={Colors.textOnDark} />
          <Text style={styles.actionGhostText}>{shareLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getScoreLabel(score) {
  if (score >= 8.5) return 'Outstanding';
  if (score >= 7) return 'Strong';
  if (score >= 5) return 'Needs work';
  return 'Needs improvement';
}

function getScoreDescription(score) {
  if (score >= 8.5) return "You're interview-ready — apply to top roles.";
  if (score >= 7) return 'You can confidently take most interviews.';
  if (score >= 5) return 'Focus on weak areas shown in your last session.';
  return 'Practice a few sessions to lift your score.';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.panelDark,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.large,
  },
  overlay1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.45)',
  },
  overlay2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(99, 102, 241, 0.30)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    zIndex: 2,
  },
  eyebrow: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    zIndex: 2,
  },
  scoreWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  scoreRing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreMax: {
    fontSize: FontSizes.md,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '600',
  },
  scorePlaceholder: {
    width: 8,
    height: 8,
  },
  scoreRight: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  scoreDesc: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 19,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    zIndex: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  actionPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  actionPrimaryText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionGhost: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  actionGhostText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
