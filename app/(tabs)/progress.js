import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewStore from '../../store/interviewStore';
import SectionHeader from '../../components/ui/SectionHeader';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function ProgressScreen() {
  const interviewHistory = useInterviewStore((s) => s.interviewHistory);

  const avgScore =
    interviewHistory.length > 0
      ? interviewHistory.reduce((sum, h) => sum + (h.averageScore || 0), 0) /
        interviewHistory.length
      : 0;

  // Mock category breakdown — will be wired to real data in Sprint 2
  const categories = [
    { label: 'Resume', progress: 0.6, variant: 'primary' },
    { label: 'Interviews', progress: interviewHistory.length / 10, variant: 'success' },
    { label: 'Skills', progress: 0.3, variant: 'warning' },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Track your career growth over time</Text>
      </View>

      {/* Summary stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{interviewHistory.length}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{avgScore ? avgScore.toFixed(1) : 'N/A'}</Text>
          <Text style={styles.summaryLabel}>Avg score</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>0</Text>
          <Text style={styles.summaryLabel}>Streak days</Text>
        </View>
      </View>

      {/* Category progress */}
      <SectionHeader title="By category" icon="pie-chart-outline" />
      <View style={styles.card}>
        {categories.map((cat) => (
          <View key={cat.label} style={styles.categoryRow}>
            <View style={styles.categoryLabelRow}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <Text style={styles.categoryPercent}>{Math.round(cat.progress * 100)}%</Text>
            </View>
            <ProgressBar progress={cat.progress} variant={cat.variant} />
          </View>
        ))}
      </View>

      {/* Recent sessions */}
      <SectionHeader
        title="Recent sessions"
        icon="time-outline"
        actionLabel={interviewHistory.length > 0 ? 'See all' : undefined}
        onActionPress={() => router.push('/interview/history')}
      />

      {interviewHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyDesc}>
            Complete your first interview to start tracking your progress.
          </Text>
          <Button
            label="Start interview"
            icon="mic-outline"
            onPress={() => router.push('/interview/type')}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      ) : (
        <View style={styles.card}>
          {interviewHistory.slice(0, 5).map((session, idx) => (
            <TouchableOpacity
              key={session.id || idx}
              style={styles.sessionRow}
              onPress={() => router.push('/interview/history')}
              activeOpacity={0.7}
            >
              <View style={styles.sessionIconWrap}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionRole} numberOfLines={1}>
                  {session.role || 'Interview'}
                </Text>
                <Text style={styles.sessionDate}>
                  {new Date(session.updatedAt || session.timestamp).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </Text>
              </View>
              <Badge
                label={session.averageScore ? `${session.averageScore}/10` : 'N/A'}
                variant={session.averageScore >= 7 ? 'success' : session.averageScore >= 5 ? 'warning' : 'error'}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  summaryValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  categoryRow: {
    marginBottom: Spacing.md,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  categoryPercent: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  emptyState: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sessionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionRole: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sessionDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
