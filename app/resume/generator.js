import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  TouchableOpacity, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useResumeBuilderStore from '../../store/resumeBuilderStore';
import { resumeAPI } from '../../services/api';

import WizardStepper from '../../components/resume/WizardStepper';
import TemplateCard from '../../components/resume/TemplateCard';
import FormField from '../../components/resume/FormField';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const RESUME_TEMPLATES = [
  { id: 'ats-classic', name: 'Professional', description: 'Clean, balanced — works for most applications.', icon: 'document-text-outline', accent: '#4F46E5', badge: 'Recommended' },
  { id: 'corporate-professional', name: 'Modern', description: 'Navy styling for business and large companies.', icon: 'business-outline', accent: '#245FC7', badge: 'Popular' },
  { id: 'technical-compact', name: 'Technical', description: 'Compact skills-first layout for software roles.', icon: 'code-slash-outline', accent: '#0F766E' },
  { id: 'european-standard', name: 'Minimal', description: 'Clean A4 chronological CV, no clutter.', icon: 'remove-circle-outline', accent: '#676579' },
  { id: 'eu-academic', name: 'Executive', description: 'Senior-level CV with leadership emphasis.', icon: 'ribbon-outline', accent: '#A85C08' },
  { id: 'academic-photo', name: 'Creative', description: 'Photo CV with portrait, for academic applications.', icon: 'person-circle-outline', accent: '#7C3AED', badge: 'With photo' },
];

const WIZARD_STEPS = [
  { key: 'template', label: 'Template', icon: 'document-text-outline' },
  { key: 'personal', label: 'Personal', icon: 'person-outline' },
  { key: 'experience', label: 'Work', icon: 'briefcase-outline' },
  { key: 'education', label: 'Education', icon: 'school-outline' },
  { key: 'review', label: 'Review', icon: 'checkmark-circle-outline' },
];

export default function ResumeGeneratorScreen() {
  const draft = useResumeBuilderStore((s) => s.draft);
  const updateDraft = useResumeBuilderStore((s) => s.updateDraft);
  const updateArrayItem = useResumeBuilderStore((s) => s.updateArrayItem);
  const addSectionItem = useResumeBuilderStore((s) => s.addSectionItem);
  const removeSectionItem = useResumeBuilderStore((s) => s.removeSectionItem);
  const updateExperiencePoint = useResumeBuilderStore((s) => s.updateExperiencePoint);
  const addExperiencePoint = useResumeBuilderStore((s) => s.addExperiencePoint);
  const removeExperiencePoint = useResumeBuilderStore((s) => s.removeExperiencePoint);
  const setOptimizedResult = useResumeBuilderStore((s) => s.setOptimizedResult);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (step === 0 && !draft.templateId) {
      Alert.alert('Pick a template', 'Choose a template to continue.');
      return;
    }
    if (step === 1 && (!draft.firstName || !draft.lastName || !draft.email)) {
      Alert.alert('Required fields', 'First name, last name, and email are required.');
      return;
    }
    if (step < WIZARD_STEPS.length - 1) {
      setStep(step + 1);
    }
  }, [step, draft]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else router.back();
  }, [step]);

  const handleJump = useCallback((idx) => {
    if (idx < step) setStep(idx);
  }, [step]);

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!draft.firstName || !draft.lastName) {
      Alert.alert('Name required', 'Enter your first and last name.');
      return;
    }
    if (!draft.email) {
      Alert.alert('Email required', 'Enter the email to display on your resume.');
      return;
    }
    if (!draft.targetRole) {
      Alert.alert('Target role required', 'Enter the job role you are targeting.');
      return;
    }
    if (!draft.experience.length && !draft.education.length) {
      Alert.alert('More information needed', 'Add at least one education or work experience entry.');
      return;
    }

    setSubmitting(true);
    try {
      let optimizedResume;
      let suggestions = [];
      let mode = 'ai';
      let note = '';

      try {
        const result = await resumeAPI.generate(draft);
        optimizedResume = result?.resume || result?.data?.resume;
        if (!optimizedResume) throw new Error('The server did not return an optimized resume.');
        suggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
      } catch (aiError) {
        console.warn('[resume] AI optimization failed, falling back to local:', aiError?.message);
        optimizedResume = { ...draft };
        mode = 'local';
        note = aiError?.message || 'AI optimization is unavailable. Your resume will be generated from your inputs.';
        Alert.alert(
          'AI enhancement unavailable',
          'Your data has been preserved and you can still preview and download a PDF.',
          [{ text: 'Continue' }]
        );
      }

      setOptimizedResult(optimizedResume, suggestions, mode, note);
      router.push('/resume/preview');
    } catch (error) {
      Alert.alert('Could not generate resume', error.message);
    } finally {
      setSubmitting(false);
    }
  }, [draft, setOptimizedResult]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name={step === 0 ? 'close-outline' : 'arrow-back-outline'} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resume Generator</Text>
        <View style={{ width: 24 }} />
      </View>

      <WizardStepper steps={WIZARD_STEPS} current={step} onJump={handleJump} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            <TemplateStep
              templates={RESUME_TEMPLATES}
              selected={draft.templateId}
              onSelect={(id) => updateDraft('templateId', id)}
            />
          ) : null}

          {step === 1 ? (
            <PersonalStep
              draft={draft}
              updateDraft={updateDraft}
            />
          ) : null}

          {step === 2 ? (
            <ExperienceStep
              experience={draft.experience || []}
              updateArrayItem={(idx, field, value) => updateArrayItem('experience', idx, field, value)}
              addItem={() => addSectionItem('experience')}
              removeItem={(idx) => removeSectionItem('experience', idx)}
              updatePoint={updateExperiencePoint}
              addPoint={addExperiencePoint}
              removePoint={removeExperiencePoint}
            />
          ) : null}

          {step === 3 ? (
            <EducationStep
              education={draft.education || []}
              updateArrayItem={(idx, field, value) => updateArrayItem('education', idx, field, value)}
              addItem={() => addSectionItem('education')}
              removeItem={(idx) => removeSectionItem('education', idx)}
              skillsText={draft.skillsText}
              updateSkills={(val) => updateDraft('skillsText', val)}
            />
          ) : null}

          {step === 4 ? (
            <ReviewStep
              draft={draft}
              templates={RESUME_TEMPLATES}
              onEdit={(idx) => setStep(idx)}
              onGenerate={handleGenerate}
              submitting={submitting}
            />
          ) : null}
        </ScrollView>

        {/* Footer with Back/Next */}
        {step < 4 ? (
          <View style={styles.footer}>
            <Button
              label="Back"
              variant="ghost"
              size="md"
              onPress={handleBack}
              style={{ flex: 1 }}
            />
            <Button
              label="Continue"
              icon="arrow-forward"
              iconPosition="right"
              variant="primary"
              size="md"
              onPress={handleNext}
              style={{ flex: 1.5 }}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Step 0: Template ───────────────────────────────────────────────────────
function TemplateStep({ templates, selected, onSelect }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pick a template</Text>
      <Text style={styles.stepSubtitle}>
        Choose from 6 ATS-friendly templates designed for different roles and regions.
      </Text>
      <View style={styles.templatesGrid}>
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={selected === t.id}
            onPress={() => onSelect(t.id)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Step 1: Personal Info ──────────────────────────────────────────────────
function PersonalStep({ draft, updateDraft }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal information</Text>
      <Text style={styles.stepSubtitle}>These appear at the top of your resume.</Text>

      <View style={styles.fieldRow}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <FormField
            label="First name"
            value={draft.firstName}
            onChangeText={(v) => updateDraft('firstName', v)}
            placeholder="Zeeshan"
            required
            autoCapitalize="words"
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            label="Last name"
            value={draft.lastName}
            onChangeText={(v) => updateDraft('lastName', v)}
            placeholder="Ali"
            required
            autoCapitalize="words"
          />
        </View>
      </View>

      <FormField
        label="Email"
        value={draft.email}
        onChangeText={(v) => updateDraft('email', v)}
        placeholder="zeeshan@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />
      <FormField
        label="Phone"
        value={draft.phone}
        onChangeText={(v) => updateDraft('phone', v)}
        placeholder="+1 555 000 0000"
        keyboardType="phone-pad"
      />
      <FormField
        label="Location"
        value={draft.location}
        onChangeText={(v) => updateDraft('location', v)}
        placeholder="Lahore, Pakistan"
      />
      <FormField
        label="Target role"
        value={draft.targetRole}
        onChangeText={(v) => updateDraft('targetRole', v)}
        placeholder="Senior Frontend Engineer"
        required
        helperText="The role you're targeting — used for tailoring."
      />
      <FormField
        label="LinkedIn"
        value={draft.linkedin}
        onChangeText={(v) => updateDraft('linkedin', v)}
        placeholder="linkedin.com/in/zeeshan"
        keyboardType="url"
        autoCapitalize="none"
      />
      <FormField
        label="GitHub"
        value={draft.github}
        onChangeText={(v) => updateDraft('github', v)}
        placeholder="github.com/zeeshan"
        keyboardType="url"
        autoCapitalize="none"
      />
      <FormField
        label="Professional summary"
        value={draft.summary}
        onChangeText={(v) => updateDraft('summary', v)}
        placeholder="3-5 sentence summary of your background and strengths."
        multiline
        helperText="Optional — leave blank and we'll generate one for you."
      />
    </View>
  );
}

// ─── Step 2: Work Experience ─────────────────────────────────────────────────
function ExperienceStep({
  experience, updateArrayItem, addItem, removeItem,
  updatePoint, addPoint, removePoint,
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Work experience</Text>
      <Text style={styles.stepSubtitle}>Most recent first. Add bullets for each role.</Text>

      {experience.map((item, idx) => (
        <View key={idx} style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>Role {idx + 1}</Text>
            {experience.length > 1 ? (
              <TouchableOpacity
                onPress={() => removeItem(idx)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </TouchableOpacity>
            ) : null}
          </View>

          <FormField
            label="Role"
            value={item.role}
            onChangeText={(v) => updateArrayItem(idx, 'role', v)}
            placeholder="Software Engineer"
          />
          <View style={styles.fieldRow}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <FormField
                label="Company"
                value={item.company}
                onChangeText={(v) => updateArrayItem(idx, 'company', v)}
                placeholder="Acme Corp"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="Location"
                value={item.location}
                onChangeText={(v) => updateArrayItem(idx, 'location', v)}
                placeholder="Remote"
              />
            </View>
          </View>
          <FormField
            label="Duration"
            value={item.duration}
            onChangeText={(v) => updateArrayItem(idx, 'duration', v)}
            placeholder="Jan 2022 — Present"
          />

          <Text style={styles.bulletsLabel}>Bullet points</Text>
          {item.points.map((point, pIdx) => (
            <View key={pIdx} style={styles.bulletRow}>
              <TextInput
                style={styles.bulletInput}
                value={point}
                onChangeText={(v) => updatePoint(idx, pIdx, v)}
                placeholder={`Achievement #${pIdx + 1}`}
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              {item.points.length > 1 ? (
                <TouchableOpacity
                  onPress={() => removePoint(idx, pIdx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.bulletRemove}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => addPoint(idx)}
            style={styles.addBulletButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={14} color={Colors.primary} />
            <Text style={styles.addBulletText}>Add bullet</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        onPress={addItem}
        style={styles.addEntryButton}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={Colors.primary} />
        <Text style={styles.addEntryText}>Add another role</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 3: Education + Skills ───────────────────────────────────────────────
function EducationStep({
  education, updateArrayItem, addItem, removeItem,
  skillsText, updateSkills,
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Education & skills</Text>
      <Text style={styles.stepSubtitle}>List your degrees and key skills.</Text>

      {education.map((item, idx) => (
        <View key={idx} style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>Education {idx + 1}</Text>
            {education.length > 1 ? (
              <TouchableOpacity
                onPress={() => removeItem(idx)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </TouchableOpacity>
            ) : null}
          </View>

          <FormField
            label="Degree"
            value={item.degree}
            onChangeText={(v) => updateArrayItem(idx, 'degree', v)}
            placeholder="B.S. Computer Science"
          />
          <FormField
            label="Institution"
            value={item.institution}
            onChangeText={(v) => updateArrayItem(idx, 'institution', v)}
            placeholder="University of Punjab"
          />
          <View style={styles.fieldRow}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <FormField
                label="Start year"
                value={item.startDate}
                onChangeText={(v) => updateArrayItem(idx, 'startDate', v)}
                placeholder="2018"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="End year"
                value={item.year}
                onChangeText={(v) => updateArrayItem(idx, 'year', v)}
                placeholder="2022"
                keyboardType="numeric"
              />
            </View>
          </View>
          <FormField
            label="GPA"
            value={item.gpa}
            onChangeText={(v) => updateArrayItem(idx, 'gpa', v)}
            placeholder="3.8 / 4.0"
            keyboardType="numeric"
          />
        </View>
      ))}

      <TouchableOpacity
        onPress={addItem}
        style={styles.addEntryButton}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={Colors.primary} />
        <Text style={styles.addEntryText}>Add another degree</Text>
      </TouchableOpacity>

      <View style={styles.entryCard}>
        <Text style={styles.entryTitle}>Skills</Text>
        <Text style={styles.entrySubtitle}>Comma-separated list</Text>
        <FormField
          value={skillsText}
          onChangeText={updateSkills}
          placeholder="JavaScript, React, Node.js, AWS, …"
          multiline
          helperText="Separate skills with commas. We'll group them on the resume."
        />
      </View>
    </View>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────
function ReviewStep({ draft, templates, onEdit, onGenerate, submitting }) {
  const selectedTemplate = templates.find((t) => t.id === draft.templateId);
  const experienceCount = (draft.experience || []).length;
  const educationCount = (draft.education || []).length;

  const reviewRows = [
    { label: 'Template', value: selectedTemplate?.name || 'Not selected', icon: 'document-text-outline', editStep: 0 },
    { label: 'Name', value: `${draft.firstName || ''} ${draft.lastName || ''}`.trim() || 'Not entered', icon: 'person-outline', editStep: 1 },
    { label: 'Email', value: draft.email || 'Not entered', icon: 'mail-outline', editStep: 1 },
    { label: 'Target role', value: draft.targetRole || 'Not entered', icon: 'briefcase-outline', editStep: 1 },
    { label: 'Work experience', value: `${experienceCount} role${experienceCount === 1 ? '' : 's'}`, icon: 'business-outline', editStep: 2 },
    { label: 'Education', value: `${educationCount} degree${educationCount === 1 ? '' : 's'}`, icon: 'school-outline', editStep: 3 },
    { label: 'Skills', value: draft.skillsText ? `${draft.skillsText.split(',').length} skills` : 'Not entered', icon: 'cube-outline', editStep: 3 },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & generate</Text>
      <Text style={styles.stepSubtitle}>Check everything looks good, then generate your resume.</Text>

      <View style={styles.reviewCard}>
        {reviewRows.map((row, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.reviewRow,
              idx < reviewRows.length - 1 && styles.reviewRowBorder,
            ]}
            onPress={() => onEdit(row.editStep)}
            activeOpacity={0.7}
          >
            <View style={styles.reviewIconWrap}>
              <Ionicons name={row.icon} size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewLabel}>{row.label}</Text>
              <Text style={styles.reviewValue} numberOfLines={1}>{row.value}</Text>
            </View>
            <Ionicons name="create-outline" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <Button
        label={submitting ? 'Generating…' : 'Generate resume'}
        icon={submitting ? undefined : 'sparkles-outline'}
        iconPosition="left"
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting}
        onPress={onGenerate}
        style={{ marginTop: Spacing.lg }}
      />

      {submitting ? (
        <View style={styles.submittingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.submittingText}>Tailoring your resume with AI…</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
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
    padding: Spacing.md,
    paddingBottom: 100,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 19,
  },
  templatesGrid: {
    gap: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
  },
  entryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  entryTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  entrySubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  bulletsLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  bulletInput: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  bulletRemove: {
    padding: 4,
  },
  addBulletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  addBulletText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryBg,
  },
  addEntryText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Review step
  reviewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  reviewRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  reviewIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  reviewValue: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  submittingText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
