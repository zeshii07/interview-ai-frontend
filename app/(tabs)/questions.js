import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Colors,
  Gradients,
  Spacing,
  FontSizes,
  Radius,
  Shadows,
} from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import useInterviewStore from '../../store/interviewStore';

const DIFFICULTIES = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

const QuestionsScreen = () => {
  const {
    questionBank,
    currentLanguage,
    isGeneratingQuestion,
    loadQuestionBank,
    error,
    clearError,
  } = useInterviewStore();

  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('mixed');

  const handleLoadQuestions = async () => {
    const role = selectedRole.trim();

    if (role.length < 2) {
      Alert.alert('Role required', 'Enter a valid role title.');
      return;
    }

    clearError();

    try {
      await loadQuestionBank(
        role,
        10,
        selectedDifficulty,
        currentLanguage
      );
    } catch (err) {
      Alert.alert('Could not load questions', err.message);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return Colors.success;
      case 'intermediate':
        return Colors.warning;
      case 'expert':
        return Colors.error;
      default:
        return Colors.textMuted;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'technical':
        return 'code-slash-outline';
      case 'behavioral':
        return 'people-outline';
      case 'situational':
        return 'git-branch-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderQuestion = ({ item, index }) => {
    const difficultyColor = getDifficultyColor(item.difficulty);

    return (
      <Card style={styles.questionCard} padding="md">
        <View style={styles.questionHeader}>
          <View style={styles.badgesRow}>
            <View style={styles.typeBadge}>
              <Ionicons
                name={getTypeIcon(item.type)}
                size={13}
                color={Colors.primaryDark}
              />
              <Text style={styles.typeText}>
                {(item.type || 'technical').toUpperCase()}
              </Text>
            </View>

            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: `${difficultyColor}18` },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: difficultyColor },
                ]}
              >
                {(item.difficulty || 'intermediate').toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.questionNumber}>Q{index + 1}</Text>
        </View>

        <Text style={styles.questionText}>{item.question}</Text>

        {item.key_points?.length > 0 ? (
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsTitle}>Key points to cover</Text>
            {item.key_points.map((point, pointIndex) => (
              <View
                key={`${point}-${pointIndex}`}
                style={styles.pointRow}
              >
                <View style={styles.pointDot} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {item.common_mistakes?.length > 0 ? (
          <View style={styles.mistakesContainer}>
            <Text style={styles.mistakesTitle}>Common mistakes</Text>
            {item.common_mistakes.map((mistake, mistakeIndex) => (
              <View
                key={`${mistake}-${mistakeIndex}`}
                style={styles.pointRow}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={15}
                  color={Colors.error}
                />
                <Text style={styles.pointText}>{mistake}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={styles.screen}>
      {isGeneratingQuestion ? (
        <LoadingOverlay message="Generating question bank..." />
      ) : null}

      <FlatList
        data={questionBank}
        renderItem={renderQuestion}
        keyExtractor={(item, index) =>
          String(item.id || `${item.question}-${index}`)
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Question Bank</Text>
            <Text style={styles.subtitle}>
              Build a role-specific study list at the difficulty you need.
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="search-outline"
                size={20}
                color={Colors.textMuted}
              />
              <TextInput
                style={styles.roleInput}
                placeholder="e.g. React Native Developer"
                placeholderTextColor={Colors.textMuted}
                value={selectedRole}
                onChangeText={(value) => {
                  setSelectedRole(value);
                  if (error) clearError();
                }}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleLoadQuestions}
                accessibilityLabel="Search role"
              />
            </View>

            <Text style={styles.filterLabel}>DIFFICULTY</Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTIES.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setSelectedDifficulty(item.value)}
                  style={[
                    styles.difficultyButton,
                    selectedDifficulty === item.value &&
                      styles.difficultyButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      selectedDifficulty === item.value &&
                        styles.difficultyButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.languageNote}>
              <Ionicons
                name="language-outline"
                size={17}
                color={Colors.primaryDark}
              />
              <Text style={styles.languageNoteText}>
                Questions will be generated in {currentLanguage || 'English'}.
              </Text>
            </View>

            <Button
              title="Load Questions"
              onPress={handleLoadQuestions}
              disabled={
                selectedRole.trim().length < 2 ||
                isGeneratingQuestion
              }
              fullWidth
              style={styles.loadButton}
              icon={
                <Ionicons
                  name="download-outline"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 4 }}
                />
              }
            />

            {error ? (
              <Card
                style={styles.errorCard}
                variant="error"
                padding="sm"
              >
                <Text style={styles.errorText}>{error}</Text>
              </Card>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isGeneratingQuestion ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons
                  name="library-outline"
                  size={32}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No questions loaded</Text>
              <Text style={styles.emptySubtitle}>
                Enter a role, choose a difficulty, and generate a focused
                practice list.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    ...Gradients.screen,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    lineHeight: 23,
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 54,
    marginBottom: Spacing.md,
  },
  roleInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    marginLeft: Spacing.sm,
    height: '100%',
  },
  filterLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  difficultyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  difficultyButton: {
    minWidth: '47%',
    flexGrow: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  difficultyButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  difficultyButtonText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  difficultyButtonTextActive: {
    color: Colors.primaryDark,
  },
  languageNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    marginBottom: Spacing.md,
  },
  languageNoteText: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: FontSizes.xs,
    lineHeight: 18,
    fontWeight: '700',
  },
  loadButton: {
    marginBottom: Spacing.xl,
  },
  questionCard: {
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  badgesRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryBg,
  },
  typeText: {
    color: Colors.primaryDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  questionNumber: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  questionText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    lineHeight: 26,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  pointsContainer: {
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
    gap: 7,
  },
  pointsTitle: {
    color: Colors.primaryDark,
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
  mistakesContainer: {
    backgroundColor: '#FFF5F6',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    gap: 7,
  },
  mistakesTitle: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pointDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  pointText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 20,
  },
  errorCard: {
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '82%',
  },
});

export default QuestionsScreen;
