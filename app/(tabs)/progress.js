import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Elevation } from '../../constants/theme';
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
        {[
          { label: 'Sessions', value: String(interviewHistory.length), icon: 'layers-outline', tint: '#4F46E5', tintBg: '#EEF2FF' },
          { label: 'Avg score', value: avgScore ? avgScore.toFixed(1) : 'N/A', icon: 'star-outline', tint: '#D97706', tintBg: '#FFFBEB' },
          { label: 'Streak days', value: '0', icon: 'flame-outline', tint: '#E11D48', tintBg: '#FFF1F2' },
        ].map((stat) => (
          <View key={stat.label} style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: stat.tintBg }]}>
              <Ionicons name={stat.icon} size={14} color={stat.tint} />
            </View>
            <Text style={styles.summaryValue}>{stat.value}</Text>
            <Text style={styles.summaryLabel}>{stat.label}</Text>
          </View>
        ))}
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
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
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
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
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
    // extra room so content clears the floating tab bar
    paddingBottom: Spacing.xxl + 52,
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
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
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
    ...Elevation.card,
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
    ...Elevation.card,
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
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.gradientStart,
    experimental_backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
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
