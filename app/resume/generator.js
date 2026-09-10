import React from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
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
import * as ImagePicker from 'expo-image-picker';

import { resumeAPI } from '../../services/api';
import useResumeBuilderStore from '../../store/resumeBuilderStore';
import { Colors, Gradients, Radius, Shadows, Spacing } from '../../constants/theme';
import { saveLastWorkingRoute } from '../../utils/storage';

const RESUME_TEMPLATES = [
  { id: 'ats-classic', name: 'ATS Classic', description: 'Clean, balanced and suitable for most applications.', icon: 'document-text-outline', accent: '#3567F0', badge: 'Recommended' },
  { id: 'corporate-professional', name: 'Corporate', description: 'Traditional navy styling for business and large companies.', icon: 'business-outline', accent: '#17365D' },
  { id: 'european-standard', name: 'European', description: 'A4 chronological layout inspired by European CV conventions.', icon: 'globe-outline', accent: '#005B96' },
  { id: 'technical-compact', name: 'Technical', description: 'Compact skills-first styling for software and engineering roles.', icon: 'code-slash-outline', accent: '#0F766E' },
  { id: 'eu-academic', name: 'EU Academic', description: 'Europass-style for university admissions in Germany, France, Netherlands. Includes nationality, DOB, languages with CEFR, references.', icon: 'school-outline', accent: '#1A2A4F', badge: 'For students' },
  { id: 'academic-photo', name: 'Academic Photo', description: 'DAAD-style CV with portrait photo top-right. Europass section order. Required by German/French universities for visa and admission.', icon: 'person-circle-outline', accent: '#1A2A4F', badge: 'With photo' },
];

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
    templateId: RESUME_TEMPLATES.some((item) => item.id === draft.templateId)
      ? draft.templateId
      : 'ats-classic',
    firstName: cleanText(draft.firstName),
    lastName: cleanText(draft.lastName),
    email: cleanText(draft.email),
    phone: cleanText(draft.phone),
    location: cleanText(draft.location),
    linkedin: cleanText(draft.linkedin),
    github: cleanText(draft.github),
    portfolio: cleanText(draft.portfolio),
    targetRole: cleanText(draft.targetRole),
    jobDescription: cleanText(draft.jobDescription),
    summary: cleanText(draft.summary),
    // Academic-template extras (passed through to PDF renderer as-is)
    nationality: cleanText(draft.nationality),
    dateOfBirth: cleanText(draft.dateOfBirth),
    placeOfBirth: cleanText(draft.placeOfBirth),
    languagesText: cleanText(draft.languagesText),
    referencesText: cleanText(draft.referencesText),
    // Photo (academic-photo template only)
    photoBase64: draft.photoBase64 || '',
    photoMimeType: draft.photoMimeType || '',
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
        startDate: cleanText(item.startDate),
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
    customSections: draft.customSections
      .map((item) => ({
        title: cleanText(item.title),
        content: cleanText(item.content),
      }))
      .filter((item) => item.title && item.content),
  };
}

export default function ResumeGeneratorScreen() {
  const draft = useResumeBuilderStore((state) => state.draft);
  const builderHydrated = useResumeBuilderStore((state) => state.builderHydrated);
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
  const [pickingPhoto, setPickingPhoto] = React.useState(false);

  const pickPhoto = async () => {
    if (pickingPhoto) return;
    try {
      setPickingPhoto(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to upload a portrait photo.'
        );
        return;
      }
      // Use the new MediaType API (array of strings) and request base64 directly
      // from the picker — avoids the deprecated readAsStringAsync call.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5], // portrait, DAAD convention
        quality: 0.85,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Could not load photo', 'The image could not be read. Please try a different photo.');
        return;
      }
      const mimeType = asset.mimeType || 'image/jpeg';
      updateDraft('photoBase64', asset.base64);
      updateDraft('photoMimeType', mimeType);
    } catch (error) {
      Alert.alert('Could not load photo', error?.message || 'Please try again.');
    } finally {
      setPickingPhoto(false);
    }
  };

  const removePhoto = () => {
    updateDraft('photoBase64', '');
    updateDraft('photoMimeType', '');
  };

  React.useEffect(() => {
    saveLastWorkingRoute('/resume/generator');
    return () => {
      saveLastWorkingRoute(null);
    };
  }, []);

  if (!builderHydrated) {
    return (
      <View style={styles.restoreScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.restoreText}>Restoring your saved draft…</Text>
      </View>
    );
  }

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
      let optimizedResume;
      let suggestions = [];
      let mode = 'ai';
      let note = '';

      try {
        const result = await resumeAPI.generate(payload);
        optimizedResume = result?.resume || result?.data?.resume;

        if (!optimizedResume) {
          throw new Error('The server did not return an optimized resume.');
        }

        suggestions = Array.isArray(result?.suggestions)
          ? result.suggestions
          : [];
      } catch (aiError) {
        // Backend / AI optimization failed — fall back to using the user's
        // raw input as the resume content. The user can still preview and
        // download a PDF of their data without AI enhancement.
        console.warn(
          '[resume/generator] AI optimization failed, falling back to local mode:',
          aiError?.message || aiError
        );

        optimizedResume = payload;
        mode = 'local';
        note =
          aiError?.message ||
          'AI optimization is unavailable right now. Your resume will be generated from the details you entered.';

        Alert.alert(
          'AI enhancement unavailable',
          'We could not reach the AI service to polish your resume. Your data has been preserved and you can still preview and download a PDF. Tap "Download PDF" on the next screen to save it.',
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
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/(tabs)/')
              }
              style={styles.iconButton}
            >
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
              title="Choose a template"
              subtitle="Select the resume design before entering your details. All options use ATS-readable text and structure."
            />
            <View style={styles.templateGrid}>
              {RESUME_TEMPLATES.map((template) => {
                const selected = draft.templateId === template.id;
                return (
                  <Pressable
                    key={template.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => updateDraft('templateId', template.id)}
                    style={({ pressed }) => [styles.templateCard, selected && styles.templateCardSelected, pressed && styles.buttonPressed]}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: `${template.accent}14` }]}>
                      <Ionicons name={template.icon} size={22} color={template.accent} />
                    </View>
                    <View style={styles.templateTitleRow}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={20} color={template.accent} /> : null}
                    </View>
                    {template.badge ? <Text style={styles.templateBadge}>{template.badge}</Text> : null}
                    <Text style={styles.templateDescription}>{template.description}</Text>
                  </Pressable>
                );
              })}
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
              label="GITHUB (OPTIONAL)"
              value={draft.github}
              onChangeText={(value) => updateDraft('github', value)}
              placeholder="github.com/your-name"
              autoCapitalize="none"
            />
            <Field
              label="PORTFOLIO (OPTIONAL)"
              value={draft.portfolio}
              onChangeText={(value) => updateDraft('portfolio', value)}
              placeholder="yourportfolio.com"
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

          {(draft.templateId === 'eu-academic' || draft.templateId === 'academic-photo') ? (
            <View style={styles.section}>
              <SectionHeader
                title="Academic admission details"
                subtitle="Used by the EU Academic and Academic Photo templates. Required by universities in Germany, France, and the Netherlands for international admission applications."
              />
              {draft.templateId === 'academic-photo' ? (
                <View style={styles.photoPickerContainer}>
                  <Text style={styles.label}>PORTRAIT PHOTO (4:5, DAAD STYLE)</Text>
                  <View style={styles.photoPickerRow}>
                    {draft.photoBase64 ? (
                      <Image
                        source={{
                          uri: `data:${draft.photoMimeType || 'image/jpeg'};base64,${draft.photoBase64}`,
                        }}
                        style={styles.photoPreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.photoPreview, styles.photoPreviewEmpty]}>
                        <Ionicons name="person-outline" size={36} color={Colors.muted || '#9996AA'} />
                        <Text style={styles.photoPreviewEmptyText}>No photo</Text>
                      </View>
                    )}
                    <View style={styles.photoPickerActions}>
                      <Pressable
                        onPress={pickPhoto}
                        disabled={pickingPhoto}
                        style={({ pressed }) => [
                          styles.photoPickerButton,
                          (pressed || pickingPhoto) && styles.buttonPressed,
                        ]}
                      >
                        <Ionicons
                          name={pickingPhoto ? 'hourglass-outline' : 'cloud-upload-outline'}
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.photoPickerButtonText}>
                          {pickingPhoto ? 'Loading…' : draft.photoBase64 ? 'Replace photo' : 'Upload photo'}
                        </Text>
                      </Pressable>
                      {draft.photoBase64 ? (
                        <Pressable
                          onPress={removePhoto}
                          style={({ pressed }) => [
                            styles.photoRemoveButton,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Ionicons name="trash-outline" size={16} color={Colors.error} />
                          <Text style={styles.photoRemoveButtonText}>Remove</Text>
                        </Pressable>
                      ) : null}
                      <Text style={styles.photoHint}>
                        If no photo is uploaded, an initials avatar will be used on the CV.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
              <View style={styles.aiHint}>
                <Ionicons name="school-outline" size={15} color={Colors.primary} />
                <Text style={styles.aiHintText}>
                  These fields appear on the PDF only when EU Academic or Academic Photo is selected.
                  Nationality, date of birth, and place of birth are expected by
                  EU universities. Use CEFR levels (A1–C2) for languages.
                </Text>
              </View>
              <Field
                label="NATIONALITY"
                value={draft.nationality}
                onChangeText={(value) => updateDraft('nationality', value)}
                placeholder="Pakistani"
                autoCapitalize="words"
              />
              <View style={styles.twoColumns}>
                <View style={styles.column}>
                  <Field
                    label="DATE OF BIRTH"
                    value={draft.dateOfBirth}
                    onChangeText={(value) => updateDraft('dateOfBirth', value)}
                    placeholder="15 March 2001"
                  />
                </View>
                <View style={styles.column}>
                  <Field
                    label="PLACE OF BIRTH"
                    value={draft.placeOfBirth}
                    onChangeText={(value) => updateDraft('placeOfBirth', value)}
                    placeholder="Lahore, Pakistan"
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <Field
                label="LANGUAGES (ONE PER LINE, WITH CEFR LEVEL)"
                value={draft.languagesText}
                onChangeText={(value) => updateDraft('languagesText', value)}
                placeholder={'English — C1 (IELTS 7.5)\nGerman — B1 (Goethe-Zertifikat)\nUrdu — Native'}
                multiline
              />
              <Field
                label="REFERENCES"
                value={draft.referencesText}
                onChangeText={(value) => updateDraft('referencesText', value)}
                placeholder={'Available on request.\n\n—or—\n\nDr. Ahmad Hassan\nProfessor, FAST University\nahmad@uni.edu'}
                multiline
              />
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader
              title="Work experience"
              subtitle="Use real responsibilities and achievements."
              onAdd={() => addSectionItem('experience')}
              addLabel="Experience"
            />
            <View style={styles.aiHint}>
              <Ionicons name="sparkles" size={15} color={Colors.primary} />
              <Text style={styles.aiHintText}>
                Enter rough but truthful facts. AI will turn short phrases into professional ATS-ready bullets without inventing achievements.
              </Text>
            </View>
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
                      label="START YEAR"
                      value={item.startDate}
                      onChangeText={(value) =>
                        updateArrayItem('education', index, 'startDate', value)
                      }
                      placeholder="2020"
                    />
                  </View>
                  <View style={styles.column}>
                    <Field
                      label="END YEAR"
                      value={item.year}
                      onChangeText={(value) =>
                        updateArrayItem('education', index, 'year', value)
                      }
                      placeholder="2024"
                    />
                  </View>
                </View>
                <Field
                  label="GPA / GRADE (OPTIONAL)"
                  value={item.gpa}
                  onChangeText={(value) =>
                    updateArrayItem('education', index, 'gpa', value)
                  }
                  placeholder="3.4/4.0"
                />
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
            <View style={styles.aiHint}>
              <Ionicons name="construct-outline" size={15} color={Colors.primary} />
              <Text style={styles.aiHintText}>
                Mention what you built, your contribution, and technologies used. AI will polish the wording.
              </Text>
            </View>
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

          <View style={styles.section}>
            <SectionHeader
              title="Additional sections"
              subtitle="Optional sections such as Awards, Languages, Volunteering, Publications, or Interests."
              onAdd={() => addSectionItem('customSections')}
              addLabel="Section"
            />
            {draft.customSections.map((item, index) => (
              <ItemCard
                key={`custom-section-${index}`}
                title={`Additional section ${index + 1}`}
                canRemove
                onRemove={() => removeSectionItem('customSections', index)}
              >
                <Field
                  label="SECTION TITLE"
                  value={item.title}
                  onChangeText={(value) =>
                    updateArrayItem('customSections', index, 'title', value)
                  }
                  placeholder="Awards and Achievements"
                  autoCapitalize="words"
                />
                <Field
                  label="DETAILS"
                  value={item.content}
                  onChangeText={(value) =>
                    updateArrayItem('customSections', index, 'content', value)
                  }
                  placeholder="Add truthful details. Use a new line for each item."
                  multiline
                />
              </ItemCard>
            ))}
            {!draft.customSections.length ? (
              <Text style={styles.emptyText}>No additional sections added.</Text>
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
              {submitting ? 'Optimizing your resume...' : 'Generate Resume'}
            </Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            Review the AI output carefully before downloading. If the AI
            service is unreachable, your resume is still generated from the
            details you entered. Hirely improves wording but should not be
            used to add false experience or credentials.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, ...Gradients.screen },
  restoreScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, ...Gradients.screen },
  restoreText: { color: Colors.textSecondary, fontSize: 13 },
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
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  templateCard: { width: '48%', minHeight: 166, gap: 7, padding: 13, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated },
  templateCardSelected: { borderWidth: 2, borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  templateIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  templateTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  templateName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '900' },
  templateBadge: { color: Colors.primaryDark, fontSize: 9, fontWeight: '900' },
  templateDescription: { color: Colors.textMuted, fontSize: 11, lineHeight: 16 },
  aiHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 11,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
  },
  aiHintText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
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
  // Photo picker (academic-photo template only)
  photoPickerContainer: {
    gap: 10,
    marginBottom: 6,
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  photoPreview: {
    width: 95,
    height: 119,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  photoPreviewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoPreviewEmptyText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  photoPickerActions: {
    flex: 1,
    gap: 8,
  },
  photoPickerButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadows.primary,
  },
  photoPickerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  photoRemoveButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: 'rgba(200, 74, 89, 0.06)',
  },
  photoRemoveButtonText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '800',
  },
  photoHint: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
