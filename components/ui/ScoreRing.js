import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

const ScoreRing = ({ score, maxScore = 10, size = 120 }) => {
  const percentage = (score / maxScore) * 100;
  const strokeColor = score >= 7 ? Colors.success : score >= 4 ? Colors.warning : Colors.error;
  
  // SVG Circle Math
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.bgElevated}
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.score, { color: strokeColor }]}>{score}</Text>
        <Text style={styles.maxScore}>/{maxScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    lineHeight: FontSizes.xxxl,
  },
  maxScore: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: -5,
  },
});

export default ScoreRing;