import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import useSavedJobsStore from '../../store/savedJobsStore';
import ErrorState from '../../components/ui/ErrorState';

function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max)) return null;
  const fmt = (n) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${n}`;
  };
  if (salary.min && salary.max) return `${fmt(salary.min)} – ${fmt(salary.max)}${salary.currency && salary.currency !== 'USD' ? ` ${salary.currency}` : ''}`;
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
      const raw = params.job ? JSON.parse(decodeURIComponent(params.job)) : null;
      return raw;
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
      // Prefer expo-web-browser for an in-app browser sheet (better UX,
      // returns to the app when done). Falls back to system browser.
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
    try {
      await toggleSaved(job);
    } catch {
      // store handles errors internally; nothing to show
    }
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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.providerBadge}>
              <Text style={styles.providerText}>
                {job.providerLabel || job.provider || 'Job'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSave}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{job.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{job.company}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{job.location}</Text>
            {job.isRemote ? (
              <View style={styles.remotePill}>
                <Text style={styles.remotePillText}>Remote</Text>
              </View>
            ) : null}
          </View>

          {(salaryText || postedText || job.experienceLevel !== 'unspecified') && (
            <View style={styles.tagRow}>
              {salaryText ? (
                <View style={styles.salaryTag}>
                  <Ionicons name="cash-outline" size={11} color={Colors.success} />
                  <Text style={styles.salaryText}>{salaryText}</Text>
                </View>
              ) : null}
              {job.experienceLevel && job.experienceLevel !== 'unspecified' ? (
                <View style={styles.expTag}>
                  <Text style={styles.expText}>{job.experienceLevel}</Text>
                </View>
              ) : null}
              {postedText ? (
                <View style={styles.postedTag}>
                  <Text style={styles.postedText}>Posted {postedText}</Text>
                </View>
              ) : null}
            </View>
          )}

          {typeof job.matchScore === 'number' && job.matchScore > 0 ? (
            <View style={styles.matchRow}>
              <Ionicons name="sparkles-outline" size={12} color={Colors.primary} />
              <Text style={styles.matchText}>{job.matchScore}% skills match</Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        {job.description ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Job description</Text>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>
        ) : null}

        {/* Apply CTA — sticky-feeling at the bottom of the scroll view */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating apply bar */}
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
          <Text style={styles.saveApplyText}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          activeOpacity={0.85}
        >
          <Ionicons name="open-outline" size={16} color="#fff" />
          <Text style={styles.applyButtonText}>Apply on {job.providerLabel || 'source site'}</Text>
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
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  providerBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  providerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  remotePill: {
    backgroundColor: 'rgba(8, 122, 85, 0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  remotePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.md,
  },
  salaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(8, 122, 85, 0.10)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  salaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  expTag: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  expText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  postedTag: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  postedText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  matchText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
    whiteSpace: 'pre-wrap',
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
  },
  applyButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: '#fff',
  },
});
