import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Radius, Shadows, Spacing } from '../../constants/theme';

const LoadingOverlay = ({
  visible = true,
  message = 'Working on it...',
  submessage = 'Please keep this screen open.',
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    accessibilityViewIsModal
    onRequestClose={() => {}}
  >
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${message}${submessage ? `. ${submessage}` : ''}`}
    >
      <View style={styles.panel}>
        <View style={styles.loaderShell}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
        <Text style={styles.message}>{message}</Text>
        {submessage ? <Text style={styles.submessage}>{submessage}</Text> : null}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.overlay || 'rgba(7, 10, 18, 0.78)',
    padding: Spacing.xl,
  },
  panel: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    borderRadius: Radius.xl || Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    ...Shadows.small,
  },
  loaderShell: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: Colors.primaryBg,
    marginBottom: Spacing.lg,
  },
  message: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  submessage: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
