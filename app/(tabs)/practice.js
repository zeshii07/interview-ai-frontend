// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { Colors, Spacing, FontSizes } from '../../constants/theme';

// const PracticeScreen = () => {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Practice Mode</Text>
//       <Text style={styles.subtitle}>Coming soon - Timed practice sessions</Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   title: {
//     color: Colors.text,
//     fontSize: FontSizes.xl,
//     fontWeight: '700',
//   },
//   subtitle: {
//     color: Colors.textSecondary,
//     fontSize: FontSizes.md,
//     marginTop: Spacing.sm,
//   },
// });

// export default PracticeScreen;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';

const PracticeScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconBg} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.icon}>⏱️</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">Practice Mode</Text>
      <Text style={styles.subtitle}>
        Timed practice sessions are on the way. In the meantime, head to Home to start a
        full AI mock interview.
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>COMING SOON</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    fontSize: 34,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  badge: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PracticeScreen;