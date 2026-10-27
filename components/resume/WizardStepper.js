import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';

/**
 * WizardStepper — horizontal progress dots at top of the Resume Generator.
 *
 * Props:
 *   steps      : Array<{ key, label, icon? }>
 *   current    : number (0-indexed)
 *   onJump     : (index) => void  — optional, lets user jump back to completed steps
 */
export default function WizardStepper({ steps = [], current = 0, onJump }) {
  return (
    <View style={styles.container}>
      {steps.map((step, idx) => {
        const isCompleted = idx < current;
        const isCurrent = idx === current;
        const isLocked = idx > current;
        const isJumpable = isCompleted && onJump;

        const Wrapper = isJumpable ? TouchableOpacity : View;
        const wrapperProps = isJumpable
          ? { onPress: () => onJump(idx), activeOpacity: 0.7 }
          : {};

        return (
          <View key={step.key} style={styles.stepWrap}>
            <Wrapper style={styles.dotWrap} {...wrapperProps}>
              <View
                style={[
                  styles.dot,
                  isCurrent && styles.dotCurrent,
                  isCompleted && styles.dotCompleted,
                  isLocked && styles.dotLocked,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : step.icon && typeof step.icon === 'string' ? (
                  <Ionicons name={step.icon} size={14} color={isCurrent ? '#FFFFFF' : Colors.textMuted} />
                ) : (
                  <Text style={[styles.dotNumber, isCurrent && styles.dotNumberCurrent]}>
                    {idx + 1}
                  </Text>
                )}
              </View>
            </Wrapper>

            <Text
              style={[
                styles.label,
                isCurrent && styles.labelCurrent,
                isLocked && styles.labelLocked,
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dotWrap: {
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgElevated,
  },
  dotCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.primary,
  },
  dotCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  dotLocked: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.border,
  },
  dotNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  dotNumberCurrent: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  labelCurrent: {
    color: Colors.primary,
    fontWeight: '700',
  },
  labelLocked: {
    color: Colors.textMuted,
    opacity: 0.5,
  },
});
