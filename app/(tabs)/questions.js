import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import { ROLES } from '../../constants/config';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import useInterviewStore from '../../store/interviewStore';

const QuestionsScreen = () => {
  const { questionBank, isGeneratingQuestion, loadQuestionBank, error, clearError } = useInterviewStore();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleLoadQuestions = async () => {
    if (!selectedRole) return;
    try {
      await loadQuestionBank(selectedRole);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return Colors.success;
      case 'intermediate': return Colors.warning;
      case 'expert': return Colors.error;
      default: return Colors.textSecondary;
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
          <Text style={styles.pointsTitle">Key Points to Cover:</Text>
          {item.key_points.map((point, i) => (
            <Text key={i} style={styles.pointText}>• {point}</Text>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      {isGeneratingQuestion && <LoadingOverlay message="Generating question bank..." />}
      
      <FlatList
        data={questionBank}
        renderItem={renderQuestion}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Question Bank</Text>
            <Text style={styles.subtitle}>Select a role to load targeted questions</Text>
            
            {/* Role Selection Grid */}
            <View style={styles.roleGrid}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleCard,
                    selectedRole === role && styles.roleCardSelected,
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[
                    styles.roleText,
                    selectedRole === role && styles.roleTextSelected,
                  ]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Load Questions"
              onPress={handleLoadQuestions}
              disabled={!selectedRole || isGeneratingQuestion}
              fullWidth
              style={styles.loadButton}
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
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No questions loaded</Text>
              <Text style={styles.emptySubtitle}>Select a role above and click "Load Questions"</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  roleCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  roleTextSelected: {
    color: Colors.text,
  },
  loadButton: {
    marginBottom: Spacing.lg,
  },
  questionCard: {
    marginBottom: Spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  questionNumber: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  questionText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  pointsContainer: {
    backgroundColor: Colors.background + '50',
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
    lineHeight: 18,
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});

export default QuestionsScreen;