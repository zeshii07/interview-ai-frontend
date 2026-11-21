import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Elevation } from '../../constants/theme';
import useSavedJobsStore from '../../store/savedJobsStore';

const PROVIDER_COLORS = {
  adzuna: Colors.providerAdzuna,
  jooble: Colors.providerJooble,
  reed: Colors.providerReed,
  usajobs: Colors.providerUsajobs,
  unknown: Colors.providerUnknown,
};

// Avatar tint palette — hashed from the company name so every company gets
// a stable, pleasant color instead of everything being indigo.
const AVATAR_TINTS = [
  { bg: '#EEF2FF', text: '#4F46E5' }, // indigo
  { bg: '#F5F3FF', text: '#7C3AED' }, // violet
  { bg: '#F0FDFA', text: '#0F766E' }, // teal
  { bg: '#FFFBEB', text: '#B45309' }, // amber
  { bg: '#FFF1F2', text: '#E11D48' }, // rose
  { bg: '#EFF6FF', text: '#2563EB' }, // blue
  { bg: '#ECFDF5', text: '#059669' }, // emerald
  { bg: '#F8FAFC', text: '#475569' }, // slate
];

function avatarTintFor(name) {
  const key = String(name || '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 9973;
  }
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function initialsFor(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max)) return null;
  const fmt = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
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
 * JobCard — v3 (premium kit treatment)
 *
 *   [Avatar tile]  Job title (bold)              [circular bookmark]
 *                  Company · Location
 *                  $120k–$150k · Remote · Senior · 2d ago
 *                  ▓▓▓▓▓▓▓▓░░ 85% match
 *
 * The company avatar (stable tinted initials tile) gives the list visual
 * rhythm like a banking-app transaction feed; the bookmark became a real
 * circular touch target with a filled state.
 */
export default function JobCard({ job, onPress }) {
  const isSaved = useSavedJobsStore((s) => s.isSaved(job?.id));
  const toggleSaved = useSavedJobsStore((s) => s.toggleSaved);

  if (!job) return null;

  const providerColor = PROVIDER_COLORS[job.provider] || PROVIDER_COLORS.unknown;
  const salaryText = formatSalary(job.salary);
  const postedText = formatPostedAt(job.postedAt);
  const tint = avatarTintFor(job.company);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(job)}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
          <Text style={[styles.avatarText, { color: tint.text }]}>
            {initialsFor(job.company)}
          </Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title || 'Untitled role'}
          </Text>
          <View style={styles.companyRow}>
            <Text style={styles.company} numberOfLines={1}>
              {job.company || 'Unknown company'}
            </Text>
            {job.location ? (
              <>
                <Text style={styles.dotSep}>·</Text>
                <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.location} numberOfLines={1}>
                  {job.location}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => toggleSaved(job)}
          style={[styles.bookmark, isSaved && styles.bookmarkSaved]}
          accessibilityLabel={isSaved ? 'Unsave this job' : 'Save this job'}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={isSaved ? '#FFFFFF' : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.pillRow}>
        {salaryText ? (
          <View style={[styles.pill, styles.pillSalary]}>
            <Ionicons name="cash-outline" size={11} color={Colors.success} />
            <Text style={[styles.pillText, { color: Colors.success }]}>{salaryText}</Text>
          </View>
        ) : null}

        {job.isRemote ? (
          <View style={[styles.pill, styles.pillRemote]}>
            <View style={styles.remoteDot} />
            <Text style={[styles.pillText, { color: Colors.success }]}>Remote</Text>
          </View>
        ) : null}

        {job.experienceLevel && job.experienceLevel !== 'unspecified' ? (
          <View style={[styles.pill, styles.pillNeutral]}>
            <Text style={[styles.pillText, { color: Colors.textSecondary }]}>
              {job.experienceLevel}
            </Text>
          </View>
        ) : null}

        <View style={[styles.pill, { backgroundColor: providerColor.bg }]}>
          <Text style={[styles.pillText, { color: providerColor.text }]}>
            {job.providerLabel || job.provider || 'Job'}
          </Text>
        </View>

        {postedText ? (
          <Text style={styles.posted}>{postedText}</Text>
        ) : null}
      </View>

      {/* Match score — only if >= 70 */}
      {typeof job.matchScore === 'number' && job.matchScore >= 70 ? (
        <View style={styles.matchWrap}>
          <View style={styles.matchBar}>
            <View
              style={[
                styles.matchFill,
                { width: `${Math.min(100, job.matchScore)}%` },
              ]}
            />
          </View>
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
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm + 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  company: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  dotSep: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  location: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  bookmark: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkSaved: {
    backgroundColor: Colors.primary,
    ...Elevation.glowPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm + 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs + 3,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillSalary: {
    backgroundColor: Colors.successBg,
  },
  pillRemote: {
    backgroundColor: Colors.successBg,
  },
  remoteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  pillNeutral: {
    backgroundColor: Colors.bgElevated,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  posted: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  matchWrap: {
    marginTop: Spacing.sm,
    gap: 5,
  },
  matchBar: {
    height: 5,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  matchFill: {
    height: '100%',
    backgroundColor: Colors.gradientStart,
    experimental_backgroundImage: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
    borderRadius: Radius.full,
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
});
