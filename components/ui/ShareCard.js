import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Colors, FontSizes, Radius, Spacing } from '../../constants/theme';
import ScoreRing from './ScoreRing';

const getGrade = (score = 0) => {
  if (score >= 9) return { label: 'Outstanding', tone: Colors.success };
  if (score >= 7.5) return { label: 'Strong', tone: Colors.primaryLight || Colors.primary };
  if (score >= 5) return { label: 'Good progress', tone: Colors.warning };
  return { label: 'Keep improving', tone: Colors.error };
};

const Metric = ({ label, value }) => (
  <View style={styles.metricItem}>
    <Text style={styles.metricValue}>{value ?? '—'}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const ShareCard = ({ feedback = {}, role = 'Interview practice', forwardedRef, question, overall = false, interviewCount = 0 }) => {
  const rating = Number(feedback.rating) || 0;
  const maxRating = Number(feedback.rating_max) || 10;
  const grade = getGrade(rating);

  return (
    <ViewShot
      ref={forwardedRef}
      options={{ format: 'jpg', quality: 1 }}
      style={styles.captureSurface}
    >
      <View style={styles.card}>
        <View style={styles.ambientTop} />
        <View style={styles.ambientBottom} />

        <View style={styles.header}>
          <View style={styles.brandCopy}>
            <Image source={require('../../assets/logo.png')} resizeMode="contain" style={styles.logoImage} />
            <Text style={styles.headerSub}>AI interview coach</Text>
          </View>
          <View style={styles.resultPill}>
            <View style={[styles.resultDot, { backgroundColor: grade.tone }]} />
            <Text style={styles.resultPillText}>RESULT</Text>
          </View>
        </View>

        <View style={styles.heroSection}>
          <ScoreRing score={rating} maxScore={maxRating} size={132} strokeWidth={10} />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{overall ? 'OVERALL PERFORMANCE' : 'INTERVIEW PERFORMANCE'}</Text>
            <Text style={[styles.gradeLabel, { color: grade.tone }]}>{grade.label}</Text>
            <Text style={styles.encouragement}>
              Focused practice is turning into stronger, clearer answers.
            </Text>
          </View>
        </View>

        <Text style={styles.socialCaption}>
          {overall
            ? 'Building interview confidence one focused practice session at a time.'
            : 'I am sharpening my interview skills through realistic AI-powered practice.'}
        </Text>

        <View style={styles.roleCard}>
          <Text style={styles.roleLabel}>{overall ? 'PROGRESS SUMMARY' : 'TARGET ROLE'}</Text>
          <Text style={styles.roleText} numberOfLines={2}>{role}</Text>
          {overall ? <Text style={styles.contextText}>{interviewCount} {interviewCount === 1 ? 'interview' : 'interviews'} completed</Text> : null}
          {!overall && question ? <Text style={styles.contextText} numberOfLines={3}>Question: {question}</Text> : null}
        </View>

        {!overall ? <View style={styles.metricsCard}>
          <Metric label="Structure" value={feedback.structure_score} />
          <View style={styles.divider} />
          <Metric label="Content" value={feedback.content_score} />
          <View style={styles.divider} />
          <Metric label="Clarity" value={feedback.communication_score} />
        </View> : null}

        <View style={styles.footer}>
          <View style={styles.footerCopy}>
            <Text style={styles.footerText}>Practice smarter. Interview stronger.</Text>
            <Text style={styles.promoText}>Install Hirely for AI-powered job preparation sessions.</Text>
          </View>
          <Text style={styles.footerUrl}>HIRELY</Text>
        </View>
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  captureSurface: {
    backgroundColor: Colors.bgSecondary,
    padding: 12,
  },
  card: {
    width: 360,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bgPrimary,
    padding: Spacing.xl,
  },
  ambientTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: `${Colors.primary}18`,
    top: -100,
    right: -80,
  },
  ambientBottom: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    bottom: -90,
    left: -70,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  brandCopy: {
    flex: 1,
  },
  logoImage: { width: 100, height: 34 },
  headerSub: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  resultPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  resultDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  resultPillText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  heroSection: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  heroCopy: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  gradeLabel: {
    fontSize: FontSizes.xl,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: Spacing.xs,
  },
  encouragement: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  roleCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  roleLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  roleText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '800',
    marginTop: 5,
  },
  socialCaption: { color: Colors.textPrimary, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.md },
  contextText: { color: Colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 7 },
  metricsCard: {
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingVertical: Spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '900',
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 34,
    backgroundColor: Colors.border,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  footerCopy: { flex: 1, paddingRight: 10 },
  footerText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  promoText: { color: Colors.textSecondary, fontSize: 9, lineHeight: 14, fontWeight: '700', marginTop: 3 },
  footerUrl: {
    color: Colors.primaryLight || Colors.primary,
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
});

export default ShareCard;
