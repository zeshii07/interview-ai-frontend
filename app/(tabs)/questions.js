import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import useInterviewStore from '../../store/interviewStore';

const QuestionsScreen = () => {
  const { questionBank, isGeneratingQuestion, loadQuestionBank, error, clearError } = useInterviewStore();
  const [selectedRole, setSelectedRole] = useState('');

  const handleLoadQuestions = async () => {
    if (selectedRole.trim().length < 2) return;
    try {
      await loadQuestionBank(selectedRole.trim());
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return Colors.success;
      case 'intermediate': return Colors.warning;
      case 'expert': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const renderQuestion = ({ item, index }) => (
    <Card style={styles.questionCard} padding="md">
      <View style={styles.questionHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
          <Text style={[styles.typeText, { color: getDifficultyColor(item.difficulty) }]}>
            {item.type?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.questionNumber}>Q{index + 1}</Text>
      </View>
      
      <Text style={styles.questionText}>{item.question}</Text>
      
      {item.key_points?.length > 0 && (
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsTitle}>Key Points to Cover:</Text>
          {item.key_points.map((point, i) => (
            <Text key={i} style={styles.pointText}>• {point}</Text>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.screen}>
      {isGeneratingQuestion && <LoadingOverlay message="Generating question bank..." />}
      
      <FlatList
        data={questionBank}
        renderItem={renderQuestion}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Question Bank</Text>
            <Text style={styles.subtitle}>Search any role to load targeted questions</Text>
            
            {/* Sleek Search Input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.roleInput}
                placeholder="e.g., Product Manager, UX Designer..."
                placeholderTextColor={Colors.textMuted}
                value={selectedRole}
                onChangeText={setSelectedRole}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <Button
              title="Load Questions"
              onPress={handleLoadQuestions}
              disabled={selectedRole.trim().length < 2 || isGeneratingQuestion}
              fullWidth
              style={styles.loadButton}
              icon={<Ionicons name="download-outline" size={18} color={Colors.textPrimary} style={{marginRight: 4}} />}
            />

            {error && (
              <Card style={styles.errorCard} variant="error" padding="sm">
                <Text style={styles.errorText}>{error}</Text>
              </Card>
            )}
          </View>
        }
        ListEmptyComponent={
          !isGeneratingQuestion ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Text style={styles.emptyIcon}>📋</Text>
              </View>
              <Text style={styles.emptyTitle}>No questions loaded</Text>
              <Text style={styles.emptySubtitle}>Type a role above and tap "Load Questions" to curate a study list.</Text>
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
    backgroundColor: Colors.bgPrimary,
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
    marginBottom: Spacing.lg,
  },
  
  // Input Styling
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 54,
    marginBottom: Spacing.lg,
  },
  roleInput: { 
    flex: 1, 
    color: Colors.textPrimary, 
    fontSize: FontSizes.md, 
    marginLeft: Spacing.sm,
    height: '100%' 
  },

  loadButton: {
    marginBottom: Spacing.xl,
  },
  
  // Question Card
  questionCard: {
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  pointsContainer: {
    backgroundColor: Colors.bgElevated,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  pointsTitle: {
    color: Colors.primaryLight,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  pointText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 20,
  },
  
  // Error & Empty States
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
  emptyIcon: {
    fontSize: 32,
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
    maxWidth: '80%',
  },
});

export default QuestionsScreen;