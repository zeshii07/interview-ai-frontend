import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import { INTERVIEW_TYPES } from '../../constants/config';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import GradientHero from '../../components/ui/GradientHero';
import SelectCard from '../../components/ui/SelectCard';
import Button from '../../components/ui/Button';

export default function InterviewTypeScreen() {
  const interviewType = useInterviewFlowStore((s) => s.interviewType);
  const setInterviewType = useInterviewFlowStore((s) => s.setInterviewType);

  const handleContinue = () => {
    if (!interviewType) return;
    // 'general' and 'behavioral' types don't need role selection — skip to preferences
    if (interviewType === 'general' || interviewType === 'behavioral') {
      router.push('/interview/preferences');
    } else {
      router.push('/interview/role');
    }
  };

  return (
    <View style={styles.screen}>
      <GradientHero
        title="Start an interview"
        subtitle="Pick a type — you can adjust preferences next"
        icon="close-outline"
        onIconPress={() => router.replace('/(tabs)/')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Interview type</Text>
        <View style={styles.cardsWrap}>
          {INTERVIEW_TYPES.map((type) => (
            <SelectCard
              key={type.value}
              title={type.label}
              description={type.description}
              icon={type.icon}
              selected={interviewType === type.value}
              onPress={() => setInterviewType(type.value)}
            />
          ))}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue"
          icon="arrow-forward"
          iconPosition="right"
          size="lg"
          fullWidth
          disabled={!interviewType}
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
    marginBottom: Spacing.sm,
  },
  cardsWrap: {
    gap: Spacing.sm,
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
