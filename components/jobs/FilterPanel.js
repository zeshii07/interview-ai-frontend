import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet,
  Switch, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import {
  JOB_TYPES, DATE_POSTED_OPTIONS, EXPERIENCE_LEVELS, SALARY_PRESETS, COMMON_SKILLS,
} from '../../constants/config';

import FilterChip from '../../components/ui/FilterChip';
import Button from '../../components/ui/Button';

export default function FilterPanel({ visible, initial = {}, onClose, onApply }) {
  const [remoteOnly, setRemoteOnly] = useState(Boolean(initial.remoteOnly));
  const [datePosted, setDatePosted] = useState(initial.datePosted || null);
  const [jobType, setJobType] = useState(initial.jobType || null);
  const [salaryPreset, setSalaryPreset] = useState(
    SALARY_PRESETS.find((p) => p.label === initial.salaryPresetLabel) || SALARY_PRESETS[0]
  );
  const [salaryMin, setSalaryMin] = useState(initial.salaryMin ? String(initial.salaryMin) : '');
  const [salaryMax, setSalaryMax] = useState(initial.salaryMax ? String(initial.salaryMax) : '');
  const [selectedExperience, setSelectedExperience] = useState(
    Array.isArray(initial.experienceLevels) ? initial.experienceLevels : []
  );
  const [skills, setSkills] = useState(Array.isArray(initial.skills) ? initial.skills : []);
  const [skillInput, setSkillInput] = useState('');

  const toggleExperience = (level) => {
    setSelectedExperience((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const addSkill = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    if (skills.length >= 20) return;
    setSkills([...skills, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (s) => setSkills(skills.filter((x) => x !== s));

  const handleApply = () => {
    const minNum = salaryMin ? Number(salaryMin) : null;
    const maxNum = salaryMax ? Number(salaryMax) : null;
    onApply({
      remoteOnly, datePosted, jobType,
      salaryMin: Number.isFinite(minNum) && minNum > 0 ? minNum : null,
      salaryMax: Number.isFinite(maxNum) && maxNum > 0 ? maxNum : null,
      salaryPresetLabel: salaryPreset?.label || null,
      experienceLevels: selectedExperience,
      skills,
    });
  };

  const handleReset = () => {
    setRemoteOnly(false);
    setDatePosted(null);
    setJobType(null);
    setSalaryPreset(SALARY_PRESETS[0]);
    setSalaryMin('');
    setSalaryMax('');
    setSelectedExperience([]);
    setSkills([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleReset} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Ionicons name="wifi-outline" size={16} color={Colors.textPrimary} />
              <Text style={styles.rowText}>Remote only</Text>
            </View>
            <Switch
              value={remoteOnly}
              onValueChange={setRemoteOnly}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={styles.sectionTitle}>Date posted</Text>
          <View style={styles.chipRow}>
            {DATE_POSTED_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                selected={datePosted === opt.value}
                onPress={() => setDatePosted(datePosted === opt.value ? null : opt.value)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Job type</Text>
          <View style={styles.chipRow}>
            {JOB_TYPES.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                selected={jobType === opt.value}
                onPress={() => setJobType(jobType === opt.value ? null : opt.value)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Experience level</Text>
          <View style={styles.chipRow}>
            {EXPERIENCE_LEVELS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                selected={selectedExperience.includes(opt.value)}
                onPress={() => toggleExperience(opt.value)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Salary (quick pick)</Text>
          <View style={styles.chipRow}>
            {SALARY_PRESETS.map((opt) => (
              <FilterChip
                key={opt.label}
                label={opt.label}
                selected={salaryPreset?.label === opt.label}
                onPress={() => {
                  setSalaryPreset(opt);
                  if (opt.value) {
                    setSalaryMin(opt.value.min ? String(opt.value.min) : '');
                    setSalaryMax(opt.value.max ? String(opt.value.max) : '');
                  }
                }}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Salary range (custom)</Text>
          <View style={styles.salaryRow}>
            <TextInput
              style={styles.salaryInput}
              placeholder="Min (USD)"
              placeholderTextColor={Colors.textMuted}
              value={salaryMin}
              onChangeText={setSalaryMin}
              keyboardType="numeric"
            />
            <Text style={styles.dash}>–</Text>
            <TextInput
              style={styles.salaryInput}
              placeholder="Max (USD)"
              placeholderTextColor={Colors.textMuted}
              value={salaryMax}
              onChangeText={setSalaryMax}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.sectionTitle}>Skills match</Text>
          <Text style={styles.helperText}>
            Jobs whose description contains these skills will rank higher in results.
          </Text>

          <View style={styles.skillInputRow}>
            <TextInput
              style={styles.skillInput}
              placeholder="Add a skill (e.g. React)"
              placeholderTextColor={Colors.textMuted}
              value={skillInput}
              onChangeText={setSkillInput}
              onSubmitEditing={() => addSkill(skillInput)}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addSkillButton}
              onPress={() => addSkill(skillInput)}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {skills.length > 0 ? (
            <View style={styles.skillChipRow}>
              {skills.map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s}</Text>
                  <TouchableOpacity onPress={() => removeSkill(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={12} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          {skills.length < 20 ? (
            <View style={styles.suggestionWrap}>
              <Text style={styles.suggestionTitle}>Suggestions</Text>
              <View style={styles.chipRow}>
                {COMMON_SKILLS.filter(
                  (s) => !skills.some((x) => x.toLowerCase() === s.toLowerCase())
                )
                  .slice(0, 10)
                  .map((s) => (
                    <FilterChip
                      key={s}
                      label={s}
                      selected={false}
                      onPress={() => addSkill(s)}
                    />
                  ))}
              </View>
            </View>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Cancel"
            variant="ghost"
            size="md"
            fullWidth
            onPress={onClose}
            style={styles.footerButton}
          />
          <Button
            label="Apply filters"
            variant="primary"
            size="md"
            icon="checkmark-outline"
            iconPosition="left"
            fullWidth
            onPress={handleApply}
            style={[styles.footerButton, { flex: 1.5 }]}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resetText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    letterSpacing: 0.2,
  },
  helperText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  salaryInput: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  dash: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  skillInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  skillInput: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  addSkillButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },
  skillChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  skillChipText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  suggestionWrap: {
    marginTop: Spacing.md,
  },
  suggestionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  footerButton: {},
});
