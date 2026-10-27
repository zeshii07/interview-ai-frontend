import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows, Gradients } from '../../constants/theme';
import { getCurrentUser } from '../../services/authService';
import { interviewAPI, jobsAPI, makeAbortable, isAbortError } from '../../services/api';
import useSavedJobsStore from '../../store/savedJobsStore';
import useInterviewStore from '../../store/interviewStore';

import GradientHero from '../../components/ui/GradientHero';
import StatCard from '../../components/ui/StatCard';
import ToolCard from '../../components/ui/ToolCard';
import SectionHeader from '../../components/ui/SectionHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import JobCard from '../../components/jobs/JobCard';
import SlowNetworkBanner from '../../components/ui/SlowNetworkBanner';
import ErrorState from '../../components/ui/ErrorState';

const PRIMARY_TOOLS = [
  {
    title: 'ATS Resume\nGenerator',
    description: 'Generate a pro PDF resume',
    icon: 'document-text-outline',
    route: '/resume/generator',
    featured: true,
  },
  {
    title: 'Analyze Your\nResume',
    description: 'Improve your resume',
    icon: 'analytics-outline',
    route: '/resume/analyze',
  },
  {
    title: 'Question\nBank',
    description: 'Practice key questions',
    icon: 'help-circle-outline',
    route: '/questions',
  },
  {
    title: 'Interview\nHistory',
    description: 'Review past sessions',
    icon: 'time-outline',
    route: '/(tabs)/progress',
  },
];

const SECONDARY_TOOLS = [
  {
    title: 'AI Coach',
    description: 'Personalized coaching',
    icon: 'headset-outline',
    comingSoon: true,
  },
  {
    title: 'Mock Interview',
    description: 'Full simulated interview',
    icon: 'mic-outline',
    comingSoon: true,
  },
];

export default function HomeScreen() {
  const user = getCurrentUser();
  const displayName = user?.displayName?.split(' ')[0] || 'there';

  const [readiness, setReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessError, setReadinessError] = useState(null);

  const [trendingJobs, setTrendingJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const readinessAbortRef = useRef(null);
  const jobsAbortRef = useRef(null);

  const interviewHistory = useInterviewStore((s) => s.interviewHistory);
  const savedJobs = useSavedJobsStore((s) => s.savedJobs);

  const fetchReadiness = useCallback(async (userId) => {
    if (!userId) {
      setReadiness(null);
      setReadinessLoading(false);
      return;
    }
    if (readinessAbortRef.current) readinessAbortRef.current.abort();
    const ctrl = makeAbortable();
    readinessAbortRef.current = ctrl;

    setReadinessLoading(true);
    setReadinessError(null);

    try {
      const result = await interviewAPI.getReadiness(userId, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (result?.success) {
        setReadiness(result.data || null);
      } else {
        setReadinessError(result?.message || 'Could not load readiness score.');
      }
    } catch (err) {
      if (isAbortError(err)) return;
      // Don't surface an error if the user simply has no sessions yet —
      // the StatCard handles that case gracefully.
      if (interviewHistory.length === 0) {
        setReadiness(null);
      } else {
        setReadinessError(err?.message || 'Could not load readiness score.');
      }
    } finally {
      if (readinessAbortRef.current === ctrl) readinessAbortRef.current = null;
      if (!ctrl.signal.aborted) setReadinessLoading(false);
    }
  }, [interviewHistory.length]);

  const fetchTrendingJobs = useCallback(async (userId) => {
    if (jobsAbortRef.current) jobsAbortRef.current.abort();
    const ctrl = makeAbortable();
    jobsAbortRef.current = ctrl;

    setJobsLoading(true);
    setJobsError(null);

    // Derive a query from the user's most recent interview role (if any) or
    // a sensible default. Cap to 3 jobs for the Home preview card.
    const lastSession = interviewHistory[0];
    const query = lastSession?.role || 'Software Engineer';

    try {
      const result = await jobsAPI.search({
        query,
        remoteOnly: true,
        datePosted: '7d',
        skills: null, // could pass saved skills here in future
        page: 1,
        resultsPerPage: 3,
      }, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (result?.success) {
        setTrendingJobs(result.jobs || []);
      } else {
        setJobsError(result?.errors?.[0] || 'Could not load trending jobs.');
      }
    } catch (err) {
      if (isAbortError(err)) return;
      setJobsError(err?.message || 'Could not load trending jobs.');
    } finally {
      if (jobsAbortRef.current === ctrl) jobsAbortRef.current = null;
      if (!ctrl.signal.aborted) setJobsLoading(false);
    }
  }, [interviewHistory]);

  useFocusEffect(
    useCallback(() => {
      const u = getCurrentUser();
      fetchReadiness(u?.uid);
      fetchTrendingJobs(u?.uid);
    }, [fetchReadiness, fetchTrendingJobs])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (readinessAbortRef.current) readinessAbortRef.current.abort();
      if (jobsAbortRef.current) jobsAbortRef.current.abort();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const u = getCurrentUser();
    await Promise.allSettled([fetchReadiness(u?.uid), fetchTrendingJobs(u?.uid)]);
    setRefreshing(false);
  }, [fetchReadiness, fetchTrendingJobs]);

  const handleStartInterview = useCallback(() => {
    router.push('/interview/type');
  }, []);

  const handleShareScore = useCallback(async () => {
    if (!readiness?.score) {
      Alert.alert('No score yet', 'Complete an interview to share your score.');
      return;
    }
    Alert.alert(
      'Share Score',
      `Your Interview Readiness score is ${readiness.score.toFixed(1)}/10. Share this with your network!`,
      [{ text: 'OK' }]
    );
  }, [readiness?.score]);

  const handleAIInsights = useCallback(() => {
    // AI Insights is a Sprint 2 feature — placeholder for now.
    Alert.alert(
      'AI Insights — coming soon',
      'This feature will appear in Sprint 2 with the new interview flow.'
    );
  }, []);

  const openJobDetail = useCallback((job) => {
    if (!job?.id) return;
    router.push({
      pathname: '/jobs/detail',
      params: { job: encodeURIComponent(JSON.stringify(job)) },
    });
  }, []);

  const firstName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <View style={styles.screen}>
      <SlowNetworkBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Welcome banner */}
        <GradientHero
          title={`Welcome back, ${firstName}!`}
          subtitle="Build your career with AI-powered tools"
          icon="notifications-outline"
          onIconPress={() => router.push('/(tabs)/profile')}
        />

        {/* Tools grid */}
        <SectionHeader
          title="Your Career Tools"
          icon="grid-outline"
          actionLabel="See all"
          onActionPress={() => router.push('/(tabs)/tools')}
        />

        <View style={styles.toolsGrid}>
          {PRIMARY_TOOLS.map((tool) => (
            <View key={tool.title} style={styles.toolCardWrap}>
              <ToolCard
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                featured={tool.featured}
                onPress={() => router.push(tool.route)}
              />
            </View>
          ))}
        </View>

        {/* Secondary tools (Coming Soon) */}
        <View style={styles.secondaryToolsRow}>
          {SECONDARY_TOOLS.map((tool) => (
            <View key={tool.title} style={styles.secondaryTool}>
              <ToolCard
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                comingSoon
              />
            </View>
          ))}
        </View>

        {/* Interview Readiness dark panel */}
        <View style={styles.sectionSpacing}>
          <StatCard
            score={readiness?.score ?? null}
            interviewsCount={readiness?.interviewCount ?? interviewHistory.length}
            hint={readinessError || 'Complete your first interview to get a readiness score.'}
            onInsightsPress={handleAIInsights}
            onSharePress={handleShareScore}
          />
        </View>

        {/* Recent jobs preview card */}
        <SectionHeader
          title="Recent Jobs for You"
          subtitle="Based on your last interview role"
          icon="briefcase-outline"
          actionLabel="See all"
          onActionPress={() => router.push('/(tabs)/jobs')}
        />

        <View style={styles.jobsPreview}>
          {jobsLoading && !trendingJobs.length ? (
            <View style={styles.jobsPreviewLoading}>
              <ErrorState variant="loading" />
            </View>
          ) : jobsError && !trendingJobs.length ? (
            <View style={styles.jobsPreviewLoading}>
              <ErrorState
                variant="error"
                title="Couldn't load jobs"
                message={jobsError}
                onRetry={() => fetchTrendingJobs(getCurrentUser()?.uid)}
              />
            </View>
          ) : trendingJobs.length === 0 ? (
            <View style={styles.jobsPreviewEmpty}>
              <Ionicons name="briefcase-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyJobsText}>No trending jobs right now. Try a search.</Text>
            </View>
          ) : (
            trendingJobs.map((job) => (
              <JobCard key={job.id} job={job} onPress={openJobDetail} />
            ))
          )}
        </View>

        {/* Practice CTA */}
        <View style={styles.practiceCard}>
          <View style={styles.practiceLeft}>
            <View style={styles.practiceIconWrap}>
              <Ionicons name="mic" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.practiceTitle}>Practice your interview with AI</Text>
              <Text style={styles.practiceSubtitle}>
                Get instant feedback on your answers
              </Text>
            </View>
          </View>
          <Button
            label="Start"
            variant="dark"
            size="sm"
            icon="arrow-forward"
            iconPosition="right"
            onPress={handleStartInterview}
          />
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  toolCardWrap: {
    width: '48.5%',
  },
  // 2-column layout — each card takes ~half width minus gap
  // We render ToolCards with explicit width via flexBasis
  secondaryToolsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  secondaryTool: {
    flex: 1,
  },
  sectionSpacing: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  jobsPreview: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  jobsPreviewLoading: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 180,
  },
  jobsPreviewEmpty: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyJobsText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  practiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  practiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  practiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.gradientStart,
    backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  practiceSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
