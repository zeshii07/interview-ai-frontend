import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
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
      Alert.alert('Error', 'Please paste your full resume text');
      return;
    }

    try {
      const result = await analyzeResume(resumeText, jobDescription);
      setAnalysis(result);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isAnalyzingResume && <LoadingOverlay message="Analyzing your resume..." />}

      <Text style={styles.title}>Resume Analyzer</Text>
      <Text style={styles.subtitle}>Paste your resume content below for AI analysis</Text>

      {/* Resume Input */}
      <Text style={styles.inputLabel}>Resume Content *</Text>
      <TextInput
        style={styles.textInput}
        multiline
        numberOfLines={12}
        placeholder="Paste your resume text here...&#10;&#10;Example:&#10;John Doe&#10;Frontend Developer&#10;&#10;Experience:&#10;- Senior Developer at XYZ Corp (2020-2024)&#10;- Junior Developer at ABC Inc (2018-2020)&#10;&#10;Skills: React, TypeScript, Node.js..."
        placeholderTextColor={Colors.textMuted}
        value={resumeText}
        onChangeText={setResumeText}
        editable={!isAnalyzingResume}
      />

      {/* Job Description Input (Optional) */}
      <Text style={styles.inputLabel}>Job Description (Optional)</Text>
      <TextInput
        style={[styles.textInput, styles.jdInput]}
        multiline
        numberOfLines={6}
        placeholder="Paste the job description you're applying for to get a match score..."
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
        style={styles.analyzeButton}
      />

      {/* Analysis Results */}
      {analysis && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Analysis Results</Text>

          {/* Overall Score */}
          <Card style={styles.scoreCard} variant="primary" padding="lg">
            <Text style={styles.scoreCardLabel}>Overall Resume Score</Text>
            <View style={styles.scoreDisplay}>
              <Text style={[styles.scoreNumber, { color: getScoreColor(analysis.overall_score) }]}>
                {analysis.overall_score}
              </Text>
              <Text style={styles.scoreOutOf}>/100</Text>
            </View>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </Card>

          {/* ATS Compatibility */}
          {analysis.ats_compatibility && (
            <Card style={styles.miniScoreCard} padding="md">
              <Text style={styles.miniScoreLabel}>ATS Compatibility</Text>
              <View style={styles.miniScoreRow}>
                <View style={[styles.miniScoreBar, { 
                  width: `${analysis.ats_compatibility}%`,
                  backgroundColor: getScoreColor(analysis.ats_compatibility)
                }]} />
              </View>
              <Text style={[styles.miniScoreValue, { color: getScoreColor(analysis.ats_compatibility) }]}>
                {analysis.ats_compatibility}%
              </Text>
            </Card>
          )}

          {/* Job Match Score */}
          {analysis.job_match_score && (
            <Card style={styles.miniScoreCard} padding="md">
              <Text style={styles.miniScoreLabel}>Job Match Score</Text>
              <View style={styles.miniScoreRow}>
                <View style={[styles.miniScoreBar, { 
                  width: `${analysis.job_match_score}%`,
                  backgroundColor: getScoreColor(analysis.job_match_score)
                }]} />
              </View>
              <Text style={[styles.miniScoreValue, { color: getScoreColor(analysis.job_match_score) }]}>
                {analysis.job_match_score}%
              </Text>
            </Card>
          )}

          {/* ATS Keywords */}
          {analysis.ats_keywords && (
            <Card style={styles.keywordsCard} padding="md">
              <Text style={styles.sectionTitle}>🔑 ATS Keywords</Text>
              <View style={styles.keywordsRow}>
                {analysis.ats_keywords.present?.map((kw, i) => (
                  <View key={i} style={[styles.keywordBadge, { backgroundColor: Colors.success + '20' }]}>
                    <Text style={[styles.keywordText, { color: Colors.success }]}>{kw}</Text>
                  </View>
                ))}
                {analysis.ats_keywords.missing?.map((kw, i) => (
                  <View key={i} style={[styles.keywordBadge, { backgroundColor: Colors.error + '20' }]}>
                    <Text style={[styles.keywordText, { color: Colors.error }]}>{kw}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <Card style={styles.resultCard} variant="success" padding="md">
              <Text style={styles.sectionTitle}>✅ Strengths</Text>
              {analysis.strengths.map((s, i) => (
                <View key={i} style={styles.strengthItem}>
                  <Text style={styles.strengthArea}>{s.area}</Text>
                  <Text style={styles.strengthDetail}>{s.detail}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses?.length > 0 && (
            <Card style={styles.resultCard} variant="warning" padding="md">
              <Text style={styles.sectionTitle}>⚠️ Areas to Improve</Text>
              {analysis.weaknesses.map((w, i) => (
                <View key={i} style={styles.strengthItem}>
                  <Text style={styles.strengthArea}>{w.area}</Text>
                  <Text style={styles.strengthDetail}>{w.detail}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <Card style={styles.resultCard} padding="md">
              <Text style={styles.sectionTitle}>💡 Suggestions</Text>
              {analysis.suggestions.map((s, i) => (
                <View key={i} style={styles.suggestionItem}>
                  <View style={styles.suggestionType}>
                    <Text style={styles.suggestionTypeText}>{s.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.suggestionSection}>Section: {s.section}</Text>
                  {s.current && (
                    <Text style={styles.suggestionCurrent}>Current: {s.current}</Text>
                  )}
                  <Text style={styles.suggestionNew}>Suggested: {s.suggested}</Text>
                  <Text style={styles.suggestionReason}>Why: {s.reason}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Missing Sections */}
          {analysis.missing_sections?.length > 0 && (
            <Card style={styles.resultCard} variant="error" padding="md">
              <Text style={styles.sectionTitle}>❌ Missing Sections</Text>
              {analysis.missing_sections.map((section, i) => (
                <Text key={i} style={styles.missingText}>• {section}</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSizes.sm,
    lineHeight: 22,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  jdInput: {
    minHeight: 120,
  },
  analyzeButton: {
    marginBottom: Spacing.xl,
  },
  resultsSection: {
    gap: Spacing.md,
  },
  resultsTitle: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  scoreCard: {
    alignItems: 'center',
  },
  scoreCardLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: '800',
  },
  scoreOutOf: {
    color: Colors.textMuted,
    fontSize: FontSizes.lg,
    marginBottom: 12,
  },
  summaryText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  miniScoreCard: {
    marginBottom: Spacing.sm,
  },
  miniScoreLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  miniScoreRow: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  miniScoreBar: {
    height: '100%',
    borderRadius: Radius.full,
  },
  miniScoreValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
  keywordsCard: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  keywordBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  keywordText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  resultCard: {
    marginBottom: Spacing.sm,
  },
  strengthItem: {
    marginBottom: Spacing.md,
  },
  strengthArea: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  strengthDetail: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  suggestionItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionType: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  suggestionTypeText: {
    color: Colors.primary,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  suggestionSection: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  suggestionCurrent: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  suggestionNew: {
    color: Colors.success,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  suggestionReason: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontStyle: 'italic',
  },
  missingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
});

export default ResumeAnalyzeScreen;