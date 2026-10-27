import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import useInterviewStore from '../../store/interviewStore';
import LargeScoreRing from '../../components/ui/LargeScoreRing';
import ScoreBreakdown from '../../components/ui/ScoreBreakdown';
import StrengthsWeaknesses from '../../components/ui/StrengthsWeaknesses';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function ResultsScreen() {
  const flow = useInterviewFlowStore();
  const store = useInterviewStore();

  const results = flow.results;
  const sessionQuestions = store.sessionQuestions || [];

  // Derive breakdown from session questions
  const breakdown = React.useMemo(() => {
    const categories = {};
    sessionQuestions.forEach((q) => {
      const cat = q?.category || 'General';
      if (!categories[cat]) {
        categories[cat] = { count: 0, total: 0 };
      }
      const score = Number(q?.feedback?.rating || 0);
      categories[cat].count += 1;
      categories[cat].total += score;
    });
    return Object.entries(categories).map(([label, { count, total }]) => ({
      label,
      score: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
      maxScore: 10,
    }));
  }, [sessionQuestions]);

  // Derive strengths/weaknesses from session (best + worst categories)
  const { strengths, weaknesses } = React.useMemo(() => {
    if (!breakdown.length) return { strengths: [], weaknesses: [] };
    const sorted = [...breakdown].sort((a, b) => b.score - a.score);
    const strengths = sorted
      .filter((b) => b.score >= 7)
      .slice(0, 3)
      .map((b) => `Strong in ${b.label} (${b.score}/10)`);
    const weaknesses = sorted
      .filter((b) => b.score < 7)
      .slice(-3)
      .map((b) => `Practice more ${b.label} (currently ${b.score}/10)`);
    return { strengths, weaknesses };
  }, [breakdown]);

  const score = results?.score ?? (
    store.sessionAnswerCount > 0
      ? store.sessionScoreTotal / store.sessionAnswerCount
      : 0
  );

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `I just scored ${score.toFixed(1)}/10 on my Hirely ${results?.type || 'interview'} interview! Try it: https://hirely.app`,
      });
    } catch {}
  }, [score, results?.type]);

  const handleViewReport = useCallback(() => {
    router.push('/interview/report');
  }, []);

  const handleViewDashboard = useCallback(() => {
    router.push('/interview/dashboard');
  }, []);

  const handleDone = useCallback(() => {
    flow.resetFlow();
    router.replace('/(tabs)/progress');
  }, [flow]);

  if (!results && store.sessionAnswerCount === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No results to show</Text>
          <Text style={styles.emptyDesc}>
            Complete an interview first to see your results.
          </Text>
          <Button
            label="Start an interview"
            icon="arrow-forward"
            iconPosition="right"
            onPress={() => router.replace('/interview/type')}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score hero */}
        <View style={styles.scoreHero}>
          <LargeScoreRing
            score={score}
            maxScore={10}
            size={180}
            sublabel={`${results?.questionCount || store.sessionAnswerCount || 0} questions answered`}
          />
          <View style={styles.metaRow}>
            <Badge label={results?.type || 'General'} variant="primary" size="md" />
            {results?.role ? <Badge label={results.role} variant="neutral" size="md" /> : null}
          </View>
        </View>

        {/* Breakdown */}
        {breakdown.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Score by category</Text>
            <ScoreBreakdown breakdown={breakdown} />
          </View>
        ) : null}

        {/* Strengths & weaknesses */}
        {(strengths.length > 0 || weaknesses.length > 0) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your assessment</Text>
            <StrengthsWeaknesses strengths={strengths} weaknesses={weaknesses} />
          </View>
        ) : null}

        {/* Question recap */}
        {sessionQuestions.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Question recap</Text>
            {sessionQuestions.slice(0, 5).map((q, i) => {
              const score = Number(q?.feedback?.rating || 0);
              return (
                <View key={i} style={styles.questionRecapRow}>
                  <Text style={styles.questionRecapNumber}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.questionRecapText} numberOfLines={2}>
                      {typeof q === 'string' ? q : q?.question || ''}
                    </Text>
                    <Text style={styles.questionRecapCategory}>
                      {q?.category || 'General'}
                    </Text>
                  </View>
                  <View style={[
                    styles.questionRecapScore,
                    { backgroundColor: score >= 7 ? Colors.successBg : score >= 5 ? Colors.warningBg : Colors.errorBg },
                  ]}>
                    <Text style={[
                      styles.questionRecapScoreText,
                      { color: score >= 7 ? Colors.success : score >= 5 ? Colors.warning : Colors.error },
                    ]}>
                      {score.toFixed(1)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <Button
            label="View report"
            icon="document-text-outline"
            iconPosition="left"
            variant="secondary"
            size="md"
            onPress={handleViewReport}
            style={{ flex: 1 }}
          />
          <Button
            label="Dashboard"
            icon="stats-chart-outline"
            iconPosition="left"
            variant="secondary"
            size="md"
            onPress={handleViewDashboard}
            style={{ flex: 1 }}
          />
        </View>

        <Button
          label="Share score"
          icon="share-outline"
          iconPosition="left"
          variant="ghost"
          size="md"
          fullWidth
          onPress={handleShare}
          style={{ marginTop: Spacing.sm }}
        />

        <Button
          label="Done"
          icon="checkmark-circle"
          iconPosition="left"
          size="lg"
          fullWidth
          onPress={handleDone}
          style={{ marginTop: Spacing.md }}
        />

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  scoreHero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: 0.2,
  },
  questionRecapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  questionRecapNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    color: Colors.primary,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
  },
  questionRecapText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  questionRecapCategory: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  questionRecapScore: {
    width: 36,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionRecapScoreText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
