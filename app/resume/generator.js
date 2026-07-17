import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { resumeAPI } from '../../services/api';
import useResumeBuilderStore from '../../store/resumeBuilderStore';
import { Colors, Gradients, Radius, Shadows, Spacing } from '../../constants/theme';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9996AA"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.multilineInput]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function SectionHeader({ title, subtitle, onAdd, addLabel = 'Add' }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeadingCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {onAdd ? (
        <Pressable onPress={onAdd} style={styles.addButton}>
          <Ionicons name="add" size={18} color={Colors.primaryDark} />
          <Text style={styles.addButtonText}>{addLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ItemCard({ title, canRemove, onRemove, children }) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemCardHeader}>
        <Text style={styles.itemCardTitle}>{title}</Text>
        {canRemove ? (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${title}`}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={19} color={Colors.error} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildPayload(draft) {
  return {
    ...draft,
    firstName: cleanText(draft.firstName),
    lastName: cleanText(draft.lastName),
    email: cleanText(draft.email),
    phone: cleanText(draft.phone),
    location: cleanText(draft.location),
    linkedin: cleanText(draft.linkedin),
    portfolio: cleanText(draft.portfolio),
    targetRole: cleanText(draft.targetRole),
    jobDescription: cleanText(draft.jobDescription),
    summary: cleanText(draft.summary),
    skills: draft.skillsText
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
    experience: draft.experience
      .map((item) => ({
        ...item,
        role: cleanText(item.role),
        company: cleanText(item.company),
        location: cleanText(item.location),
        duration: cleanText(item.duration),
        points: item.points.map(cleanText).filter(Boolean),
      }))
      .filter((item) => item.role || item.company || item.points.length),
    education: draft.education
      .map((item) => ({
        ...item,
        degree: cleanText(item.degree),
        institution: cleanText(item.institution),
        location: cleanText(item.location),
        year: cleanText(item.year),
        gpa: cleanText(item.gpa),
      }))
      .filter((item) => item.degree || item.institution),
    projects: draft.projects
      .map((item) => ({
        name: cleanText(item.name),
        technologies: cleanText(item.technologies),
        description: cleanText(item.description),
      }))
      .filter((item) => item.name || item.description),
    certifications: draft.certifications
      .map((item) => ({
        name: cleanText(item.name),
        issuer: cleanText(item.issuer),
        year: cleanText(item.year),
      }))
      .filter((item) => item.name),
  };
}

export default function ResumeGeneratorScreen() {
  const draft = useResumeBuilderStore((state) => state.draft);
  const updateDraft = useResumeBuilderStore((state) => state.updateDraft);
  const updateArrayItem = useResumeBuilderStore((state) => state.updateArrayItem);
  const updateExperiencePoint = useResumeBuilderStore(
    (state) => state.updateExperiencePoint
  );
  const addExperiencePoint = useResumeBuilderStore(
    (state) => state.addExperiencePoint
  );
  const removeExperiencePoint = useResumeBuilderStore(
    (state) => state.removeExperiencePoint
  );
  const addSectionItem = useResumeBuilderStore((state) => state.addSectionItem);
  const removeSectionItem = useResumeBuilderStore(
    (state) => state.removeSectionItem
  );
  const setOptimizedResult = useResumeBuilderStore(
    (state) => state.setOptimizedResult
  );

  const [submitting, setSubmitting] = React.useState(false);

  const generateResume = async () => {
    const payload = buildPayload(draft);

    if (!payload.firstName || !payload.lastName) {
      Alert.alert('Name required', 'Enter your first and last name.');
      return;
    }

    if (!payload.email) {
      Alert.alert('Email required', 'Enter the email to display on your resume.');
      return;
    }

    if (!payload.targetRole) {
      Alert.alert('Target role required', 'Enter the job role you are targeting.');
      return;
    }

    if (!payload.experience.length && !payload.education.length) {
      Alert.alert(
        'More information needed',
        'Add at least one education or work experience entry.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const result = await resumeAPI.generate(payload);
      const optimizedResume = result?.resume || result?.data?.resume;

      if (!optimizedResume) {
        throw new Error('The server did not return an optimized resume.');
      }

      setOptimizedResult(optimizedResume, result?.suggestions);
      router.push('/resume/preview');
    } catch (error) {
      Alert.alert('Could not generate resume', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.screenTitle}>ATS Resume Generator</Text>
            <View style={styles.iconButton} />
          </View>

          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="document-text" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Build a stronger resume</Text>
              <Text style={styles.heroText}>
                Add truthful details about your background. Hirely AI will improve
                the wording without inventing qualifications.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Personal information"
              subtitle="Details shown at the top of your resume."
            />
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Field
                  label="FIRST NAME"
                  value={draft.firstName}
                  onChangeText={(value) => updateDraft('firstName', value)}
                  placeholder="Ali"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="LAST NAME"
                  value={draft.lastName}
                  onChangeText={(value) => updateDraft('lastName', value)}
                  placeholder="Khan"
                  autoCapitalize="words"
                />
              </View>
            </View>
            <Field
              label="EMAIL"
              value={draft.email}
              onChangeText={(value) => updateDraft('email', value)}
              placeholder="ali@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="PHONE"
              value={draft.phone}
              onChangeText={(value) => updateDraft('phone', value)}
              placeholder="+92 300 0000000"
              keyboardType="phone-pad"
            />
            <Field
              label="LOCATION"
              value={draft.location}
              onChangeText={(value) => updateDraft('location', value)}
              placeholder="Lahore, Pakistan"
              autoCapitalize="words"
            />
            <Field
              label="LINKEDIN"
              value={draft.linkedin}
              onChangeText={(value) => updateDraft('linkedin', value)}
              placeholder="linkedin.com/in/your-name"
              autoCapitalize="none"
            />
            <Field
              label="PORTFOLIO OR GITHUB"
              value={draft.portfolio}
              onChangeText={(value) => updateDraft('portfolio', value)}
              placeholder="github.com/your-name"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Career target"
              subtitle="A job description helps the AI use relevant ATS keywords."
            />
            <Field
              label="TARGET ROLE"
              value={draft.targetRole}
              onChangeText={(value) => updateDraft('targetRole', value)}
              placeholder="React Native Developer"
              autoCapitalize="words"
            />
            <Field
              label="JOB DESCRIPTION (OPTIONAL)"
              value={draft.jobDescription}
              onChangeText={(value) => updateDraft('jobDescription', value)}
              placeholder="Paste the role requirements here..."
              multiline
            />
            <Field
              label="CURRENT SUMMARY (OPTIONAL)"
              value={draft.summary}
              onChangeText={(value) => updateDraft('summary', value)}
              placeholder="Briefly describe your background and goals."
              multiline
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Work experience"
              subtitle="Use real responsibilities and achievements."
              onAdd={() => addSectionItem('experience')}
              addLabel="Experience"
            />
            {draft.experience.map((item, index) => (
              <ItemCard
                key={`experience-${index}`}
                title={`Experience ${index + 1}`}
                canRemove={draft.experience.length > 1}
                onRemove={() => removeSectionItem('experience', index)}
              >
                <Field
                  label="ROLE"
                  value={item.role}
                  onChangeText={(value) =>
                    updateArrayItem('experience', index, 'role', value)
                  }
                  placeholder="Mobile App Developer"
                />
                <Field
                  label="COMPANY"
                  value={item.company}
                  onChangeText={(value) =>
                    updateArrayItem('experience', index, 'company', value)
                  }
                  placeholder="Company name"
                />
                <Field
                  label="LOCATION"
                  value={item.location}
                  onChangeText={(value) =>
                    updateArrayItem('experience', index, 'location', value)
                  }
                  placeholder="Remote or city"
                />
                <Field
                  label="DURATION"
                  value={item.duration}
                  onChangeText={(value) =>
                    updateArrayItem('experience', index, 'duration', value)
                  }
                  placeholder="Jan 2025 – Present"
                />

                <Text style={styles.label}>RESPONSIBILITIES OR ACHIEVEMENTS</Text>
                {item.points.map((point, pointIndex) => (
                  <View
                    key={`experience-${index}-point-${pointIndex}`}
                    style={styles.pointRow}
                  >
                    <TextInput
                      value={point}
                      onChangeText={(value) =>
                        updateExperiencePoint(index, pointIndex, value)
                      }
                      placeholder="Built and maintained..."
                      placeholderTextColor="#9996AA"
                      multiline
                      textAlignVertical="top"
                      style={[styles.input, styles.pointInput]}
                    />
                    <Pressable
                      onPress={() =>
                        removeExperiencePoint(index, pointIndex)
                      }
                      style={styles.smallIconButton}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={Colors.textMuted}
                      />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={() => addExperiencePoint(index)}
                  style={styles.inlineAdd}
                >
                  <Ionicons name="add-circle-outline" size={19} color={Colors.primary} />
                  <Text style={styles.inlineAddText}>Add bullet point</Text>
                </Pressable>
              </ItemCard>
            ))}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Education"
              onAdd={() => addSectionItem('education')}
              addLabel="Education"
            />
            {draft.education.map((item, index) => (
              <ItemCard
                key={`education-${index}`}
                title={`Education ${index + 1}`}
                canRemove={draft.education.length > 1}
                onRemove={() => removeSectionItem('education', index)}
              >
                <Field
                  label="DEGREE OR QUALIFICATION"
                  value={item.degree}
                  onChangeText={(value) =>
                    updateArrayItem('education', index, 'degree', value)
                  }
                  placeholder="BS Computer Science"
                />
                <Field
                  label="INSTITUTION"
                  value={item.institution}
                  onChangeText={(value) =>
                    updateArrayItem('education', index, 'institution', value)
                  }
                  placeholder="University name"
                />
                <Field
                  label="LOCATION"
                  value={item.location}
                  onChangeText={(value) =>
                    updateArrayItem('education', index, 'location', value)
                  }
                  placeholder="City, Country"
                />
                <View style={styles.twoColumns}>
                  <View style={styles.column}>
                    <Field
                      label="YEAR"
                      value={item.year}
                      onChangeText={(value) =>
                        updateArrayItem('education', index, 'year', value)
                      }
                      placeholder="2026"
                    />
                  </View>
                  <View style={styles.column}>
                    <Field
                      label="GPA (OPTIONAL)"
                      value={item.gpa}
                      onChangeText={(value) =>
                        updateArrayItem('education', index, 'gpa', value)
                      }
                      placeholder="3.4/4.0"
                    />
                  </View>
                </View>
              </ItemCard>
            ))}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Skills"
              subtitle="Separate skills with commas."
            />
            <Field
              label="SKILLS"
              value={draft.skillsText}
              onChangeText={(value) => updateDraft('skillsText', value)}
              placeholder="React Native, JavaScript, Expo, Firebase"
              multiline
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Projects"
              subtitle="Useful for students and early-career candidates."
              onAdd={() => addSectionItem('projects')}
              addLabel="Project"
            />
            {draft.projects.map((item, index) => (
              <ItemCard
                key={`project-${index}`}
                title={`Project ${index + 1}`}
                canRemove
                onRemove={() => removeSectionItem('projects', index)}
              >
                <Field
                  label="PROJECT NAME"
                  value={item.name}
                  onChangeText={(value) =>
                    updateArrayItem('projects', index, 'name', value)
                  }
                  placeholder="Hirely"
                />
                <Field
                  label="TECHNOLOGIES"
                  value={item.technologies}
                  onChangeText={(value) =>
                    updateArrayItem('projects', index, 'technologies', value)
                  }
                  placeholder="React Native, Node.js, Firebase"
                />
                <Field
                  label="DESCRIPTION"
                  value={item.description}
                  onChangeText={(value) =>
                    updateArrayItem('projects', index, 'description', value)
                  }
                  placeholder="Explain what you built and contributed."
                  multiline
                />
              </ItemCard>
            ))}
            {!draft.projects.length ? (
              <Text style={styles.emptyText}>No projects added yet.</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Certifications"
              onAdd={() => addSectionItem('certifications')}
              addLabel="Certification"
            />
            {draft.certifications.map((item, index) => (
              <ItemCard
                key={`certification-${index}`}
                title={`Certification ${index + 1}`}
                canRemove
                onRemove={() => removeSectionItem('certifications', index)}
              >
                <Field
                  label="NAME"
                  value={item.name}
                  onChangeText={(value) =>
                    updateArrayItem('certifications', index, 'name', value)
                  }
                  placeholder="Certification name"
                />
                <Field
                  label="ISSUER"
                  value={item.issuer}
                  onChangeText={(value) =>
                    updateArrayItem('certifications', index, 'issuer', value)
                  }
                  placeholder="Issuing organization"
                />
                <Field
                  label="YEAR"
                  value={item.year}
                  onChangeText={(value) =>
                    updateArrayItem('certifications', index, 'year', value)
                  }
                  placeholder="2026"
                />
              </ItemCard>
            ))}
            {!draft.certifications.length ? (
              <Text style={styles.emptyText}>No certifications added yet.</Text>
            ) : null}
          </View>

          <Pressable
            disabled={submitting}
            onPress={generateResume}
            style={({ pressed }) => [
              styles.generateButton,
              (pressed || submitting) && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name={submitting ? 'hourglass-outline' : 'sparkles'}
              size={21}
              color="#FFFFFF"
            />
            <Text style={styles.generateButtonText}>
              {submitting ? 'Optimizing your resume...' : 'Generate ATS Resume'}
            </Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            Review the AI output carefully before downloading. Hirely improves
            wording but should not be used to add false experience or credentials.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, ...Gradients.screen },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  topBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  hero: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Gradients.hero,
    ...Shadows.medium,
  },
  heroIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  heroCopy: { flex: 1, gap: 5 },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  heroText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: 13,
    padding: 17,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...Shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeadingCopy: { flex: 1, gap: 3 },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  addButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
  },
  addButtonText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  field: { gap: 6 },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.75,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgPrimary,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: 13,
    paddingBottom: 13,
  },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  itemCard: {
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCardTitle: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
  removeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  pointInput: {
    flex: 1,
    minHeight: 78,
    paddingTop: 12,
    paddingBottom: 12,
  },
  smallIconButton: {
    width: 38,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAdd: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primaryLight,
  },
  inlineAddText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  generateButton: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    ...Shadows.primary,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  buttonPressed: { opacity: 0.72 },
  disclaimer: {
    paddingHorizontal: 8,
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});
