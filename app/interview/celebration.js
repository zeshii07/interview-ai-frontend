import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import useInterviewStore from '../../store/interviewStore';
import ConfettiView from '../../components/ui/ConfettiView';
import Button from '../../components/ui/Button';
import LargeScoreRing from '../../components/ui/LargeScoreRing';

export default function CelebrationScreen() {
  const flow = useInterviewFlowStore();
  const store = useInterviewStore();

  const score = flow.results?.score ?? (
    store.sessionAnswerCount > 0
      ? store.sessionScoreTotal / store.sessionAnswerCount
      : 0
  );

  const message = score >= 8.5
    ? "You're interview-ready — go land that role!"
    : score >= 7
    ? 'Strong performance. A bit more polish and you\'re there.'
    : score >= 5
    ? 'Good practice — focus on the weak areas shown in your report.'
    : 'Every interview makes you better. Review your feedback and try again.';

  const handleViewReport = () => router.push('/interview/report');
  const handleShare = () => router.push('/interview/results'); // results has share button
  const handleHome = () => {
    flow.resetFlow();
    router.replace('/(tabs)/');
  };

  return (
    <View style={styles.screen}>
      {/* Confetti overlay */}
      <ConfettiView count={50} />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="trophy" size={48} color={Colors.warning} />
        </View>

        <Text style={styles.eyebrow}>INTERVIEW COMPLETE</Text>
        <Text style={styles.title}>Congratulations! 🎉</Text>
        <Text style={styles.subtitle}>{message}</Text>

        <View style={styles.scoreCard}>
          <LargeScoreRing
            score={score}
            maxScore={10}
            size={140}
            sublabel={`${flow.results?.questionCount || store.sessionAnswerCount} questions answered`}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{store.sessionAnswerCount}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{score.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{store.sessionQuestions.length}</Text>
            <Text style={styles.statLabel}>Reviewed</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <Button
          label="View detailed report"
          icon="document-text-outline"
          iconPosition="left"
          size="lg"
          fullWidth
          onPress={handleViewReport}
        />
        <Button
          label="Back to home"
          variant="ghost"
          size="md"
          fullWidth
          onPress={handleHome}
          style={{ marginTop: Spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    position: 'relative',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    zIndex: 2,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
    maxWidth: 280,
  },
  scoreCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  statBox: { alignItems: 'center' },
  statNumber: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
});
