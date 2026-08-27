import React from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import useResumeBuilderStore from '../../store/resumeBuilderStore';
import { generateAndShareResumePdf, generateAndShareResumeDocx } from '../../services/resumeDownload';
import { Colors, Gradients, Radius, Shadows, Spacing } from '../../constants/theme';
import { saveLastWorkingRoute } from '../../utils/storage';

function PreviewSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function EditableText({ value, onChangeText, multiline = true }) {
  return (
    <TextInput
      value={value || ''}
      onChangeText={onChangeText}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[styles.editableText, multiline && styles.multiline]}
    />
  );
}

export default function ResumePreviewScreen() {
  const optimizedResume = useResumeBuilderStore(
    (state) => state.optimizedResume
  );
  const builderHydrated = useResumeBuilderStore((state) => state.builderHydrated);
  const suggestions = useResumeBuilderStore((state) => state.suggestions);
  const optimizationMode = useResumeBuilderStore(
    (state) => state.optimizationMode
  );
  const optimizationNote = useResumeBuilderStore(
    (state) => state.optimizationNote
  );
  const replaceOptimizedResume = useResumeBuilderStore(
    (state) => state.replaceOptimizedResume
  );

  const [downloading, setDownloading] = React.useState(false);
  const [downloadingFormat, setDownloadingFormat] = React.useState(null); // 'pdf' | 'docx' | null
  const [downloadSource, setDownloadSource] = React.useState(null);

  React.useEffect(() => {
    // Save the GENERATOR route (not /resume/preview) as the last working
    // route. That way, if the user restarts the app while on the preview
    // screen, they land back on the generator (with their draft intact)
    // instead of being stuck on preview with no parent screen to go back to.
    saveLastWorkingRoute('/resume/generator');
    return () => {
      saveLastWorkingRoute(null);
    };
  }, []);

  React.useEffect(() => {
    if (builderHydrated && !optimizedResume) {
      // Use replace (not push) so the back stack stays clean.
      router.replace('/resume/generator');
    }
  }, [builderHydrated, optimizedResume]);

  if (!builderHydrated || !optimizedResume) {
    return (
      <View style={styles.restoreScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.restoreText}>Restoring your resume…</Text>
      </View>
    );
  }

  const updateRoot = (field, value) => {
    replaceOptimizedResume({
      ...optimizedResume,
      [field]: value,
    });
  };

  const updateSectionItem = (section, index, field, value) => {
    replaceOptimizedResume({
      ...optimizedResume,
      [section]: (optimizedResume[section] || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    });
  };

  const updateExperiencePoint = (experienceIndex, pointIndex, value) => {
    replaceOptimizedResume({
      ...optimizedResume,
      experience: (optimizedResume.experience || []).map((item, itemIndex) =>
        itemIndex !== experienceIndex
          ? item
          : {
              ...item,
              points: (item.points || []).map((point, index) =>
                index === pointIndex ? value : point
              ),
            }
      ),
    });
  };

  const downloadResume = async (format) => {
    if (format !== 'pdf' && format !== 'docx') return;
    try {
      setDownloading(true);
      setDownloadingFormat(format);
      const result =
        format === 'pdf'
          ? await generateAndShareResumePdf(optimizedResume)
          : await generateAndShareResumeDocx(optimizedResume);
      setDownloadSource(result?.source || null);

      const label = format === 'pdf' ? 'PDF' : 'Word document';
      const offlineLabel =
        format === 'pdf'
          ? 'PDF saved (offline)'
          : 'Word document saved (offline)';

      if (!result.shared) {
        Alert.alert(
          `${label} created`,
          `The file was created at:\n${result.uri}` +
            (result?.fallbackReason
              ? `\n\nGenerated locally because the server was unavailable.`
              : '')
        );
      } else if (result?.source === 'local') {
        Alert.alert(
          offlineLabel,
          `Your ${label.toLowerCase()} was generated on this device because the server could not be reached. The layout is ATS-friendly but lacks AI enhancement.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Download failed', error.message);
    } finally {
      setDownloading(false);
      setDownloadingFormat(null);
    }
  };

  const downloadPdf = () => downloadResume('pdf');
  const downloadDocx = () => downloadResume('docx');

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/resume/generator')
            }
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.screenTitle}>Review Resume</Text>
          <View style={styles.iconButton} />
        </View>

        {optimizationMode === 'local' ? (
          <View style={styles.offlineNotice}>
            <Ionicons
              name="cloud-offline-outline"
              size={24}
              color={Colors.warning || '#B86D12'}
            />
            <View style={styles.noticeCopy}>
              <Text style={styles.offlineNoticeTitle}>
                Offline mode — your data, no AI
              </Text>
              <Text style={styles.noticeText}>
                {optimizationNote
                  ? `${optimizationNote} You can still edit the wording below and download a PDF.`
                  : 'The AI service is unavailable. Your data has been preserved and you can still download a PDF.'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.notice}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.success}
            />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>AI optimization complete</Text>
              <Text style={styles.noticeText}>
                Edit any wording that is inaccurate, then create your ATS-friendly PDF.
              </Text>
            </View>
          </View>
        )}

        {suggestions.length ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Suggestions</Text>
            {suggestions.map((suggestion, index) => (
              <View key={`${suggestion}-${index}`} style={styles.suggestionRow}>
                <Ionicons
                  name="sparkles"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {(optimizedResume.templateId === 'eu-academic' || optimizedResume.templateId === 'academic-photo') &&
        (optimizedResume.nationality ||
          optimizedResume.dateOfBirth ||
          optimizedResume.placeOfBirth ||
          optimizedResume.languagesText ||
          optimizedResume.referencesText ||
          optimizedResume.photoBase64) ? (
          <View style={styles.academicCard}>
            <View style={styles.academicCardHeader}>
              <Ionicons name="school-outline" size={18} color={Colors.primary} />
              <Text style={styles.academicCardTitle}>Academic admission details</Text>
            </View>
            <Text style={styles.academicCardHelp}>
              These fields appear on your PDF only with the EU Academic or Academic Photo template.
              Edit them in the form if needed.
            </Text>
            {optimizedResume.templateId === 'academic-photo' && optimizedResume.photoBase64 ? (
              <View style={styles.photoPreviewRow}>
                <Image
                  source={{
                    uri: `data:${optimizedResume.photoMimeType || 'image/jpeg'};base64,${optimizedResume.photoBase64}`,
                  }}
                  style={styles.photoPreviewThumb}
                  resizeMode="cover"
                />
                <Text style={styles.academicLine}>
                  Photo will be placed top-right on the CV (DAAD style).
                </Text>
              </View>
            ) : null}
            {optimizedResume.nationality ? (
              <Text style={styles.academicLine}>
                <Text style={styles.academicLabel}>Nationality: </Text>
                {optimizedResume.nationality}
              </Text>
            ) : null}
            {optimizedResume.dateOfBirth ? (
              <Text style={styles.academicLine}>
                <Text style={styles.academicLabel}>Date of birth: </Text>
                {optimizedResume.dateOfBirth}
              </Text>
            ) : null}
            {optimizedResume.placeOfBirth ? (
              <Text style={styles.academicLine}>
                <Text style={styles.academicLabel}>Place of birth: </Text>
                {optimizedResume.placeOfBirth}
              </Text>
            ) : null}
            {optimizedResume.languagesText ? (
              <Text style={styles.academicLine}>
                <Text style={styles.academicLabel}>Languages:</Text>
                {'\n'}
                {optimizedResume.languagesText}
              </Text>
            ) : null}
            {optimizedResume.referencesText ? (
              <Text style={styles.academicLine}>
                <Text style={styles.academicLabel}>References:</Text>
                {'\n'}
                {optimizedResume.referencesText}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.paper}>
          <Text style={styles.name}>
            {`${optimizedResume.firstName || ''} ${
              optimizedResume.lastName || ''
            }`.trim().toUpperCase()}
          </Text>

          <Text style={styles.contact}>
            {[
              optimizedResume.email,
              optimizedResume.phone,
              optimizedResume.location,
              optimizedResume.linkedin,
              optimizedResume.github,
              optimizedResume.portfolio,
            ]
              .filter(Boolean)
              .join(' | ')}
          </Text>

          <PreviewSection title="Professional Summary">
            <EditableText
              value={optimizedResume.summary}
              onChangeText={(value) => updateRoot('summary', value)}
            />
          </PreviewSection>

          {(optimizedResume.experience || []).length ? (
            <PreviewSection title="Professional Experience">
              {optimizedResume.experience.map((item, index) => (
                <View key={`experience-${index}`} style={styles.resumeItem}>
                  <EditableText
                    multiline={false}
                    value={[item.role, item.company].filter(Boolean).join(' | ')}
                    onChangeText={(value) => {
                      // Keep structured fields intact; heading is display-only.
                    }}
                  />
                  <View style={styles.headingEditorRow}>
                    <TextInput
                      value={item.role || ''}
                      onChangeText={(value) =>
                        updateSectionItem('experience', index, 'role', value)
                      }
                      placeholder="Role"
                      style={styles.smallEditor}
                    />
                    <TextInput
                      value={item.company || ''}
                      onChangeText={(value) =>
                        updateSectionItem('experience', index, 'company', value)
                      }
                      placeholder="Company"
                      style={styles.smallEditor}
                    />
                  </View>
                  <View style={styles.headingEditorRow}>
                    <TextInput
                      value={item.location || ''}
                      onChangeText={(value) =>
                        updateSectionItem('experience', index, 'location', value)
                      }
                      placeholder="Location"
                      style={styles.smallEditor}
                    />
                    <TextInput
                      value={item.duration || ''}
                      onChangeText={(value) =>
                        updateSectionItem('experience', index, 'duration', value)
                      }
                      placeholder="Duration"
                      style={styles.smallEditor}
                    />
                  </View>
                  {(item.points || []).map((point, pointIndex) => (
                    <View
                      key={`experience-${index}-point-${pointIndex}`}
                      style={styles.bulletRow}
                    >
                      <Text style={styles.bullet}>•</Text>
                      <EditableText
                        value={point}
                        onChangeText={(value) =>
                          updateExperiencePoint(index, pointIndex, value)
                        }
                      />
                    </View>
                  ))}
                </View>
              ))}
            </PreviewSection>
          ) : null}

          {(optimizedResume.education || []).length ? (
            <PreviewSection title="Education">
              {optimizedResume.education.map((item, index) => (
                <View key={`education-${index}`} style={styles.resumeItem}>
                  <TextInput
                    value={item.degree || ''}
                    onChangeText={(value) =>
                      updateSectionItem('education', index, 'degree', value)
                    }
                    style={styles.itemTitleEditor}
                  />
                  <TextInput
                    value={item.institution || ''}
                    onChangeText={(value) =>
                      updateSectionItem(
                        'education',
                        index,
                        'institution',
                        value
                      )
                    }
                    style={styles.smallEditorFull}
                  />
                  <View style={styles.headingEditorRow}>
                    <TextInput
                      value={item.location || ''}
                      onChangeText={(value) =>
                        updateSectionItem('education', index, 'location', value)
                      }
                      placeholder="Location"
                      style={styles.smallEditor}
                    />
                    <TextInput
                      value={item.year || ''}
                      onChangeText={(value) =>
                        updateSectionItem('education', index, 'year', value)
                      }
                      placeholder="Year"
                      style={styles.smallEditor}
                    />
                  </View>
                </View>
              ))}
            </PreviewSection>
          ) : null}

          {(optimizedResume.skills || []).length ? (
            <PreviewSection title="Skills">
              <EditableText
                value={optimizedResume.skills.join(', ')}
                onChangeText={(value) =>
                  updateRoot(
                    'skills',
                    value
                      .split(',')
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                  )
                }
              />
            </PreviewSection>
          ) : null}

          {(optimizedResume.projects || []).length ? (
            <PreviewSection title="Projects">
              {optimizedResume.projects.map((item, index) => (
                <View key={`project-${index}`} style={styles.resumeItem}>
                  <TextInput
                    value={item.name || ''}
                    onChangeText={(value) =>
                      updateSectionItem('projects', index, 'name', value)
                    }
                    style={styles.itemTitleEditor}
                  />
                  <EditableText
                    value={item.description || (item.points || []).join('\n')}
                    onChangeText={(value) =>
                      updateSectionItem('projects', index, 'description', value)
                    }
                  />
                </View>
              ))}
            </PreviewSection>
          ) : null}

          {(optimizedResume.certifications || []).length ? (
            <PreviewSection title="Certifications">
              {optimizedResume.certifications.map((item, index) => (
                <View key={`certification-${index}`} style={styles.resumeItem}>
                  <EditableText
                    value={
                      typeof item === 'string'
                        ? item
                        : [item.name, item.issuer, item.year]
                            .filter(Boolean)
                            .join(' | ')
                    }
                    onChangeText={(value) => {
                      if (typeof item === 'string') {
                        const next = [...optimizedResume.certifications];
                        next[index] = value;
                        updateRoot('certifications', next);
                      } else {
                        updateSectionItem(
                          'certifications',
                          index,
                          'name',
                          value
                        );
                      }
                    }}
                  />
                </View>
              ))}
            </PreviewSection>
          ) : null}

          {(optimizedResume.customSections || []).map((item, index) => (
            <PreviewSection
              key={`custom-section-${index}`}
              title={item.title || 'Additional Information'}
            >
              <TextInput
                value={item.title || ''}
                onChangeText={(value) =>
                  updateSectionItem('customSections', index, 'title', value)
                }
                placeholder="Section title"
                style={styles.itemTitleEditor}
              />
              <EditableText
                value={item.content}
                onChangeText={(value) =>
                  updateSectionItem('customSections', index, 'content', value)
                }
              />
            </PreviewSection>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/resume/generator')
            }
            style={styles.secondaryButton}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primaryDark} />
            <Text style={styles.secondaryButtonText}>Edit details</Text>
          </Pressable>

          <Pressable
            disabled={downloading}
            onPress={downloadPdf}
            style={[
              styles.primaryButton,
              downloading && styles.buttonDisabled,
            ]}
          >
            <Ionicons
              name={downloadingFormat === 'pdf' ? 'hourglass-outline' : 'document-outline'}
              size={21}
              color="#FFFFFF"
            />
            <Text style={styles.primaryButtonText}>
              {downloadingFormat === 'pdf'
                ? 'Creating PDF...'
                : optimizationMode === 'local'
                  ? 'PDF (offline)'
                  : 'PDF'}
            </Text>
          </Pressable>

          <Pressable
            disabled={downloading}
            onPress={downloadDocx}
            style={[
              styles.primaryButton,
              downloading && styles.buttonDisabled,
            ]}
          >
            <Ionicons
              name={downloadingFormat === 'docx' ? 'hourglass-outline' : 'document-text-outline'}
              size={21}
              color="#FFFFFF"
            />
            <Text style={styles.primaryButtonText}>
              {downloadingFormat === 'docx'
                ? 'Creating Word...'
                : optimizationMode === 'local'
                  ? 'Word (offline)'
                  : 'Word'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 15,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#B9E1D2',
    backgroundColor: '#EFFAF5',
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 15,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F1D9A8',
    backgroundColor: '#FFF6E5',
  },
  offlineNoticeTitle: {
    color: '#8C5400',
    fontSize: 15,
    fontWeight: '900',
  },
  noticeCopy: { flex: 1, gap: 3 },
  noticeTitle: {
    color: Colors.success,
    fontSize: 15,
    fontWeight: '900',
  },
  noticeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  suggestions: {
    gap: 9,
    padding: 15,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
  },
  suggestionsTitle: {
    color: Colors.primaryDark,
    fontSize: 15,
    fontWeight: '900',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  suggestionText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  academicCard: {
    gap: 7,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primaryBg,
  },
  academicCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  academicCardTitle: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
  academicCardHelp: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  academicLine: {
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 17,
  },
  academicLabel: {
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  photoPreviewRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  photoPreviewThumb: {
    width: 60,
    height: 75,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paper: {
    gap: 16,
    padding: 22,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    ...Shadows.medium,
  },
  name: {
    color: '#111111',
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  contact: {
    color: '#333333',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
  section: { gap: 9 },
  sectionTitle: {
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  resumeItem: { gap: 7, marginBottom: 6 },
  editableText: {
    flex: 1,
    minHeight: 42,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E4E2EA',
    borderRadius: 7,
    backgroundColor: '#FCFCFD',
    color: '#222222',
    fontSize: 11,
    lineHeight: 16,
  },
  multiline: { minHeight: 58 },
  headingEditorRow: { flexDirection: 'row', gap: 7 },
  smallEditor: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E4E2EA',
    borderRadius: 7,
    color: '#222222',
    fontSize: 11,
  },
  smallEditorFull: {
    minHeight: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E4E2EA',
    borderRadius: 7,
    color: '#222222',
    fontSize: 11,
  },
  itemTitleEditor: {
    minHeight: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E4E2EA',
    borderRadius: 7,
    color: '#111111',
    fontSize: 12,
    fontWeight: '800',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  bullet: {
    paddingTop: 8,
    color: '#222222',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
  },
  secondaryButtonText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButton: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadows.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonDisabled: { opacity: 0.65 },
});
