import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import useInterviewStore from '../../store/interviewStore';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import CountdownTimer from '../../components/ui/CountdownTimer';
import ErrorState from '../../components/ui/ErrorState';
import SlowNetworkBanner from '../../components/ui/SlowNetworkBanner';

export default function MockProgressScreen() {
  const flow = useInterviewFlowStore();
  const store = useInterviewStore();
  const isMounted = useRef(true);

  const {
    role, difficulty, language, questionCount, timeLimitPerQuestion,
    interviewType, currentQuestionIndex,
  } = flow;

  const [transcript, setTranscript] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const {
    isListening, isTranscribing, hasPermission,
    startListening, stopListening,
  } = useVoiceRecognition();

  const questionType = interviewType === 'behavioral' ? 'behavioral'
    : interviewType === 'technical' ? 'technical'
    : 'mixed';

  // Boot the first question
  useEffect(() => {
    isMounted.current = true;
    store.startNewInterview();
    store.setRole(role || 'Software Engineer');
    store.setDifficulty(difficulty);
    store.setLanguage(language);

    store.generateQuestion(role, difficulty, questionType, language)
      .catch((err) => console.warn('Failed to generate question:', err));

    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVoicePress = useCallback(() => {
    if (isListening) {
      stopListening(transcript, (finalText) => setTranscript(finalText));
    } else {
      startListening(transcript, (finalText) => setTranscript(finalText));
    }
  }, [isListening, isTranscribing, transcript, startListening, stopListening]);

  const handleNext = useCallback(async () => {
    if (!transcript.trim()) {
      Alert.alert('Empty answer', 'Please record or type your answer before continuing.');
      return;
    }

    // Submit the answer to get scored
    store.setAnswer(transcript.trim());
    try {
      await store.submitAnswer();
    } catch (err) {
      Alert.alert('Evaluation failed', err?.message || 'Please try again.');
      return;
    }

    setTranscript('');

    // Check if we've reached the question count limit
    if (currentQuestionIndex + 1 >= questionCount) {
      // Done — go to results
      setIsFinishing(true);
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
      router.replace('/interview/results');
      return;
    }

    // Advance + generate next question
    flow.advanceQuestion();
    try {
      await store.generateQuestion(role, difficulty, questionType, language);
    } catch (err) {
      Alert.alert('Failed to load next question', err?.message || 'Please try again.');
    }
  }, [transcript, store, currentQuestionIndex, questionCount, flow, role, difficulty, language, interviewType]);

  const handleAbort = useCallback(() => {
    Alert.alert(
      'End mock interview?',
      'Your progress will be lost. Are you sure?',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'End now', style: 'destructive', onPress: () => router.replace('/(tabs)/') },
      ]
    );
  }, []);

  // Loading
  if (store.isGeneratingQuestion && !store.currentQuestion) {
    return (
      <View style={styles.screen}>
        <SlowNetworkBanner />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading question {currentQuestionIndex + 1}…</Text>
        </View>
      </View>
    );
  }

  // Error
  if (store.error && !store.currentQuestion) {
    return (
      <View style={styles.screen}>
        <SlowNetworkBanner />
        <ErrorState
          variant="error"
          title="Couldn't load question"
          message={store.error}
          onRetry={() => router.back()}
          retryLabel="Go back"
        />
      </View>
    );
  }

  const questionText = typeof store.currentQuestion === 'string'
    ? store.currentQuestion
    : store.currentQuestion?.question || '';

  const questionCategory = typeof store.currentQuestion === 'object'
    ? store.currentQuestion?.category
    : null;

  return (
    <View style={styles.screen}>
      <SlowNetworkBanner />

      {/* Header with progress + abort */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAbort} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestionIndex + 1) / questionCount) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            Question {currentQuestionIndex + 1} of {questionCount}
          </Text>
        </View>

        <View style={styles.headerScore}>
          <Ionicons name="star" size={12} color={Colors.warning} />
          <Text style={styles.scoreText}>
            {(store.sessionScoreTotal / Math.max(1, store.sessionAnswerCount)).toFixed(1)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {questionCategory ? <Badge label={questionCategory} variant="primary" size="md" /> : null}

        <Text style={styles.questionText}>{questionText}</Text>

        {/* Timer */}
        {timeLimitPerQuestion > 0 ? (
          <View style={styles.timerWrap}>
            <CountdownTimer
              seconds={timeLimitPerQuestion}
              onComplete={handleNext}
              size={96}
            />
            <Text style={styles.timerHint}>Auto-advances when time runs out</Text>
          </View>
        ) : null}

        {/* Transcript preview */}
        {transcript ? (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>Your answer (transcribed)</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        ) : null}
      </View>

      {/* Footer — voice + next */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            (isListening || isTranscribing) && styles.voiceButtonActive,
          ]}
          onPress={handleVoicePress}
          disabled={isTranscribing || isFinishing}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isListening ? 'stop' : 'mic'}
            size={28}
            color={isListening ? '#FFFFFF' : Colors.primary}
          />
          <Text style={[styles.voiceLabel, isListening && styles.voiceLabelActive]}>
            {isTranscribing ? 'Transcribing…' : isListening ? 'Listening' : 'Tap to record'}
          </Text>
        </TouchableOpacity>

        <Button
          label="Submit & next"
          icon="arrow-forward"
          iconPosition="right"
          size="lg"
          disabled={!transcript.trim() || isFinishing || isTranscribing}
          onPress={handleNext}
          style={{ flex: 1 }}
        />
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
  headerScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  scoreText: {
    fontSize: FontSizes.xs,
    color: Colors.warning,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  questionText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
    letterSpacing: -0.2,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  timerWrap: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  timerHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  transcriptCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
    ...Shadows.small,
  },
  transcriptLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  transcriptText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  voiceButton: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
  },
  voiceButtonActive: {
    backgroundColor: Colors.error,
  },
  voiceLabel: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  voiceLabelActive: {
    color: '#FFFFFF',
  },
});
