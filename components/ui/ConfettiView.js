import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { Colors } from '../../constants/theme';

const CONFETTI_COLORS = [
  Colors.primary,
  Colors.accent,
  Colors.success,
  Colors.warning,
  Colors.info,
  '#F472B6',
  '#A78BFA',
];

/**
 * ConfettiView
 *
 * Lightweight confetti animation for the celebration screen.
 * Renders `count` colored squares that fall from the top with random
 * horizontal drift + rotation, looping forever until unmounted.
 *
 * Props:
 *   count : number (default 40)
 */
export default function ConfettiView({ count = 40 }) {
  const pieces = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,           // 0..100 (% of container width)
      size: 6 + Math.random() * 8,       // 6..14 px
      delay: Math.random() * 2000,       // 0..2s
      duration: 2500 + Math.random() * 1500, // 2.5..4s
      drift: (Math.random() - 0.5) * 60, // -30..+30 px drift
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotateSpeed: 200 + Math.random() * 400,
    }))
  ).current;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((p) => (
        <Piece key={p.id} piece={p} />
      ))}
    </View>
  );
}

function Piece({ piece }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.x + translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  useEffect(() => {
    // Drift horizontally
    translateX.value = withRepeat(
      withTiming(piece.drift, { duration: piece.duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Fall vertically — loop forever
    translateY.value = withDelay(
      piece.delay,
      withRepeat(
        withTiming(800, {
          duration: piece.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Rotate
    rotate.value = withDelay(
      piece.delay,
      withRepeat(
        withTiming(360, { duration: piece.rotateSpeed, easing: Easing.linear }),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(rotate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: piece.size,
          height: piece.size * 0.5,
          backgroundColor: piece.color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}
