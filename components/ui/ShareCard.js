import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import ScoreRing from './ScoreRing';

const ShareCard = ({ feedback, role, forwardedRef }) => {
  const getGradeLabel = (score) => {
    if (score >= 9) return 'OUTSTANDING';
    if (score >= 7.5) return 'STRONG';
    if (score >= 5) return 'GOOD';
    return 'NEEDS WORK';
  };

  return (
    <ViewShot ref={forwardedRef} options={{ format: 'jpg', quality: 1.0 }} style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Hirely</Text>
          <Text style={styles.headerSub}>AI Interview Prep</Text>
        </View>

        {/* Score Visual */}
        <View style={styles.scoreSection}>
          <ScoreRing score={feedback.rating} maxScore={feedback.rating_max} size={120} />
          <View style={styles.gradeBox}>
            <Text style={styles.gradeLabel}>{getGradeLabel(feedback.rating)}</Text>
          </View>
        </View>

        {/* Role Info */}
        <View style={styles.roleBox}>
          <Text style={styles.roleText}>Role: {role}</Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{feedback.structure_score}</Text>
            <Text style={styles.metricLabel}>Structure</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{feedback.content_score}</Text>
            <Text style={styles.metricLabel}>Content</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{feedback.communication_score}</Text>
            <Text style={styles.metricLabel}>Clarity</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ace your next interview at hirely.app</Text>
        </View>
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#000' }, // Black border for social media
  card: { 
    width: 360, 
    backgroundColor: Colors.bgPrimary, 
    padding: Spacing.xl, 
    borderRadius: 16,
    alignItems: 'center'
  },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  logo: { color: Colors.primaryLight, fontSize: FontSizes.lg, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  headerSub: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 4 },
  
  scoreSection: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  gradeBox: { marginLeft: Spacing.lg, backgroundColor: Colors.primaryBg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm },
  gradeLabel: { color: Colors.primaryLight, fontSize: FontSizes.sm, fontWeight: '800' },

  roleBox: { backgroundColor: Colors.bgElevated, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, marginBottom: Spacing.lg },
  roleText: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: '600' },

  metricsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', backgroundColor: Colors.bgCard, borderRadius: Radius.md, paddingVertical: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  metricItem: { alignItems: 'center' },
  metricValue: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: '800' },
  metricLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 4, textTransform: 'uppercase' },
  divider: { width: 1, backgroundColor: Colors.border, height: '60%' },

  footer: { borderTopWidth: 1, borderTopColor: Colors.border, width: '100%', paddingTop: Spacing.md, marginTop: Spacing.sm },
  footerText: { color: Colors.textMuted, fontSize: FontSizes.xs, textAlign: 'center' }
});

export default ShareCard;