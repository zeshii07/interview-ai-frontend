import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useSavedJobsStore from '../../store/savedJobsStore';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import GradientHero from '../../components/ui/GradientHero';

function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max)) return null;
  const fmt = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
  if (salary.min && salary.max) {
    return `${fmt(salary.min)} – ${fmt(salary.max)}${salary.currency && salary.currency !== 'USD' ? ` ${salary.currency}` : ''}`;
  }
  if (salary.min) return `${fmt(salary.min)}+`;
  if (salary.max) return `up to ${fmt(salary.max)}`;
  return null;
}

function formatPostedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function JobDetailScreen() {
  const params = useLocalSearchParams();
  const [job, setJob] = useState(() => {
    try {
      return params.job ? JSON.parse(decodeURIComponent(params.job)) : null;
    } catch {
      return null;
    }
  });

  const isSaved = useSavedJobsStore((s) => (job?.id ? s.isSaved(job.id) : false));
  const toggleSaved = useSavedJobsStore((s) => s.toggleSaved);

  const handleApply = useCallback(async () => {
    if (!job?.url) {
      Alert.alert('No apply link', 'This job posting does not have an external apply URL.');
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(job.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: Colors.primary,
      });
    } catch {
      try {
        await Linking.openURL(job.url);
      } catch {
        Alert.alert('Could not open link', 'The apply URL is invalid.');
      }
    }
  }, [job?.url]);

  const handleSave = useCallback(async () => {
    if (!job) return;
    try { await toggleSaved(job); } catch { /* store handles errors */ }
  }, [job, toggleSaved]);

  if (!job) {
    return (
      <ErrorState
        variant="error"
        title="Job not found"
        message="The job posting could not be loaded. It may have expired or been removed."
        retryLabel="Back to search"
        onRetry={() => router.replace('/(tabs)/jobs')}
      />
    );
  }

  const salaryText = formatSalary(job.salary);
  const postedText = formatPostedAt(job.postedAt);
  const matchScore = typeof job.matchScore === 'number' ? job.matchScore : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gradient hero header — provider + match score on the right */}
        <GradientHero style={styles.detailHero}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.providerBadge}>
                <Text style={styles.providerText}>
                  {job.providerLabel || job.provider || 'Job'}
                </Text>
              </View>
              <Text style={styles.heroTitle}>{job.title}</Text>
            </View>

            {matchScore !== null ? (
              <View style={styles.matchRing}>
                <Text style={styles.matchValue}>{matchScore}</Text>
                <Text style={styles.matchPercent}>% match</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Ionicons name="business-outline" size={14} color={Colors.textOnDarkMuted} />
              <Text style={styles.heroMetaText}>{job.company}</Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Ionicons name="location-outline" size={14} color={Colors.textOnDarkMuted} />
              <Text style={styles.heroMetaText}>{job.location}</Text>
            </View>
            {job.isRemote ? (
              <View style={styles.remotePill}>
                <Text style={styles.remotePillText}>Remote</Text>
              </View>
            ) : null}
          </View>
        </GradientHero>

        {/* Tags row */}
        {(salaryText || postedText || job.experienceLevel !== 'unspecified') ? (
          <View style={styles.tagsRow}>
            {salaryText ? (
              <Badge label={salaryText} variant="success" icon="cash-outline" size="md" />
            ) : null}
            {job.experienceLevel && job.experienceLevel !== 'unspecified' ? (
              <Badge label={job.experienceLevel} variant="primary" size="md" />
            ) : null}
            {postedText ? <Badge label={`Posted ${postedText}`} variant="neutral" size="md" /> : null}
          </View>
        ) : null}

        {/* Description */}
        {job.description ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Job description</Text>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky apply bar */}
      <View style={styles.applyBar}>
        <TouchableOpacity
          style={styles.saveApplyButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.saveApplyText}>{isSaved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.85}>
          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>
            Apply on {job.providerLabel || 'source site'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  detailHero: {
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  providerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 28,
    flexShrink: 1,
  },
  matchRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  matchValue: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matchPercent: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.80)',
    marginTop: -2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  remotePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  remotePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  descriptionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  applyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  saveApplyText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadows.primary,
  },
  applyButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
