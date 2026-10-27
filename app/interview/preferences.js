import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import {
  DIFFICULTY_LEVELS,
  EXPERIENCE_LEVELS,
  LANGUAGES,
  QUESTION_COUNT_OPTIONS,
  TIME_LIMIT_OPTIONS,
} from '../../constants/config';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import GradientHero from '../../components/ui/GradientHero';
import SelectCard from '../../components/ui/SelectCard';
import Button from '../../components/ui/Button';
import FilterChip from '../../components/ui/FilterChip';

function SectionLabel({ children }) {
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

export default function PreferencesScreen() {
  const flow = useInterviewFlowStore();
  const {
    experienceLevel, difficulty, language,
    questionCount, timeLimitPerQuestion,
    interviewType, role,
  } = flow;

  const handleContinue = () => {
    // Sync the existing interviewStore so the existing session.js screen
    // picks up our preferences when it boots.
    // (interviewStore is loaded via useInterviewStore.getState() inside session.js)
    useInterviewFlowStore.getState().setPreferences({
      experienceLevel, difficulty, language, questionCount, timeLimitPerQuestion,
    });

    // If interview type is 'mock', go to the mock-start screen; otherwise go
    // straight to the practice screen.
    if (interviewType === 'mock') {
      router.push('/interview/mock-start');
    } else {
      router.push('/interview/practice');
    }
  };

  return (
    <View style={styles.screen}>
      <GradientHero
        title="Set your preferences"
        subtitle={interviewType === 'mock' ? 'Mock interview — full session' : 'Practice session — single Q&A'}
        icon="arrow-back-outline"
        onIconPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Difficulty */}
        <SectionLabel>Difficulty</SectionLabel>
        <View style={styles.cardsWrap}>
          {DIFFICULTY_LEVELS.map((d) => (
            <SelectCard
              key={d.value}
              title={d.label}
              description={d.description}
              icon="bar-chart-outline"
              selected={difficulty === d.value}
              onPress={() => flow.setDifficulty(d.value)}
            />
          ))}
        </View>

        {/* Experience level */}
        <SectionLabel>Experience level</SectionLabel>
        <View style={styles.chipRow}>
          {EXPERIENCE_LEVELS.map((e) => (
            <FilterChip
              key={e.value}
              label={e.label}
              selected={experienceLevel === e.value}
              onPress={() => flow.setExperienceLevel(e.value)}
            />
          ))}
        </View>

        {/* Language */}
        <SectionLabel>Language</SectionLabel>
        <View style={styles.chipRow}>
          {LANGUAGES.map((l) => (
            <FilterChip
              key={l.value}
              label={l.label}
              selected={language === l.value}
              onPress={() => flow.setLanguage(l.value)}
            />
          ))}
        </View>

        {/* Question count */}
        <SectionLabel>Number of questions</SectionLabel>
        <View style={styles.cardsWrap}>
          {QUESTION_COUNT_OPTIONS.map((q) => (
            <SelectCard
              key={q.value}
              title={q.label}
              description={q.description}
              icon="list-outline"
              selected={questionCount === q.value}
              onPress={() => flow.setQuestionCount(q.value)}
            />
          ))}
        </View>

        {/* Time limit per question */}
        <SectionLabel>Time per question</SectionLabel>
        <View style={styles.chipRow}>
          {TIME_LIMIT_OPTIONS.map((t) => (
            <FilterChip
              key={t.value}
              label={t.label}
              icon={t.icon}
              selected={timeLimitPerQuestion === t.value}
              onPress={() => flow.setTimeLimitPerQuestion(t.value)}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={interviewType === 'mock' ? 'Continue to mock setup' : 'Start practice'}
          icon="play-outline"
          iconPosition="left"
          size="lg"
          fullWidth
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  cardsWrap: {
    gap: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
