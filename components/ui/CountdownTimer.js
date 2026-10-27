import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors, FontSizes, Radius } from '../../constants/theme';

/**
 * CountdownTimer
 *
 * A circular countdown timer. Counts down from `seconds` to 0 and calls
 * `onComplete()` when it hits 0. Shows the remaining time as `MM:SS` in the
 * center, and animates a circular progress ring around it.
 *
 * Props:
 *   seconds     : number  — total seconds to count down
 *   onComplete  : () => void
 *   size        : number (default 96)
 *   color       : string (default Colors.primary)
 */
export default function CountdownTimer({ seconds, onComplete, size = 96, color }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds);

    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          // Defer to avoid setState-in-render warnings
          setTimeout(() => onComplete?.(), 0);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const progress = seconds > 0 ? remaining / seconds : 0;
  const isLow = remaining <= 10;
  const ringColor = color || (isLow ? Colors.error : Colors.primary);

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // SVG arc approximation via SVG element
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: Colors.bgElevated,
          },
        ]}
      />
      {/* Progress ring (approximated with a thick bottom border that we
          rotate to show progress). Native SVG would be more accurate but
          this is good enough for the countdown purpose. */}
      <View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: ringColor,
            // Approximate arc: use transform to clip
            opacity: progress,
          },
        ]}
      />
      <View style={styles.textWrap}>
        <Text style={[styles.timeText, { color: ringColor, fontSize: size * 0.22 }]}>
          {timeStr}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  textWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
