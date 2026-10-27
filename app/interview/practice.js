import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import useInterviewStore from '../../store/interviewStore';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ErrorState from '../../components/ui/ErrorState';
import SlowNetworkBanner from '../../components/ui/SlowNetworkBanner';

export default function PracticeScreen() {
  const flow = useInterviewFlowStore();
  const store = useInterviewStore();
  const isMounted = useRef(true);

  const {
    role, difficulty, language, questionCount, timeLimitPerQuestion,
    interviewType,
  } = flow;

  // Local UI state
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Voice recognition
  const {
    isListening, isTranscribing, hasPermission,
    startListening, stopListening,
  } = useVoiceRecognition();

  // Question type derived from interview type
  const questionType = interviewType === 'behavioral' ? 'behavioral'
    : interviewType === 'technical' ? 'technical'
    : 'mixed';

  // Initialize: start new session + generate first question
  useEffect(() => {
    isMounted.current = true;

    store.startNewInterview();
    store.setRole(role || 'Software Engineer');
    store.setDifficulty(difficulty);
    store.setLanguage(language);

    // Generate the first question
    store.generateQuestion(role, difficulty, questionType, language)
      .catch((err) => console.warn('Failed to generate question:', err));

    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer for current question
  useEffect(() => {
    if (!timeLimitPerQuestion || !store.currentQuestion || store.currentFeedback) return;

    const startedAt = store.currentQuestionStartedAt || Date.now();
    setRemainingTime(timeLimitPerQuestion);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, timeLimitPerQuestion - elapsed);
      setRemainingTime(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentQuestion, store.currentQuestionStartedAt, timeLimitPerQuestion, store.currentFeedback]);

  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || store.isEvaluating) return;

    store.setAnswer(answer.trim());
    try {
      await store.submitAnswer();
    } catch (err) {
      Alert.alert('Evaluation failed', err?.message || 'Please try again.');
    }
  }, [answer, store]);

  const handleNextQuestion = useCallback(async () => {
    setAnswer('');
    setShowHint(false);

    // Check if we've hit the question count limit
    if (store.sessionAnswerCount >= questionCount) {
      // Session complete — go to results
      flow.setResults({
        score: store.sessionScoreTotal / Math.max(1, store.sessionAnswerCount),
        maxScore: 10,
        questionCount: store.sessionAnswerCount,
        role,
        type: interviewType,
        startedAt: store.currentSessionId,
        durationSec: 0,
      });
      router.push('/interview/results');
      return;
    }

    try {
      await store.generateQuestion(role, difficulty, questionType, language);
    } catch (err) {
      Alert.alert('Failed to load next question', err?.message || 'Please try again.');
    }
  }, [answer, store, questionCount, flow, role, difficulty, language, interviewType]);

  const handleVoicePress = useCallback(() => {
    if (isListening) {
      stopListening(answer, (finalText) => setAnswer(finalText));
    } else {
      startListening(answer, (finalText) => setAnswer(finalText));
    }
  }, [isListening, isTranscribing, answer, startListening, stopListening]);

  const handleFinish = useCallback(() => {
    Alert.alert(
      'Finish practice?',
      `You've answered ${store.sessionAnswerCount} question${store.sessionAnswerCount === 1 ? '' : 's'}. Go to results?`,
      [
        { text: 'Keep practicing', style: 'cancel' },
        {
          text: 'See results',
          style: 'default',
          onPress: () => {
            const avg = store.sessionAnswerCount > 0
              ? store.sessionScoreTotal / store.sessionAnswerCount
              : 0;
            flow.setResults({
              score: avg,
              maxScore: 10,
              questionCount: store.sessionAnswerCount,
              role, type: interviewType,
              startedAt: store.currentSessionId,
              durationSec: 0,
            });
            router.push('/interview/results');
          },
        },
      ]
    );
  }, [store, flow, role, interviewType]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Loading state
  if (store.isGeneratingQuestion && !store.currentQuestion) {
    return (
      <View style={styles.screen}>
        <SlowNetworkBanner />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating your question…</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (store.error && !store.currentQuestion) {
    return (
      <View style={styles.screen}>
        <SlowNetworkBanner />
        <ErrorState
          variant="error"
          title="Couldn't start interview"
          message={store.error}
          onRetry={() => router.back()}
          retryLabel="Go back"
        />
      </View>
    );
  }

  // After-answer feedback screen
  if (store.currentFeedback) {
    return (
      <FeedbackView
        feedback={store.currentFeedback}
        questionText={store.currentQuestion?.question || ''}
        userAnswer={store.currentAnswer}
        onNext={handleNextQuestion}
        onFinish={handleFinish}
        questionIndex={store.sessionAnswerCount}
        totalQuestions={questionCount}
      />
    );
  }

  // Active question screen
  const questionText = typeof store.currentQuestion === 'string'
    ? store.currentQuestion
    : store.currentQuestion?.question || '';

  const questionCategory = typeof store.currentQuestion === 'object'
    ? store.currentQuestion?.category
    : null;

  return (
    <View style={styles.screen}>
      <SlowNetworkBanner />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(store.sessionAnswerCount / questionCount) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            Question {store.sessionAnswerCount + 1} of {questionCount}
          </Text>
        </View>

        <View style={styles.timerWrap}>
          {timeLimitPerQuestion > 0 ? (
            <>
              <Ionicons name="time-outline" size={12} color={remainingTime <= 10 ? Colors.error : Colors.textMuted} />
              <Text style={[styles.timerText, remainingTime <= 10 && styles.timerLow]}>
                {formatTime(remainingTime)}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        // SPRINT 3.1 FIX: keyboard avoidance for the chat-input bar.
        // On iOS use 'padding' (the standard).
        // On Android use 'height' (the standard for chat-style inputs).
        // The previous code used `undefined` on Android which means the
        // chat-input bar got covered by the keyboard.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        enabled
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {questionCategory ? (
            <Badge label={questionCategory} variant="primary" size="md" />
          ) : null}

          <Text style={styles.questionText}>{questionText}</Text>

          {showHint ? (
            <View style={styles.hintBox}>
              <Ionicons name="bulb-outline" size={14} color={Colors.warning} />
              <Text style={styles.hintText}>
                {questionCategory === 'behavioral'
                  ? 'Use STAR format: Situation, Task, Action, Result.'
                  : questionCategory === 'technical'
                  ? 'Explain your reasoning clearly, then give the practical solution.'
                  : 'Take a breath, structure your answer, then write.'}
              </Text>
            </View>
          ) : null}

          <View style={styles.answerWrap}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerLabel}>Your answer</Text>
              <TouchableOpacity onPress={() => setShowHint(!showHint)}>
                <Text style={styles.hintToggle}>{showHint ? 'Hide hint' : 'Show hint'}</Text>
              </TouchableOpacity>
            </View>
            {/* OLD: separate TextInput + footer with voice button + submit button.
                NEW: chat-input style — single combined input bar with mic + send
                inside it, like WhatsApp/Telegram/ChatGPT mobile. */}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Chat-input bar — mic and send button INSIDE the text input,
            like modern chat apps. When the input is empty, mic shows
            (tap to record). When the input has text, send shows (tap to
            submit). While transcribing, show a spinner. */}
        <View style={styles.chatInputBar}>
          <View style={styles.chatInputWrap}>
            <TextInput
              style={styles.chatInput}
              placeholder={isListening ? 'Listening…' : isTranscribing ? 'Transcribing…' : 'Type your answer or tap mic to speak'}
              placeholderTextColor={Colors.textMuted}
              value={answer}
              onChangeText={setAnswer}
              multiline
              maxLength={2000}
              editable={!isTranscribing && !store.isEvaluating}
              textAlignVertical="top"
            />

            {/* Right-side action button — mic OR send OR spinner,
                depending on state. This is the modern chat pattern. */}
            {isTranscribing ? (
              <View style={[styles.chatActionButton, styles.chatActionBusy]}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : answer.trim() ? (
              <TouchableOpacity
                style={[styles.chatActionButton, styles.chatActionSend]}
                onPress={handleSubmit}
                disabled={store.isEvaluating}
                activeOpacity={0.8}
                accessibilityLabel="Submit answer"
                accessibilityRole="button"
              >
                {store.isEvaluating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.chatActionButton,
                  isListening ? styles.chatActionActive : styles.chatActionMic,
                  !hasPermission && styles.chatActionDisabled,
                ]}
                onPress={handleVoicePress}
                disabled={!hasPermission || store.isEvaluating}
                activeOpacity={0.8}
                accessibilityLabel={isListening ? 'Stop recording' : 'Start voice input'}
                accessibilityRole="button"
              >
                <Ionicons
                  name={isListening ? 'stop' : 'mic'}
                  size={20}
                  color={isListening ? '#FFFFFF' : Colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Hint text below input bar */}
          <Text style={styles.chatInputHint}>
            {isListening
              ? 'Tap stop when done, or just keep talking — we\'ll transcribe'
              : isTranscribing
              ? 'Transcribing your audio…'
              : answer.trim()
              ? `${answer.trim().length} chars — tap arrow to submit`
              : hasPermission
              ? 'Tap mic to record your answer'
              : 'Microphone permission needed — enable in Settings'}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Feedback view ──────────────────────────────────────────────────────────

function FeedbackView({ feedback, questionText, userAnswer, onNext, onFinish, questionIndex, totalQuestions }) {
  const score = Number(feedback?.rating || feedback?.score || 0);
  const maxScore = Number(feedback?.rating_max || feedback?.maxScore || 10);
  const breakdown = feedback?.breakdown || feedback?.categories || [];
  const strengths = feedback?.strengths || [];
  const weaknesses = feedback?.weaknesses || feedback?.improvements || [];
  const explanation = feedback?.explanation || feedback?.feedback || '';

  const isLast = questionIndex >= totalQuestions;

  return (
    <View style={styles.screen}>
      <SlowNetworkBanner />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackEyebrow}>Question {questionIndex} of {totalQuestions}</Text>
          <Text style={styles.feedbackTitle}>AI Feedback</Text>
        </View>

        {/* Score hero */}
        <View style={styles.scoreHero}>
          <Text style={styles.scoreNumber}>{score.toFixed(1)}</Text>
          <Text style={styles.scoreMax}>/{maxScore}</Text>
        </View>
        <Text style={styles.scoreLabel}>
          {score >= 8.5 ? 'Outstanding answer' : score >= 7 ? 'Strong answer' : score >= 5 ? 'Needs work' : 'Needs improvement'}
        </Text>

        {/* Breakdown */}
        {breakdown.length > 0 ? (
          <View style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Breakdown</Text>
            {breakdown.map((b, i) => (
              <View key={i} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{b.label || b.category}</Text>
                <Text style={styles.breakdownScore}>{b.score}/{b.maxScore || maxScore}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Explanation */}
        {explanation ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <Text style={styles.explanationText}>{explanation}</Text>
          </View>
        ) : null}

        {/* Strengths & weaknesses */}
        {(strengths.length > 0 || weaknesses.length > 0) ? (
          <View style={styles.strengthsWeaknessesRow}>
            {strengths.length > 0 ? (
              <View style={[styles.swCard, styles.strengthsCard]}>
                <Text style={styles.swTitle}>Strengths</Text>
                {strengths.map((s, i) => (
                  <Text key={i} style={styles.swText}>• {s}</Text>
                ))}
              </View>
            ) : null}
            {weaknesses.length > 0 ? (
              <View style={[styles.swCard, styles.weaknessesCard]}>
                <Text style={styles.swTitle}>To improve</Text>
                {weaknesses.map((w, i) => (
                  <Text key={i} style={styles.swText}>• {w}</Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={isLast ? 'See results' : 'Next question'}
          icon="arrow-forward"
          iconPosition="right"
          size="lg"
          fullWidth
          onPress={onNext}
        />
        <TouchableOpacity onPress={onFinish} style={styles.finishButton}>
          <Text style={styles.finishText}>Finish & see results</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.sm, color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  progressWrap: { flex: 1 },
  progressBar: {
    height: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timerText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timerLow: { color: Colors.error },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  questionText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
    letterSpacing: -0.2,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  hintText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.warning,
    lineHeight: 17,
  },
  answerWrap: {
    marginTop: Spacing.sm,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  answerLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hintToggle: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  answerInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    minHeight: 140,
    lineHeight: 22,
  },

  // ─── NEW chat-input styles (Sprint 3) ──────────────────────────────────
  // Combined input bar — text input on the left, action button (mic/send)
  // on the right, INSIDE the same rounded container. Like WhatsApp/Telegram.
  chatInputBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chatInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    minHeight: 52,
  },
  chatInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
    minHeight: 28,
    maxHeight: 140,
    lineHeight: 22,
  },
  chatActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatActionMic: {
    backgroundColor: Colors.primaryBg,
  },
  chatActionActive: {
    backgroundColor: Colors.error,
    ...Shadows.small,
  },
  chatActionSend: {
    backgroundColor: Colors.primary,
    ...Shadows.primary,
  },
  chatActionBusy: {
    backgroundColor: Colors.primaryBg,
  },
  chatActionDisabled: {
    opacity: 0.4,
  },
  chatInputHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs + 2,
    marginLeft: Spacing.sm,
    textAlign: 'center',
  },

  // Feedback view
  feedbackHeader: {
    marginBottom: Spacing.md,
  },
  feedbackEyebrow: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  feedbackTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  scoreHero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  scoreNumber: {
    fontSize: FontSizes.display,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -2,
  },
  scoreMax: {
    fontSize: FontSizes.xl,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  scoreLabel: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  breakdownCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  breakdownScore: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  explanationText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  strengthsWeaknessesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  swCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  strengthsCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.20)',
  },
  weaknessesCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderColor: 'rgba(245, 158, 11, 0.20)',
  },
  swTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  swText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  finishButton: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  finishText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
