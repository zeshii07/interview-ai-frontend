import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius } from '../constants/theme';
import { subscribeSlowNetwork } from '../services/api';

/**
 * Banner that appears at the top of the screen when the API layer has been
 * waiting more than 12 seconds on a request. Auto-dismisses as soon as a
 * response arrives.
 *
 * Mount once near the root of the authed area (e.g. inside the (tabs)
 * layout) — it self-hides when not needed.
 */
export default function SlowNetworkBanner() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const unsub = subscribeSlowNetwork(setSlow);
    return () => unsub();
  }, []);

  if (!slow) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="hourglass-outline" size={14} color={Colors.warning} />
      <Text style={styles.text}>Slow connection — still working…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(168, 92, 8, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 92, 8, 0.18)',
  },
  text: {
    fontSize: FontSizes.xs,
    color: Colors.warning,
    fontWeight: '500',
  },
});
