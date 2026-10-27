import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Colors, Radius } from '../../constants/theme';

/**
 * ProgressBar
 *
 * Horizontal progress bar with a brand-gradient fill.
 *
 * Props:
 *   progress : number 0..1
 *   height   : number (default 6)
 *   variant  : 'primary' | 'success' | 'warning' | 'error'
 */
export default function ProgressBar({
  progress = 0,
  height = 6,
  variant = 'primary',
  style,
}) {
  const clamped = Math.max(0, Math.min(progress, 1));

  const colorMap = {
    primary: Colors.primary,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
  };
  const fillColor = colorMap[variant] || Colors.primary;

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.bgElevated,
    overflow: 'hidden',
  },
});
