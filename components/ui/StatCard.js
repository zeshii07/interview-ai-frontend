import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Colors, Spacing, FontSizes, Radius, Elevation, Glass, Gradients } from '../../constants/theme';

/**
 * StatCard
 *
 * The dark hero panel used on the Home screen for the "Interview
 * Readiness" score. Premium-kit treatment:
 *   - darkPanel gradient background + two soft radial accent overlays
 *   - a REAL progress ring (gradient stroke on a translucent white track)
 *     instead of a flat bordered circle
 *   - glassy hairline action buttons + a status pill with tinted dot
 *
 * Props:
 *   score             : number | null          — null renders "N/A"
 *   maxScore          : number                 — default 10
 *   interviewsCount   : number
 *   hint              : string                 — text shown when score is N/A
 *   onInsightsPress   : () => void
 *   onSharePress      : () => void
 *   insightsLabel     : string                 — default "AI Insights"
 *   shareLabel        : string                 — default "Share Score"
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
  const progress = hasScore ? Math.max(0, Math.min(score / maxScore, 1)) : 0;

  // Ring geometry
  const ringSize = 116;
  const strokeWidth = 9;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const ringTint = hasScore
    ? progress >= 0.7
      ? Colors.success
      : progress >= 0.4
        ? Colors.warning
        : Colors.error
    : 'rgba(255, 255, 255, 0.35)';

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
        <View style={styles.headerIcon}>
          <Ionicons name="analytics-outline" size={18} color="rgba(255, 255, 255, 0.85)" />
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.ringWrap}>
          <Svg width={ringSize} height={ringSize}>
            <Defs>
              <LinearGradient id="statRingGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={ringTint} />
                <Stop offset="1" stopColor="rgba(255, 255, 255, 0.55)" />
              </LinearGradient>
            </Defs>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.10)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="url(#statRingGradient)"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </Svg>
          <View style={styles.ringContent}>
            <View style={styles.scoreRowInner}>
              <Text style={styles.scoreNumber}>{displayScore}</Text>
              {hasScore ? <Text style={styles.scoreMax}>/{maxScore}</Text> : null}
            </View>
            <Text style={styles.ringCaption}>
              {hasScore ? `${Math.round(progress * 100)}%` : 'No data'}
            </Text>
          </View>
        </View>

        <View style={styles.scoreRight}>
          {hasScore ? (
            <>
              <View style={styles.scorePill}>
                <View style={[styles.scorePillDot, { backgroundColor: ringTint }]} />
                <Text style={styles.scorePillText}>{getScoreLabel(score)}</Text>
              </View>
              <Text style={styles.scoreDesc}>{getScoreDescription(score)}</Text>
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
    ...Gradients.darkPanel,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Glass.hairlineOnDark,
    ...Elevation.glowAccent,
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
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Glass.fillOnDark,
    borderWidth: 1,
    borderColor: Glass.hairlineOnDark,
    alignItems: 'center',
    justifyContent: 'center',
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
  ringWrap: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  ringContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRowInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreMax: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '600',
  },
  ringCaption: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.60)',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  scoreRight: {
    flex: 1,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: Spacing.sm,
  },
  scorePillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  scorePillText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
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
