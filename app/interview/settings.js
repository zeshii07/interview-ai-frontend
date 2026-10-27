import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import {
  DIFFICULTY_LEVELS,
  LANGUAGES,
  QUESTION_COUNT_OPTIONS,
  TIME_LIMIT_OPTIONS,
} from '../../constants/config';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import FilterChip from '../../components/ui/FilterChip';
import Button from '../../components/ui/Button';
import SectionHeader from '../../components/ui/SectionHeader';

const SETTINGS_KEY = 'hirely-interview-settings-v1';

const DEFAULT_SETTINGS = {
  defaultDifficulty: 'intermediate',
  defaultLanguage: 'English',
  defaultQuestionCount: 10,
  defaultTimeLimit: 90,
  notificationsEnabled: true,
  dailyReminderEnabled: false,
  dailyReminderTime: '09:00',
};

export default function InterviewSettingsScreen() {
  const flow = useInterviewFlowStore();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load saved settings on mount
  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (err) {
        console.warn('Failed to load interview settings:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist settings whenever they change
  React.useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (err) {
        console.warn('Failed to save interview settings:', err);
      }
    })();
  }, [settings, loaded]);

  // Sync to interviewFlowStore so the next interview uses these defaults
  React.useEffect(() => {
    if (!loaded) return;
    flow.setDifficulty(settings.defaultDifficulty);
    flow.setLanguage(settings.defaultLanguage);
    flow.setQuestionCount(settings.defaultQuestionCount);
    flow.setTimeLimitPerQuestion(settings.defaultTimeLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, loaded]);

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interview Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Defaults */}
        <SectionHeader title="Default preferences" icon="options-outline" />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Difficulty</Text>
          <View style={styles.chipRow}>
            {DIFFICULTY_LEVELS.map((d) => (
              <FilterChip
                key={d.value}
                label={d.label}
                selected={settings.defaultDifficulty === d.value}
                onPress={() => update('defaultDifficulty', d.value)}
              />
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardTitle}>Language</Text>
          <View style={styles.chipRow}>
            {LANGUAGES.map((l) => (
              <FilterChip
                key={l.value}
                label={l.label}
                selected={settings.defaultLanguage === l.value}
                onPress={() => update('defaultLanguage', l.value)}
              />
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardTitle}>Default question count</Text>
          <View style={styles.chipRow}>
            {QUESTION_COUNT_OPTIONS.map((q) => (
              <FilterChip
                key={q.value}
                label={`${q.value}`}
                selected={settings.defaultQuestionCount === q.value}
                onPress={() => update('defaultQuestionCount', q.value)}
              />
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardTitle}>Default time per question</Text>
          <View style={styles.chipRow}>
            {TIME_LIMIT_OPTIONS.map((t) => (
              <FilterChip
                key={t.value}
                label={t.label}
                selected={settings.defaultTimeLimit === t.value}
                onPress={() => update('defaultTimeLimit', t.value)}
              />
            ))}
          </View>
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" icon="notifications-outline" />

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Push notifications</Text>
              <Text style={styles.toggleDesc}>Get notified about new features and tips</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => update('notificationsEnabled', v)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Daily practice reminder</Text>
              <Text style={styles.toggleDesc}>A daily nudge to keep your skills sharp</Text>
            </View>
            <Switch
              value={settings.dailyReminderEnabled}
              onValueChange={(v) => update('dailyReminderEnabled', v)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Reset */}
        <SectionHeader title="Reset" icon="refresh-outline" />

        <Button
          label="Reset to defaults"
          icon="refresh-outline"
          iconPosition="left"
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => {
            Alert.alert(
              'Reset settings?',
              'This will restore all interview defaults.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => setSettings(DEFAULT_SETTINGS),
                },
              ]
            );
          }}
        />

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  cardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toggleTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
});
