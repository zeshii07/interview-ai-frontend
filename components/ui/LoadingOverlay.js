// import React from 'react';
// import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
// import { Colors, Spacing, FontSizes } from '../../constants/theme';

// const LoadingOverlay = ({ message = 'Thinking...' }) => {
//   return (
//     <View style={styles.container}>
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color={Colors.primary} />
//         <Text style={styles.message}>{message}</Text>
//         <Text style={styles.submessage}>AI is analyzing your response</Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(15, 15, 26, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 1000,
//   },
//   loaderContainer: {
//     alignItems: 'center',
//     gap: Spacing.md,
//   },
//   message: {
//     color: Colors.text,
//     fontSize: FontSizes.lg,
//     fontWeight: '600',
//     marginTop: Spacing.md,
//   },
//   submessage: {
//     color: Colors.textSecondary,
//     fontSize: FontSizes.sm,
//   },
// });

// export default LoadingOverlay;


import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

const LoadingOverlay = ({ message = 'Thinking...', submessage }) => {
  return (
    <View
      style={styles.container}
      pointerEvents="auto"
      accessible
      accessibilityViewIsModal
      accessibilityLiveRegion="polite"
      accessibilityLabel={submessage ? `${message}. ${submessage}` : message}
    >
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.message}>{message}</Text>
        {submessage ? <Text style={styles.submessage}>{submessage}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  message: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  submessage: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});

export default LoadingOverlay;