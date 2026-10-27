import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Colors, FontSizes, Spacing } from '../../constants/theme';

/**
 * LargeScoreRing
 *
 * SVG-based animated score ring for results/feedback screens.
 * Shows score/10 in the center, with a gradient stroke that fills
 * proportionally to score/maxScore.
 *
 * Props:
 *   score     : number
 *   maxScore  : number (default 10)
 *   size      : number (default 160)
 *   label     : string? (shown below the score, e.g. "Outstanding")
 *   sublabel  : string? (shown below the label)
 */
export default function LargeScoreRing({
  score = 0,
  maxScore = 10,
  size = 160,
  label,
  sublabel,
}) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = maxScore > 0 ? Math.max(0, Math.min(score / maxScore, 1)) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  // Pick label color based on score
  const pct = progress;
  const labelColor = pct >= 0.85 ? Colors.success : pct >= 0.7 ? Colors.primary : pct >= 0.5 ? Colors.warning : Colors.error;

  const autoLabel = pct >= 0.85 ? 'Outstanding' : pct >= 0.7 ? 'Strong' : pct >= 0.5 ? 'Needs work' : 'Needs improvement';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="scoreRingGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.gradientStart} />
            <Stop offset="1" stopColor={Colors.gradientEnd} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={Colors.bgElevated}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#scoreRingGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.centerContent}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>{Number(score).toFixed(1)}</Text>
          <Text style={styles.scoreMax}>/{maxScore}</Text>
        </View>
        <Text style={[styles.label, { color: labelColor }]}>{label || autoLabel}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerContent: {
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  scoreMax: {
    fontSize: FontSizes.lg,
    color: Colors.textMuted,
    fontWeight: '600',
    marginLeft: 2,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginTop: Spacing.xs,
    letterSpacing: 0.3,
  },
  sublabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
