import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import { ROLES, DIFFICULTY_LEVELS } from '../../constants/config';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useInterviewStore from '../../store/interviewStore';

const HomeScreen = () => {
  const { setRole, setDifficulty } = useInterviewStore();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');

  const handleStartInterview = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    setDifficulty(selectedDifficulty);
    router.push('/interview/session');
  };

  const handleResumeAnalyzer = () => {
    router.push('/resume/analyze');
  };

  const features = [
    {
      icon: '🎤',
      title: 'Mock Interview',
      description: 'Practice with AI-generated questions and get instant feedback',
      color: Colors.primary,
      action: () => {},
    },
    {
      icon: '📄',
      title: 'Resume Analyzer',
      description: 'Get AI-powered feedback on your resume',
      color: Colors.secondary,
      action: handleResumeAnalyzer,
    },
    {
      icon: '📋',
      title: 'Question Bank',
      description: 'Browse role-specific interview questions',
      color: Colors.success,
      action: () => router.push('/questions'),
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Track your improvement over time',
      color: Colors.warning,
      action: () => router.push('/history'),
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello! 👋</Text>
          <Text style={styles.title}>Ready to ace your interview?</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={Colors.primary} />
        </View>
      </View>

      {/* Quick Start Card */}
      <Card style={styles.quickStartCard} variant="primary">
        <Text style={styles.quickStartTitle}>⚡ Quick Start Interview</Text>
        <Text style={styles.quickStartSubtitle}>Select your role and difficulty to begin</Text>
        
        {/* Role Selection */}
        <Text style={styles.sectionLabel}>Select Role</Text>
        <View style={styles.chipsContainer}>
          {ROLES.slice(0, 4).map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.chip,
                selectedRole === role && styles.chipSelected,
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[
                styles.chipText,
                selectedRole === role && styles.chipTextSelected,
              ]}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Show more roles */}
        <TouchableOpacity 
          style={styles.showMore}
          onPress={() => router.push('/questions')}
        >
          <Text style={styles.showMoreText}>See all roles →</Text>
        </TouchableOpacity>

        {/* Difficulty Selection */}
        <Text style={styles.sectionLabel}>Difficulty Level</Text>
        <View style={styles.difficultyContainer}>
          {DIFFICULTY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.difficultyCard,
                selectedDifficulty === level.value && {
                  borderColor: level.color,
                  backgroundColor: level.color + '20',
                },
              ]}
              onPress={() => setSelectedDifficulty(level.value)}
            >
              <Text style={styles.difficultyIcon}>{level.icon}</Text>
              <Text style={[
                styles.difficultyLabel,
                selectedDifficulty === level.value && { color: level.color },
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Start Interview"
          onPress={handleStartInterview}
          disabled={!selectedRole}
          fullWidth
          size="large"
        />
      </Card>

      {/* Features Grid */}
      <Text style={styles.featuresTitle}>Explore Features</Text>
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <Card
            key={index}
            style={styles.featureCard}
            padding="lg"
          >
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
            <TouchableOpacity onPress={feature.action}>
              <Text style={styles.featureLink}>Try now →</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStartCard: {
    marginBottom: Spacing.xl,
  },
  quickStartTitle: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  quickStartSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.text,
  },
  showMore: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  showMoreText: {
    color: Colors.primaryLight,
    fontSize: FontSizes.sm,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  difficultyCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  difficultyIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  difficultyLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  featuresTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureCard: {
    width: '47%',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  featureLink: {
    color: Colors.primaryLight,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});

export default HomeScreen;