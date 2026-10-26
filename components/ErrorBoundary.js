import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius } from '../constants/theme';

/**
 * Top-level error boundary.
 *
 * Wrap any subtree with <ErrorBoundary> and a render-error in any of its
 * children will be caught and shown as a friendly card with a "Reload"
 * button instead of crashing the entire app to a red screen.
 *
 *   <ErrorBoundary>
 *     <SomeScreen />
 *   </ErrorBoundary>
 *
 * In development you can pass `showDetails` to render the stack trace.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof this.props.onReload === 'function') {
      this.props.onReload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;
    const { showDetails = __DEV__, title = 'Something went wrong' } = this.props;

    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning-outline" size={36} color={Colors.warning} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>
          An unexpected error occurred. You can try reloading this screen — your saved
          data is safe.
        </Text>

        {showDetails && error ? (
          <View style={styles.detailsBox}>
            <Text style={styles.detailsText}>
              {String(error?.message || error)}
              {errorInfo?.componentStack ? `\n${errorInfo.componentStack}` : ''}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.reloadButton}
          onPress={this.handleReload}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={16} color="#fff" />
          <Text style={styles.reloadText}>Reload screen</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.bgPrimary,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(168, 92, 8, 0.10)',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  detailsBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    maxWidth: '100%',
  },
  detailsText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    gap: 6,
  },
  reloadText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
  },
});

// Silence the noise from libraries that log expected warnings.
// Re-introduce selectively if a real bug needs to surface.
LogBox.ignoreLogs([
  'Setting a timer for a long period',
  'AsyncStorage has been extracted',
  'ViewPropTypes will be removed',
]);
