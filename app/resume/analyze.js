import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import useInterviewStore from '../../store/interviewStore';

const ResumeAnalyzeScreen = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const { isAnalyzingResume, analyzeResume } = useInterviewStore();

  const handleAnalyze = async () => {
    if (resumeText.length < 50) {
      Alert.alert('Missing Info', 'Please paste your full resume text to continue.');
      return;
    }
    try {
      const result = await analyzeResume(resumeText, jobDescription);
      setAnalysis(result);
    } catch (error) {
      Alert.alert('Analysis Error', error.message);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {isAnalyzingResume && <LoadingOverlay message="Analyzing resume with AI..." />}

      <Text style={styles.mainTitle}>Resume Analyzer</Text>
      <Text style={styles.mainSub}>Paste your resume below to get actionable AI insights</Text>

      {/* Input Section */}
      <Card style={styles.inputCard} padding="md">
        <Text style={styles.inputLabel}>Resume Content *</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={10}
          placeholder="Paste your resume text here..."
          placeholderTextColor={Colors.textMuted}
          value={resumeText}
          onChangeText={setResumeText}
          editable={!isAnalyzingResume}
        />

        <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>Job Description (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.jdInput]}
          multiline
          numberOfLines={5}
          placeholder="Paste the job description for a match score..."
          placeholderTextColor={Colors.textMuted}
          value={jobDescription}
          onChangeText={setJobDescription}
          editable={!isAnalyzingResume}
        />

        <Button
          title="Analyze Resume"
          onPress={handleAnalyze}
          disabled={resumeText.length < 50 || isAnalyzingResume}
          loading={isAnalyzingResume}
          fullWidth
          size="large"
          style={{ marginTop: Spacing.md }}
        />
      </Card>

      {/* Results Dashboard */}
      {analysis && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>Analysis Results</Text>

          {/* Hero Score */}
          <Card style={styles.heroCard} padding="lg">
            <Text style={styles.heroLabel}>Overall Score</Text>
            <Text style={[styles.heroScore, { color: getScoreColor(analysis.overall_score) }]}>
              {analysis.overall_score}
            </Text>
            <Text style={styles.heroSubtext}>{analysis.summary}</Text>
          </Card>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            {analysis.ats_compatibility && (
              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>ATS Compatibility</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${analysis.ats_compatibility}%`, backgroundColor: getScoreColor(analysis.ats_compatibility) }]} />
                </View>
                <Text style={[styles.metricValue, { color: getScoreColor(analysis.ats_compatibility) }]}>{analysis.ats_compatibility}%</Text>
              </Card>
            )}
            {analysis.job_match_score && (
              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Job Match</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${analysis.job_match_score}%`, backgroundColor: getScoreColor(analysis.job_match_score) }]} />
                </View>
                <Text style={[styles.metricValue, { color: getScoreColor(analysis.job_match_score) }]}>{analysis.job_match_score}%</Text>
              </Card>
            )}
          </View>

          {/* Keywords (Pill Tags) */}
          {analysis.ats_keywords && (
            <Card style={styles.sectionCard} padding="md">
              <Text style={styles.sectionTitle}>🔑 ATS Keywords</Text>
              <View style={styles.tagsContainer}>
                {analysis.ats_keywords.present?.map((kw, i) => (
                  <View key={`p-${i}`} style={[styles.tag, { backgroundColor: Colors.success + '15', borderColor: Colors.success + '30' }]}>
                    <Text style={[styles.tagText, { color: Colors.success }]}>{kw}</Text>
                  </View>
                ))}
                {analysis.ats_keywords.missing?.map((kw, i) => (
                  <View key={`m-${i}`} style={[styles.tag, { backgroundColor: Colors.error + '10', borderColor: Colors.error + '20' }]}>
                    <Text style={[styles.tagText, { color: Colors.error }]}>+ {kw}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Strengths (Checklist style) */}
          {analysis.strengths?.length > 0 && (
            <Card style={styles.sectionCard} variant="success" padding="md">
              <Text style={styles.sectionTitle}>✅ Key Strengths</Text>
              {analysis.strengths.map((s, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.listDot, { backgroundColor: Colors.success }]} />
                  <View style={styles.listContent}>
                    <Text style={styles.listMain}>{s.area}</Text>
                    <Text style={styles.listSub}>{s.detail}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses?.length > 0 && (
            <Card style={styles.sectionCard} variant="warning" padding="md">
              <Text style={styles.sectionTitle}>⚠️ Areas to Fix</Text>
              {analysis.weaknesses.map((w, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.listDot, { backgroundColor: Colors.warning }]} />
                  <View style={styles.listContent}>
                    <Text style={styles.listMain}>{w.area}</Text>
                    <Text style={styles.listSub}>{w.detail}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Suggestions (Left border accent) */}
          {analysis.suggestions?.length > 0 && (
            <Card style={styles.sectionCard} padding="md">
              <Text style={styles.sectionTitle}>💡 AI Suggestions</Text>
              {analysis.suggestions.map((s, i) => (
                <View key={i} style={[styles.suggestionBox, { borderLeftColor: Colors.primary }]}>
                  <View style={styles.suggHeader}>
                    <View style={styles.suggTypePill}>
                      <Text style={styles.suggTypeText}>{s.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.suggSection}>in {s.section}</Text>
                  </View>
                  {s.current && <Text style={styles.suggOld}>• {s.current}</Text>}
                  <Text style={styles.suggNew}>✓ {s.suggested}</Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  
  mainTitle: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: '800' },
  mainSub: { color: Colors.textMuted, fontSize: FontSizes.md, marginTop: Spacing.xs, marginBottom: Spacing.xl },

  inputCard: { marginBottom: Spacing.xl, ...Shadows.medium },
  inputLabel: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '700', marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  textInput: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSizes.sm, lineHeight: 22, textAlignVertical: 'top', minHeight: 160 },
  jdInput: { minHeight: 100 },

  resultsContainer: { gap: Spacing.md },
  resultsHeader: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: '800', marginBottom: Spacing.sm },

  // Hero Card
  heroCard: { alignItems: 'center', ...Shadows.medium },
  heroLabel: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  heroScore: { fontSize: 72, fontWeight: '900', lineHeight: 80, marginTop: Spacing.sm },
  heroSubtext: { color: Colors.textSecondary, fontSize: FontSizes.sm, textAlign: 'center', marginTop: Spacing.md, lineHeight: 22, maxWidth: '90%' },

  // Metrics
  metricsRow: { flexDirection: 'row', gap: Spacing.md },
  metricCard: { flex: 1 },
  metricLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', marginBottom: Spacing.sm, textTransform: 'uppercase' },
  barBg: { height: 8, backgroundColor: Colors.bgElevated, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
  metricValue: { fontSize: FontSizes.lg, fontWeight: '800', marginTop: Spacing.sm },

  // Tags
  sectionCard: { marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '700', marginBottom: Spacing.md },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  tagText: { fontSize: FontSizes.xs, fontWeight: '600' },

  // List Items
  listItem: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-start' },
  listDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: Spacing.sm },
  listContent: { flex: 1 },
  listMain: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: '700', marginBottom: 2 },
  listSub: { color: Colors.textSecondary, fontSize: FontSizes.xs, lineHeight: 18 },

  // Suggestions
  suggestionBox: { 
    backgroundColor: Colors.bgElevated, 
    borderLeftWidth: 4, 
    padding: Spacing.md, 
    borderRadius: Radius.sm, 
    marginBottom: Spacing.sm 
  },
  suggHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  suggTypePill: { backgroundColor: Colors.primaryBg, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
  suggTypeText: { color: Colors.primaryLight, fontSize: 10, fontWeight: '800' },
  suggSection: { color: Colors.textMuted, fontSize: FontSizes.xs },
  suggOld: { color: Colors.error, fontSize: FontSizes.xs, marginBottom: 4, textDecorationLine: 'line-through' },
  suggNew: { color: Colors.success, fontSize: FontSizes.xs, fontWeight: '600' },
});

export default ResumeAnalyzeScreen;