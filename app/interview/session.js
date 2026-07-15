import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

import LoadingOverlay from '../../components/ui/LoadingOverlay';
import ScoreRing from '../../components/ui/ScoreRing';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import useInterviewStore from '../../store/interviewStore';
import { Colors, Gradients } from '../../constants/theme';

const palette = {
  ink: Colors.textPrimary,
  muted: Colors.textMuted,
  purple: '#7047F5',
  purpleDark: '#5330DB',
  lavender: Colors.primaryBg,
  line: Colors.border,
  background: Colors.bgPrimary,
  surface: Colors.bgCard,
  success: '#169B70',
  warning: '#C77A19',
  blue: '#3478F6',
};

const QUESTION_TYPES = ['mixed', 'behavioral', 'technical', 'situational'];

const getPerformanceLabel = (score) => {
  if (Number(score) >= 9) return 'Outstanding performance';
  if (Number(score) >= 7.5) return 'Strong performance';
  if (Number(score) >= 5) return 'Good progress';
  return 'Keep building momentum';
};

function Metric({ icon, label, score, color }) {
  return (
    <View style={styles.metricBox}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}14` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text selectable style={[styles.metricScore, { color }]}>{score ?? '—'}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function FeedbackCard({ icon, title, tone = 'purple', children }) {
  const tones = {
    purple: { background: palette.surface, border: palette.line, iconBackground: palette.lavender, iconColor: palette.purple },
    success: { background: '#F4FCF8', border: '#BCE8D8', iconBackground: '#DDF5EA', iconColor: palette.success },
    warning: { background: palette.surface, border: palette.line, iconBackground: palette.lavender, iconColor: palette.warning },
    blue: { background: '#F5F8FF', border: '#C9D9FA', iconBackground: '#E1EAFF', iconColor: palette.blue },
  };
  const colors = tones[tone] || tones.purple;

  return (
    <View style={[styles.feedbackCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.feedbackCardHeader}>
        <View style={[styles.feedbackCardIcon, { backgroundColor: colors.iconBackground }]}>
          <Ionicons name={icon} size={21} color={colors.iconColor} />
        </View>
        <Text style={styles.feedbackCardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FeedbackList({ items, tone }) {
  return items.map((item, index) => (
    <View key={`${item}-${index}`} style={styles.feedbackListRow}>
      <View style={[styles.listDot, tone === 'success' ? styles.successDot : styles.warningDot]} />
      <Text selectable style={styles.feedbackListText}>{item}</Text>
    </View>
  ));
}

export default function InterviewSession() {
  const {
    currentRole,
    currentDifficulty,
    currentLanguage,
    currentQuestion,
    currentAnswer,
    currentFeedback,
    isGeneratingQuestion,
    isEvaluating,
    error,
    setAnswer,
    generateQuestion,
    submitAnswer,
    resetSession,
  } = useInterviewStore();
  const [questionType, setQuestionType] = useState('mixed');
  const { isListening, isTranscribing, startListening, stopListening } = useVoiceRecognition();

  const handleNewQuestion = async (type = questionType) => {
    resetSession();
    try {
      await generateQuestion(currentRole, currentDifficulty, type, currentLanguage);
    } catch {}
  };

  useEffect(() => {
    handleNewQuestion('mixed');
  }, []);

  const selectQuestionType = (type) => {
    setQuestionType(type);
  };

  const handleSubmit = async () => {
    try {
      await submitAnswer();
    } catch {}
  };

  const handleShare = async () => {
    if (!currentFeedback) return;
    try {
      await Share.share({
        message: `I scored ${currentFeedback.rating}/${currentFeedback.rating_max || 10} in my ${currentRole} AI interview practice with Hirely.`,
      });
    } catch {
      Alert.alert('Unable to share', 'Please try again.');
    }
  };

  const handleLinkedInShare = async () => {
    if (!currentFeedback) return;
    const text = `I scored ${currentFeedback.rating}/${currentFeedback.rating_max || 10} in my ${currentRole} AI interview practice with Hirely.`;
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(linkedInUrl);
    } catch {
      await handleShare();
    }
  };

  const isLoading = isGeneratingQuestion || isEvaluating;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isLoading ? <LoadingOverlay message={isGeneratingQuestion ? 'Creating your question…' : 'Preparing your AI review…'} /> : null}

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="briefcase-outline" size={14} color={palette.purpleDark} />
            <Text numberOfLines={1} style={styles.metaPillText}>{currentRole}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="options-outline" size={14} color={palette.purpleDark} />
            <Text style={styles.metaPillText}>{currentDifficulty}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="language-outline" size={14} color={palette.purpleDark} />
            <Text style={styles.metaPillText}>{currentLanguage}</Text>
          </View>
        </View>

        {!currentFeedback ? (
          <>
            <View style={styles.introRow}>
              <View>
                <Text style={styles.eyebrow}>AI INTERVIEW PRACTICE</Text>
                <Text style={styles.pageTitle}>Show your best thinking</Text>
              </View>
              <View style={styles.aiOrb}>
                <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.typeRow}>
              {QUESTION_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => selectQuestionType(type)}
                  style={[styles.typeButton, questionType === type && styles.typeButtonActive]}
                >
                  <Text style={[styles.typeButtonText, questionType === type && styles.typeButtonTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {currentQuestion ? (
              <View style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionIcon}>
                    <Ionicons name="chatbubble-ellipses-outline" size={21} color={palette.purple} />
                  </View>
                  <View style={styles.questionHeaderCopy}>
                    <Text style={styles.questionNumber}>YOUR QUESTION</Text>
                    <Text style={styles.questionCategory}>{currentQuestion.category || 'Interview'}</Text>
                  </View>
                </View>
                <Text selectable style={styles.questionText}>{currentQuestion.question}</Text>
                {currentQuestion.tips?.length ? (
                  <View style={styles.tipsCard}>
                    <View style={styles.tipsHeader}>
                      <Ionicons name="bulb-outline" size={18} color={palette.warning} />
                      <Text style={styles.tipsTitle}>AI coaching tips</Text>
                    </View>
                    {currentQuestion.tips.map((tip, index) => (
                      <View key={`${tip}-${index}`} style={styles.tipRow}>
                        <View style={styles.tipDot} />
                        <Text selectable style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.answerSection}>
              <View style={styles.answerHeader}>
                <Text style={styles.answerLabel}>Your response</Text>
                <Text style={styles.characterCount}>{currentAnswer.length} characters</Text>
              </View>
              <View style={styles.inputShell}>
                <TextInput
                  multiline
                  value={currentAnswer}
                  onChangeText={setAnswer}
                  editable={!isLoading && !isListening && !isTranscribing}
                  placeholder="Structure your response clearly. The STAR method works especially well for behavioral questions…"
                  placeholderTextColor="#9B9CAA"
                  textAlignVertical="top"
                  style={styles.answerInput}
                />
                <Pressable
                  onPress={() => isListening ? stopListening(currentAnswer, setAnswer) : startListening(currentAnswer, setAnswer)}
                  disabled={isTranscribing}
                  accessibilityLabel={isListening ? 'Stop recording' : 'Record answer'}
                  style={[styles.micButton, isListening && styles.micButtonActive]}
                >
                  {isTranscribing ? <ActivityIndicator color={palette.purple} /> : <Ionicons name={isListening ? 'stop' : 'mic'} size={23} color={isListening ? '#FFFFFF' : palette.purple} />}
                </Pressable>
              </View>
              {isListening ? <Text style={styles.recordingStatus}>Recording in progress — tap stop when finished.</Text> : null}
              {isTranscribing ? <Text style={styles.processingStatus}>AI is transcribing your response…</Text> : null}
            </View>

            <View style={styles.actionRow}>
              <Pressable onPress={() => handleNewQuestion()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Ionicons name="refresh" size={18} color={palette.purpleDark} />
                <Text style={styles.secondaryButtonText}>New question</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={currentAnswer.trim().length < 20 || isLoading || isTranscribing}
                style={({ pressed }) => [styles.primaryButton, (currentAnswer.trim().length < 20 || isLoading || isTranscribing) && styles.disabled, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Review my answer</Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackHero}>
              <View style={styles.feedbackGlow} />
              <ScoreRing score={currentFeedback.rating} maxScore={currentFeedback.rating_max} size={130} />
              <View style={styles.feedbackHeroCopy}>
                <View style={styles.reviewPill}>
                  <Ionicons name="sparkles" size={13} color="#C6B8FF" />
                  <Text style={styles.reviewPillText}>AI REVIEW</Text>
                </View>
                <Text style={styles.feedbackTitle}>{getPerformanceLabel(currentFeedback.rating)}</Text>
                <Text style={styles.feedbackSubtitle}>Your personalized coaching overview is ready.</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <Metric icon="git-branch-outline" label="Structure" score={currentFeedback.structure_score} color={palette.purple} />
              <Metric icon="reader-outline" label="Content" score={currentFeedback.content_score} color={palette.blue} />
              <Metric icon="chatbubble-outline" label="Clarity" score={currentFeedback.communication_score} color={palette.success} />
            </View>

            <FeedbackCard icon="analytics-outline" title="AI overview">
              <Text selectable style={styles.feedbackBody}>{currentFeedback.overall_feedback}</Text>
            </FeedbackCard>

            {currentFeedback.strengths?.length ? (
              <FeedbackCard icon="checkmark-circle-outline" title="What you did well" tone="success">
                <FeedbackList items={currentFeedback.strengths} tone="success" />
              </FeedbackCard>
            ) : null}

            {currentFeedback.improvements?.length ? (
              <FeedbackCard icon="trending-up-outline" title="Your next improvements" tone="warning">
                <FeedbackList items={currentFeedback.improvements} tone="warning" />
              </FeedbackCard>
            ) : null}

            {currentFeedback.sample_answer ? (
              <FeedbackCard icon="bulb-outline" title="A stronger answer" tone="blue">
                <View style={styles.sampleQuote}>
                  <Text selectable style={styles.sampleText}>{currentFeedback.sample_answer}</Text>
                </View>
              </FeedbackCard>
            ) : null}

            <View style={styles.feedbackActions}>
              <Pressable onPress={() => handleNewQuestion()} style={({ pressed }) => [styles.primaryButton, styles.fullButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Next question</Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={handleLinkedInShare} style={({ pressed }) => [styles.secondaryButton, styles.fullButton, pressed && styles.pressed]}>
                <Ionicons name="logo-linkedin" size={19} color="#0A66C2" />
                <Text style={styles.secondaryButtonText}>Share to LinkedIn</Text>
              </Pressable>
            </View>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={19} color="#CF3E4F" />
            <Text selectable style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, ...Gradients.screen },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 22, paddingBottom: 52, gap: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { maxWidth: '100%', minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: '#DED7F6', backgroundColor: '#F4F0FF', paddingHorizontal: 11 },
  metaPillText: { maxWidth: 170, color: palette.purpleDark, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  introRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  eyebrow: { color: palette.purpleDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  pageTitle: { color: palette.ink, fontSize: 27, lineHeight: 34, fontWeight: '800', paddingTop: 4 },
  aiOrb: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purple, boxShadow: '0 8px 18px rgba(112,71,245,0.24)' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { minWidth: '47%', flexGrow: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  typeButtonActive: { borderColor: palette.purple, backgroundColor: palette.lavender },
  typeButtonText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  typeButtonTextActive: { color: palette.purpleDark },
  questionCard: { gap: 18, borderRadius: 22, borderCurve: 'continuous', borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, padding: 20, boxShadow: '0 10px 28px rgba(57,41,110,0.07)' },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  questionIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lavender },
  questionHeaderCopy: { gap: 2 },
  questionNumber: { color: palette.purpleDark, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  questionCategory: { color: palette.muted, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  questionText: { color: palette.ink, fontSize: 19, lineHeight: 29, fontWeight: '700' },
  tipsCard: { gap: 10, borderRadius: 15, backgroundColor: palette.lavender, padding: 14 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  tipsTitle: { color: '#8A5B18', fontSize: 12, fontWeight: '800' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  tipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D18B2A', marginTop: 7 },
  tipText: { flex: 1, color: '#65543D', fontSize: 12, lineHeight: 19 },
  answerSection: { gap: 9 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerLabel: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  characterCount: { color: palette.muted, fontSize: 10, fontVariant: ['tabular-nums'] },
  inputShell: { minHeight: 178, borderRadius: 18, borderCurve: 'continuous', borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, overflow: 'hidden' },
  answerInput: { minHeight: 178, color: palette.ink, fontSize: 15, lineHeight: 23, padding: 16, paddingRight: 60 },
  micButton: { position: 'absolute', right: 12, bottom: 12, width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lavender },
  micButtonActive: { backgroundColor: '#D84E61' },
  recordingStatus: { color: '#C73D50', fontSize: 11, fontWeight: '700' },
  processingStatus: { color: palette.purpleDark, fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryButton: { flex: 1.4, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: palette.purple, boxShadow: '0 8px 18px rgba(112,71,245,0.2)' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryButton: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  secondaryButtonText: { color: palette.purpleDark, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  feedbackContainer: { gap: 16 },
  feedbackHero: { minHeight: 190, flexDirection: 'row', alignItems: 'center', gap: 17, overflow: 'hidden', borderRadius: 24, borderCurve: 'continuous', ...Gradients.hero, borderWidth: 1, borderColor: Colors.borderLight, padding: 18 },
  feedbackGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -70, top: -90, backgroundColor: 'rgba(112,71,245,0.28)' },
  feedbackHeroCopy: { flex: 1, gap: 7 },
  reviewPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: 'rgba(112,71,245,0.25)', paddingHorizontal: 8, paddingVertical: 6 },
  reviewPillText: { color: Colors.primaryDark, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  feedbackTitle: { color: Colors.textPrimary, fontSize: 21, lineHeight: 26, fontWeight: '800' },
  feedbackSubtitle: { color: Colors.textSecondary, fontSize: 11, lineHeight: 17 },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricBox: { flex: 1, alignItems: 'center', gap: 3, borderRadius: 17, borderCurve: 'continuous', borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, paddingVertical: 14, paddingHorizontal: 5 },
  metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  metricScore: { fontSize: 22, lineHeight: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  metricLabel: { color: palette.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  feedbackCard: { gap: 13, borderRadius: 20, borderCurve: 'continuous', borderWidth: 1, padding: 17 },
  feedbackCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackCardIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  feedbackCardTitle: { flex: 1, color: palette.ink, fontSize: 16, fontWeight: '800' },
  feedbackBody: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  feedbackListRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  successDot: { backgroundColor: palette.success },
  warningDot: { backgroundColor: palette.warning },
  feedbackListText: { flex: 1, color: palette.muted, fontSize: 13, lineHeight: 21 },
  sampleQuote: { borderLeftWidth: 3, borderLeftColor: palette.blue, paddingLeft: 13 },
  sampleText: { color: '#44516B', fontSize: 13, lineHeight: 22, fontStyle: 'italic' },
  feedbackActions: { gap: 10, paddingTop: 3 },
  fullButton: { flex: 0, width: '100%' },
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: '#F1C1C8', backgroundColor: '#FFF5F6', padding: 13 },
  errorText: { flex: 1, color: '#A93343', fontSize: 12, lineHeight: 18 },
});
