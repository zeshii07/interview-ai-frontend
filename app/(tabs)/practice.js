import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

const PracticeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice Mode</Text>
      <Text style={styles.subtitle}>Coming soon - Timed practice sessions</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    marginTop: Spacing.sm,
  },
});

export default PracticeScreen;