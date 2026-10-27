import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';

/**
 * ErrorState — reskinned with the new palette.
 *
 * Variants:
 *   - error  : indigo-tinted icon + "Try again" button
 *   - empty  : muted icon, no retry
 *   - loading : spinner, no buttons
 */
export default function ErrorState({
  variant = 'error',
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  icon,
}) {
  const config = {
    error: {
      icon: icon || 'cloud-offline-outline',
      iconColor: Colors.error,
      iconBg: Colors.errorBg,
    },
    empty: {
      icon: icon || 'search-outline',
      iconColor: Colors.textMuted,
      iconBg: Colors.bgElevated,
    },
    loading: {
      icon: null,
      iconColor: Colors.primary,
      iconBg: Colors.primaryBg,
    },
  }[variant] || {};

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
        {variant === 'loading' ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <Ionicons name={config.icon} size={32} color={config.iconColor} />
        )}
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {variant === 'error' && onRetry ? (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={14} color={Colors.primary} />
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
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
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    gap: 6,
  },
  retryText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
});
