import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import useInterviewStore from '../../store/interviewStore';

const InterviewSession = () => {
  const {
    currentRole,
    currentDifficulty,
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
    clearError,
  } = useInterviewStore();

  const [questionType, setQuestionType] = useState('behavioral');

  // Generate first question on mount
  useEffect(() => {
    handleNewQuestion();
  }, []);

  const handleNewQuestion = async () => {
    resetSession();
    try {
      await generateQuestion(currentRole, currentDifficulty, questionType);
    } catch (err) {
      console.error('Failed to generate question:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      await submitAnswer();
    } catch (err) {
      console.error('Failed to evaluate answer:', err);
    }
  };

  const isLoading = isGeneratingQuestion || isEvaluating;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {isLoading && (
        <LoadingOverlay 
          message={isGeneratingQuestion ? 'Generating question...' : 'Analyzing your answer...'} 
        />
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Header */}
        <View style={styles.sessionHeader}>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: Colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: Colors.primary }]}>{currentRole}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.warning + '20' }]}>
              <Text style={[styles.badgeText, { color: Colors.warning }]}>{currentDifficulty}</Text>
            </View>
          </View>
        </View>

        {/* Question Type Selector */}
        {!currentFeedback && (
          <View style={styles.typeSelector}>
            {['behavioral', 'technical', 'situational'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeChip,
                  questionType === type && styles.typeChipActive,
                ]}
                onPress={() => setQuestionType(type)}
              >
                <Text style={[
                  styles.typeChipText,
                  questionType === type && styles.typeChipTextActive,
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Question Card */}
        {currentQuestion && (
          <Card style={styles.questionCard} variant="primary" padding="lg">
            <View style={styles.questionHeader}>
              <Ionicons name="help-circle" size={24} color={Colors.primary} />
              <Text style={styles.questionCategory}>
                {currentQuestion.category?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            
            {currentQuestion.tips && (
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsLabel}>💡 Tips:</Text>
                {currentQuestion.tips.map((tip, index) => (
                  <Text key={index} style={styles.tipText}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Answer Input */}
        {!currentFeedback && (
          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>Your Answer</Text>
            <TextInput
              style={styles.answerInput}
              multiline
              numberOfLines={8}
              placeholder="Type your answer here... Use the STAR method (Situation, Task, Action, Result) for behavioral questions"
              placeholderTextColor={Colors.textMuted}
              value={currentAnswer}
              onChangeText={setAnswer}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{currentAnswer.length} characters</Text>
          </View>
        )}

        {/* Action Buttons */}
        {!currentFeedback ? (
          <View style={styles.actionsContainer}>
            <Button
              title="Skip Question"
              onPress={handleNewQuestion}
              variant="ghost"
              icon={<Ionicons name="refresh" size={18} color={Colors.primaryLight} />}
            />
            <Button
              title="Submit Answer"
              onPress={handleSubmit}
              disabled={currentAnswer.length < 20 || isLoading}
              loading={isEvaluating}
              fullWidth
              size="large"
            />
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            <Button
              title="Next Question"
              onPress={handleNewQuestion}
              fullWidth
              size="large"
              icon={<Ionicons name="arrow-forward" size={18} color={Colors.text} />}
            />
          </View>
        )}

        {/* Feedback Section */}
        {currentFeedback && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>📊 Your Feedback</Text>
            
            {/* Rating */}
            <Card style={styles.ratingCard} variant="primary">
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingNumber}>{currentFeedback.rating}</Text>
                <Text style={styles.ratingMax}>/ {currentFeedback.rating_max}</Text>
              </View>
              <Text style={styles.ratingLabel}>Overall Score</Text>
            </Card>

            {/* Score Breakdown */}
            <View style={styles.scoreBreakdown}>
              <ScoreBar label="Structure" score={currentFeedback.structure_score} color={Colors.primary} />
              <ScoreBar label="Content" score={currentFeedback.content_score} color={Colors.secondary} />
              <ScoreBar label="Communication" score={currentFeedback.communication_score} color={Colors.success} />
            </View>

            {/* Overall Feedback */}
            <Card style={styles.feedbackCard}>
              <Text style={styles.feedbackCardTitle}>Overall Feedback</Text>
              <Text style={styles.feedbackText}>{currentFeedback.overall_feedback}</Text>
            </Card>

            {/* Strengths */}
            {currentFeedback.strengths?.length > 0 && (
              <Card style={styles.feedbackCard} variant="success">
                <Text style={styles.feedbackCardTitle}>✅ Strengths</Text>
                {currentFeedback.strengths.map((strength, index) => (
                  <Text key={index} style={styles.feedbackListItem}>• {strength}</Text>
                ))}
              </Card>
            )}

            {/* Improvements */}
            {currentFeedback.improvements?.length > 0 && (
              <Card style={styles.feedbackCard} variant="warning">
                <Text style={styles.feedbackCardTitle}>📈 Improvements</Text>
                {currentFeedback.improvements.map((item, index) => (
                  <Text key={index} style={styles.feedbackListItem}>• {item}</Text>
                ))}
              </Card>
            )}

            {/* Sample Answer */}
            {currentFeedback.sample_answer && (
              <Card style={styles.feedbackCard}>
                <Text style={styles.feedbackCardTitle}>💡 Sample Strong Answer</Text>
                <Text style={styles.sampleAnswer}>{currentFeedback.sample_answer}</Text>
              </Card>
            )}

            {/* Follow-up Question */}
            {currentFeedback.follow_up_question && (
              <Card style={styles.feedbackCard} variant="primary">
                <Text style={styles.feedbackCardTitle}>🤔 Follow-up Question</Text>
                <Text style={styles.feedbackText}>{currentFeedback.follow_up_question}</Text>
              </Card>
            )}
          </View>
        )}

        {/* Error Message */}
        {error && (
          <Card style={styles.errorCard} variant="error">
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </Card>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Score Bar Component
const ScoreBar = ({ label, score, color }) => (
  <View style={styles.scoreBarContainer}>
    <Text style={styles.scoreBarLabel}>{label}</Text>
    <View style={styles.scoreBarTrack}>
      <View 
        style={[styles.scoreBarFill, { width: `${score * 10}%`, backgroundColor: color }]} 
      />
    </View>
    <Text style={[styles.scoreBarValue, { color }]}>{score}/10</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  sessionHeader: {
    marginBottom: Spacing.md,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: Colors.text,
  },
  questionCard: {
    marginBottom: Spacing.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  questionCategory: {
    color: Colors.primary,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  questionText: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    lineHeight: 26,
    fontWeight: '500',
  },
  tipsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tipsLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  tipText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  answerSection: {
    marginBottom: Spacing.lg,
  },
  answerLabel: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  answerInput: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSizes.md,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  feedbackSection: {
    gap: Spacing.md,
  },
  feedbackTitle: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  ratingCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ratingNumber: {
    color: Colors.primary,
    fontSize: 48,
    fontWeight: '800',
  },
  ratingMax: {
    color: Colors.textMuted,
    fontSize: FontSizes.lg,
    marginBottom: 8,
  },
  ratingLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  scoreBreakdown: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreBarLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    width: 90,
  },
  scoreBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  scoreBarValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  feedbackCard: {
    marginBottom: Spacing.sm,
  },
  feedbackCardTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  feedbackText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
  feedbackListItem: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  sampleAnswer: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  errorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    flex: 1,
  },
  dismissText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.md,
  },
});

export default InterviewSession;