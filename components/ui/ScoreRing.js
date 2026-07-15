import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const ScoreRing = ({ score = 0, maxScore = 10, size = 120, strokeWidth = 9 }) => {
  const safeMax = Number(maxScore) > 0 ? Number(maxScore) : 10;
  const safeScore = clamp(Number(score) || 0, 0, safeMax);
  const percentage = safeScore / safeMax;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);
  const strokeColor =
    safeScore >= safeMax * 0.7
      ? Colors.success
      : safeScore >= safeMax * 0.4
        ? Colors.warning
        : Colors.error;

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Score ${safeScore} out of ${safeMax}`}
    >
      <Svg width={size} height={size} style={styles.svg} importantForAccessibility="no">
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.bgElevated}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      <View style={styles.content} importantForAccessibility="no">
        <View style={styles.scoreRow}>
          <Text
            style={[
              styles.score,
              {
                color: strokeColor,
                fontSize: Math.max(size * 0.27, FontSizes.xl),
                lineHeight: Math.max(size * 0.31, FontSizes.xxl),
              },
            ]}
          >
            {safeScore}
          </Text>
          <Text style={styles.maxScore}>/{safeMax}</Text>
        </View>
        <Text style={styles.label}>SCORE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  score: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  maxScore: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: -2,
  },
});

export default ScoreRing;
