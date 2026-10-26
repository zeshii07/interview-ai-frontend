import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import useSavedJobsStore from '../../store/savedJobsStore';

/**
 * Provider badge colors so the source is scannable at a glance.
 */
const PROVIDER_COLORS = {
  adzuna: { bg: 'rgba(36, 95, 199, 0.10)', text: '#245FC7' },
  jooble: { bg: 'rgba(0, 122, 87, 0.10)', text: '#007A57' },
  reed: { bg: 'rgba(168, 92, 8, 0.10)', text: '#A85C08' },
  usajobs: { bg: 'rgba(53, 53, 138, 0.10)', text: '#35358A' },
  unknown: { bg: Colors.bgElevated, text: Colors.textMuted },
};

function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max)) return null;
  const fmt = (n) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${n}`;
  };
  if (salary.min && salary.max) return `${fmt(salary.min)} – ${fmt(salary.max)}`;
  if (salary.min) return `${fmt(salary.min)}+`;
  if (salary.max) return `up to ${fmt(salary.max)}`;
  return null;
}

function formatPostedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hoursAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) return 'Just now';
  if (hoursAgo < 24) return `${Math.floor(hoursAgo)}h ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo === 1) return '1d ago';
  if (daysAgo < 30) return `${daysAgo}d ago`;
  const monthsAgo = Math.floor(daysAgo / 30);
  return monthsAgo === 1 ? '1mo ago' : `${monthsAgo}mo ago`;
}

/**
 * @param {object} job  — normalized job object from the backend
 * @param {function} onPress  — tap the card
 */
export default function JobCard({ job, onPress }) {
  const isSaved = useSavedJobsStore((s) => s.isSaved(job?.id));
  const toggleSaved = useSavedJobsStore((s) => s.toggleSaved);

  if (!job) return null;

  const providerColor = PROVIDER_COLORS[job.provider] || PROVIDER_COLORS.unknown;
  const salaryText = formatSalary(job.salary);
  const postedText = formatPostedAt(job.postedAt);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(job)}
      activeOpacity={0.85}
    >
      <View style={styles.headerRow}>
        <View style={[styles.providerBadge, { backgroundColor: providerColor.bg }]}>
          <Text style={[styles.providerText, { color: providerColor.text }]}>
            {job.providerLabel || job.provider || 'Job'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => toggleSaved(job)}
          accessibilityLabel={isSaved ? 'Unsave this job' : 'Save this job'}
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {job.title || 'Untitled role'}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="business-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {job.company || 'Unknown company'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {job.location || 'Unspecified'}
          </Text>
        </View>

        {job.isRemote ? (
          <View style={styles.remoteBadge}>
            <Ionicons name="wifi-outline" size={11} color={Colors.success} />
            <Text style={styles.remoteText}>Remote</Text>
          </View>
        ) : null}
      </View>

      {(salaryText || postedText || job.experienceLevel !== 'unspecified') && (
        <View style={styles.tagsRow}>
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
              <Text style={styles.postedText}>{postedText}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Match score badge — only if > 70 (otherwise not interesting enough to surface) */}
      {typeof job.matchScore === 'number' && job.matchScore >= 70 ? (
        <View style={styles.matchBar}>
          <View style={[styles.matchFill, { width: `${Math.min(100, job.matchScore)}%` }]} />
          <Text style={styles.matchLabel}>{job.matchScore}% match</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  providerBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  providerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  remoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(8, 122, 85, 0.10)',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  remoteText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
  },
  salaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(8, 122, 85, 0.08)',
    paddingHorizontal: Spacing.xs + 2,
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
    paddingHorizontal: Spacing.xs + 2,
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
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
  },
  postedText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  matchBar: {
    marginTop: Spacing.sm,
    height: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  matchFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  matchLabel: {
    position: 'absolute',
    right: 0,
    top: -16,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
});
