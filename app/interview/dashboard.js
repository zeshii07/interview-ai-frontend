import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewStore from '../../store/interviewStore';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';
import SectionHeader from '../../components/ui/SectionHeader';

const INTERVIEW_TYPE_LABELS = {
  general: 'General',
  role: 'Role-based',
  technical: 'Technical',
  behavioral: 'Behavioral',
  mock: 'Mock Interview',
};

export default function DashboardScreen() {
  const interviewHistory = useInterviewStore((s) => s.interviewHistory);
  const clearHistory = useInterviewStore((s) => s.clearHistory);

  // Compute stats from history
  const stats = useMemo(() => {
    if (!interviewHistory.length) {
      return {
        total: 0,
        avgScore: 0,
        byType: {},
        trend: [],
      };
    }

    const byType = {};
    let totalScore = 0;

    interviewHistory.forEach((item) => {
      const score = Number(item.averageScore || 0);
      totalScore += score;

      // Derive type — store doesn't have a type field directly; use the
      // difficulty as a proxy unless we add type to history later
      const type = item.type || item.interviewType || 'general';
      if (!byType[type]) {
        byType[type] = { count: 0, total: 0 };
      }
      byType[type].count += 1;
      byType[type].total += score;
    });

    // Convert to array with averages
    const byTypeArray = Object.entries(byType).map(([type, { count, total }]) => ({
      type,
      label: INTERVIEW_TYPE_LABELS[type] || type,
      count,
      avgScore: count > 0 ? total / count : 0,
    })).sort((a, b) => b.count - a.count);

    return {
      total: interviewHistory.length,
      avgScore: totalScore / interviewHistory.length,
      byType: byTypeArray,
      trend: interviewHistory.slice(0, 10).reverse(),
    };
  }, [interviewHistory]);

  const handleStartInterview = () => router.push('/interview/type');
  const handleViewHistory = () => router.push('/interview/history');
  const handleClearHistory = () => {
    Alert.alert(
      'Clear all history?',
      'This deletes every recorded interview session. This can\'t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  const maxAvg = Math.max(...stats.byType.map((s) => s.avgScore), 1);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary stats */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.avgScore ? stats.avgScore.toFixed(1) : 'N/A'}</Text>
            <Text style={styles.summaryLabel}>Avg score</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.byType.length}</Text>
            <Text style={styles.summaryLabel}>Types</Text>
          </View>
        </View>

        {/* By interview type */}
        <SectionHeader title="By interview type" icon="pie-chart-outline" />

        {stats.byType.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyDesc}>
              Complete a few interviews to see your scores broken down by type.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {stats.byType.map((s) => (
              <View key={s.type} style={styles.byTypeRow}>
                <View style={styles.byTypeLabelRow}>
                  <Text style={styles.byTypeLabel}>{s.label}</Text>
                  <Text style={styles.byTypeMeta}>{s.count} sessions</Text>
                </View>
                <View style={styles.byTypeScoreRow}>
                  <View style={{ flex: 1, marginRight: Spacing.md }}>
                    <ProgressBar
                      progress={s.avgScore / 10}
                      variant={s.avgScore >= 7 ? 'success' : s.avgScore >= 5 ? 'warning' : 'error'}
                      height={6}
                    />
                  </View>
                  <Text style={styles.byTypeScore}>{s.avgScore.toFixed(1)}/10</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent trend */}
        <SectionHeader title="Recent sessions" icon="trending-up-outline" />

        {stats.trend.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="trending-up-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No recent sessions</Text>
            <Text style={styles.emptyDesc}>
              Your recent interview history will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {stats.trend.map((session, idx) => {
              const score = Number(session.averageScore || 0);
              return (
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
                    label={score ? `${score.toFixed(1)}/10` : 'N/A'}
                    variant={score >= 7 ? 'success' : score >= 5 ? 'warning' : 'error'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Button
            label="View history"
            icon="time-outline"
            iconPosition="left"
            variant="secondary"
            size="md"
            onPress={handleViewHistory}
            style={{ flex: 1 }}
          />
          <Button
            label="New interview"
            icon="add"
            iconPosition="left"
            variant="primary"
            size="md"
            onPress={handleStartInterview}
            style={{ flex: 1 }}
          />
        </View>

        {interviewHistory.length > 0 ? (
          <Button
            label="Clear history"
            icon="trash-outline"
            iconPosition="left"
            variant="ghost"
            size="md"
            fullWidth
            onPress={handleClearHistory}
            style={{ marginTop: Spacing.sm }}
          />
        ) : null}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
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
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptyDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 19,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  byTypeRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  byTypeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
  },
  byTypeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  byTypeMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  byTypeScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  byTypeScore: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 50,
    textAlign: 'right',
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
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
