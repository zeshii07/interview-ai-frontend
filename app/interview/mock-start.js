import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import GradientHero from '../../components/ui/GradientHero';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function MockStartScreen() {
  const flow = useInterviewFlowStore();
  const {
    role, difficulty, language, questionCount, timeLimitPerQuestion, interviewType,
  } = flow;

  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    if (countdown === 0) {
      // Start mock
      flow.startMock();
      router.replace('/interview/mock-progress');
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [started, countdown]);

  if (started) {
    return (
      <View style={styles.countdownScreen}>
        <Text style={styles.countdownLabel}>Starting in</Text>
        <Text style={styles.countdownNumber}>{countdown === 0 ? 'Go!' : countdown}</Text>
        <Text style={styles.countdownHint}>Get ready to speak your answers</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GradientHero
        title="Mock interview"
        subtitle="Full simulated interview — voice answers, timed"
        icon="arrow-back-outline"
        onIconPress={() => router.back()}
      />

      <View style={styles.content}>
        {/* Overview card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <Ionicons name="briefcase-outline" size={18} color={Colors.primary} />
            <View style={styles.overviewMeta}>
              <Text style={styles.overviewLabel}>Role</Text>
              <Text style={styles.overviewValue}>{role || 'Software Engineer'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.overviewRow}>
            <Ionicons name="bar-chart-outline" size={18} color={Colors.primary} />
            <View style={styles.overviewMeta}>
              <Text style={styles.overviewLabel}>Difficulty</Text>
              <Text style={styles.overviewValue} style={{ textTransform: 'capitalize' }}>{difficulty}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.overviewRow}>
            <Ionicons name="language-outline" size={18} color={Colors.primary} />
            <View style={styles.overviewMeta}>
              <Text style={styles.overviewLabel}>Language</Text>
              <Text style={styles.overviewValue}>{language}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.overviewRow}>
            <Ionicons name="list-outline" size={18} color={Colors.primary} />
            <View style={styles.overviewMeta}>
              <Text style={styles.overviewLabel}>Questions</Text>
              <Text style={styles.overviewValue}>{questionCount}</Text>
            </View>
          </View>
          {timeLimitPerQuestion > 0 ? (
            <>
              <View style={styles.divider} />
              <View style={styles.overviewRow}>
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                <View style={styles.overviewMeta}>
                  <Text style={styles.overviewLabel}>Time per question</Text>
                  <Text style={styles.overviewValue}>{timeLimitPerQuestion}s</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for mock interviews</Text>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.tipText}>Speak clearly and at a steady pace</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.tipText}>Use STAR format for behavioral questions</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.tipText}>You can pause between questions</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.tipText}>Results are scored instantly when you finish</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <Button
          label="Start mock interview"
          icon="mic"
          iconPosition="left"
          size="lg"
          fullWidth
          onPress={() => {
            setStarted(true);
            setCountdown(3);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: {
    flex: 1,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  overviewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
    ...Shadows.small,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  overviewMeta: { flex: 1 },
  overviewLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  overviewValue: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  tipsCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  tipsTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  countdownScreen: {
    flex: 1,
    backgroundColor: Colors.panelDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownLabel: {
    fontSize: FontSizes.lg,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -4,
  },
  countdownHint: {
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.60)',
    marginTop: Spacing.lg,
  },
});
