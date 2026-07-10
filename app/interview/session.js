import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import {
  Colors,
  Spacing,
  FontSizes,
  Radius,
  Shadows,
} from "../../constants/theme";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ScoreRing from "../../components/ui/ScoreRing";
import ShareCard from "../../components/ui/ShareCard";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import useInterviewStore from "../../store/interviewStore";

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

  // Default to 'mixed' so users get a variety of questions!
  const [questionType, setQuestionType] = useState("mixed");

  // Voice & Share States
  const {
    isListening,
    isSupported,
    partialText,
    startListening,
    stopListening,
  } = useVoiceRecognition();
  const shareCardRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    handleNewQuestion();
  }, []);

  const handleNewQuestion = async () => {
    resetSession();
    try {
      await generateQuestion(currentRole, currentDifficulty, questionType);
    } catch (err) {}
  };

  const handleSubmit = async () => {
    try {
      await submitAnswer();
    } catch (err) {}
  };

   const handleShareCard = async () => {
    if (!currentFeedback) return;
    
    // EXPO GO WORKAROUND: Check __DEV__ BEFORE trying to capture the image
    // Capturing hidden elements hangs Expo Go, so we bypass it completely here.
    if (__DEV__) {
      Alert.alert(
        "🎯 Share Feature Ready!", 
        "In the final APK build, this button saves a premium graphic of your score and opens the Share menu. Since you are in Expo Go, we simulate the success!",
        [{ text: "Awesome" }]
      );
      return;
    }

    // REAL APK CODE: Only runs in the standalone build
    setIsSharing(true);
    try {
      const uri = await shareCardRef.current.capture();
      if (!uri) throw new Error("Failed to capture image");
      
      await Share.open({
        url: uri,
        message: `I just scored ${currentFeedback.rating}/10 on my ${currentRole} mock interview using Hirely AI! 🚀`,
      });
    } catch (error) {
      console.error("Share cancelled or failed");
    } finally {
      setIsSharing(false);
    }
  };
  const isLoading = isGeneratingQuestion || isEvaluating;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {isLoading && (
        <LoadingOverlay
          message={
            isGeneratingQuestion
              ? "Generating question..."
              : "Analyzing your answer..."
          }
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Meta */}
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: Colors.primaryBg }]}>
            <Text
              style={{
                color: Colors.primaryLight,
                fontSize: FontSizes.xs,
                fontWeight: "700",
              }}
            >
              {currentRole}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.bgElevated }]}>
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: FontSizes.xs,
                fontWeight: "600",
              }}
            >
              {currentDifficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Type Selector - MIXED IS NOW DEFAULT */}
        {!currentFeedback && (
          <View style={styles.typeRow}>
            {["mixed", "behavioral", "technical", "situational"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeBtn,
                  questionType === type && styles.typeBtnActive,
                ]}
                onPress={() => setQuestionType(type)}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    questionType === type && styles.typeBtnTextActive,
                  ]}
                >
                  {type === "mixed"
                    ? "🎲 Mixed"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Question Card */}
        {currentQuestion && (
          <Card style={styles.questionCard} padding="lg">
            <View style={styles.qHeader}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.qCategory}>
                {currentQuestion.category?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.qText}>{currentQuestion.question}</Text>
            {currentQuestion.tips && (
              <View style={styles.tipsBox}>
                <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
                {currentQuestion.tips.map((t, i) => (
                  <Text key={i} style={styles.tipItem}>
                    • {t}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Answer Input with Voice */}
        {!currentFeedback && (
          <View style={styles.answerSection}>
            <Text style={styles.label}>Your Response</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                multiline
                numberOfLines={8}
                placeholder="Use the STAR method (Situation, Task, Action, Result) for the best results..."
                placeholderTextColor={Colors.textMuted}
                value={
                  isListening
                    ? currentAnswer + " " + partialText
                    : currentAnswer
                }
                onChangeText={setAnswer}
                editable={!isLoading && !isListening}
              />
              <TouchableOpacity
                style={[styles.micBtn, isListening && styles.micBtnActive]}
                onPress={() =>
                  isListening
                    ? stopListening()
                    : startListening(currentAnswer, setAnswer)
                }
              >
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={24}
                  color={isListening ? Colors.error : Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {isListening && (
              <Text style={styles.listeningText}>🔴 Listening...</Text>
            )}
            <Text style={styles.charCount}>
              {currentAnswer.length} characters
            </Text>
          </View>
        )}

        {/* Actions */}
        {!currentFeedback ? (
          <View style={styles.actions}>
            <Button
              title="Skip"
              onPress={handleNewQuestion}
              variant="ghost"
              icon={
                <Ionicons name="refresh" size={18} color={Colors.textMuted} />
              }
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
          <Button
            title="Next Question"
            onPress={handleNewQuestion}
            fullWidth
            size="large"
            icon={
              <Ionicons
                name="arrow-forward"
                size={18}
                color={Colors.textPrimary}
                style={{ marginRight: 4 }}
              />
            }
          />
        )}

        {/* Feedback UI */}
        {currentFeedback && (
          <View style={styles.feedbackContainer}>
            {/* HIDDEN SHARE CARD */}
            <View style={{ position: "absolute", top: -9999, left: -9999 }}>
              <ShareCard
                ref={shareCardRef}
                feedback={currentFeedback}
                role={currentRole}
              />
            </View>

            <Text style={styles.feedbackTitle}>Performance Review</Text>

            <View style={styles.scoreCenter}>
              <ScoreRing
                score={currentFeedback.rating}
                maxScore={currentFeedback.rating_max}
                size={140}
              />
              <Text style={styles.scoreLabel}>Overall Score</Text>
            </View>

            <View style={styles.metricsRow}>
              <Metric
                label="Structure"
                score={currentFeedback.structure_score}
                color={Colors.primary}
              />
              <Metric
                label="Content"
                score={currentFeedback.content_score}
                color={Colors.secondary}
              />
              <Metric
                label="Clarity"
                score={currentFeedback.communication_score}
                color={Colors.success}
              />
            </View>

            <Card style={styles.fbCard} padding="md">
              <Text style={styles.fbCardTitle}>General Feedback</Text>
              <Text style={styles.fbText}>
                {currentFeedback.overall_feedback}
              </Text>
            </Card>

            {currentFeedback.strengths?.length > 0 && (
              <Card style={styles.fbCard} variant="success" padding="md">
                <Text style={styles.fbCardTitle}>✅ Strengths</Text>
                {currentFeedback.strengths.map((s, i) => (
                  <Text key={i} style={styles.fbListItem}>
                    • {s}
                  </Text>
                ))}
              </Card>
            )}

            {currentFeedback.improvements?.length > 0 && (
              <Card style={styles.fbCard} variant="warning" padding="md">
                <Text style={styles.fbCardTitle}>📈 Areas to Improve</Text>
                {currentFeedback.improvements.map((s, i) => (
                  <Text key={i} style={styles.fbListItem}>
                    • {s}
                  </Text>
                ))}
              </Card>
            )}

            {currentFeedback.sample_answer && (
              <Card style={styles.fbCard} padding="md">
                <Text style={styles.fbCardTitle}>💡 Ideal Answer Example</Text>
                <Text
                  style={[
                    styles.fbText,
                    { fontStyle: "italic", color: Colors.textMuted },
                  ]}
                >
                  {currentFeedback.sample_answer}
                </Text>
              </Card>
            )}

            <Button
              title="Share on LinkedIn"
              onPress={handleShareCard}
              fullWidth
              size="large"
              loading={isSharing}
              icon={
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={Colors.textPrimary}
                  style={{ marginRight: 4 }}
                />
              }
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        )}

        {error && (
          <Card style={{ marginTop: Spacing.md }} variant="error" padding="sm">
            <Text style={{ color: Colors.error, fontSize: FontSizes.sm }}>
              {error}
            </Text>
          </Card>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Mini Metric Component
const Metric = ({ label, score, color }) => (
  <View style={styles.metricBox}>
    <Text style={[styles.metricScore, { color }]}>{score}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingTop: Spacing.md },

  metaRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },

  // Made type buttons slightly smaller so 4 fit nicely
  typeRow: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.lg },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeBtnText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  typeBtnTextActive: { color: Colors.textPrimary },

  questionCard: { marginBottom: Spacing.xl, ...Shadows.medium },
  qHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  qCategory: {
    color: Colors.primary,
    fontSize: FontSizes.xs,
    fontWeight: "800",
    letterSpacing: 1,
  },
  qText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    lineHeight: 28,
    fontWeight: "500",
  },
  tipsBox: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tipsTitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  tipItem: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    lineHeight: 20,
    marginBottom: 2,
  },

  answerSection: { marginBottom: Spacing.lg },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    lineHeight: 24,
    textAlignVertical: "top",
    minHeight: 150,
    padding: Spacing.md,
  },
  micBtn: {
    padding: Spacing.md,
    backgroundColor: Colors.bgElevated,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  micBtnActive: { backgroundColor: Colors.error + "20" },
  listeningText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontWeight: "600",
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textAlign: "right",
    marginTop: Spacing.xs,
  },

  actions: { gap: Spacing.sm, marginBottom: Spacing.xl },

  feedbackContainer: { gap: Spacing.lg, marginTop: Spacing.sm },
  feedbackTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: "800",
    textAlign: "center",
  },
  scoreCenter: { alignItems: "center", marginVertical: Spacing.md },
  scoreLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
    fontWeight: "500",
  },

  metricsRow: {
    flexDirection: "row",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    justifyContent: "space-around",
  },
  metricBox: { alignItems: "center" },
  metricScore: { fontSize: FontSizes.xxl, fontWeight: "800" },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: 4,
    fontWeight: "600",
  },

  fbCard: { marginBottom: Spacing.sm },
  fbCardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  fbText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
  fbListItem: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 22,
    marginBottom: 4,
  },
});

export default InterviewSession;
