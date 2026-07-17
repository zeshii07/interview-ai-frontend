import React from 'react';
import {
  Alert,
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
import { generateAndShareResumePdf } from '../../services/resumeDownload';
import { Colors, Gradients, Radius, Shadows, Spacing } from '../../constants/theme';

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
  const suggestions = useResumeBuilderStore((state) => state.suggestions);
  const replaceOptimizedResume = useResumeBuilderStore(
    (state) => state.replaceOptimizedResume
  );

  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    if (!optimizedResume) {
      router.replace('/resume/generator');
    }
  }, [optimizedResume]);

  if (!optimizedResume) {
    return null;
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

  const downloadPdf = async () => {
    try {
      setDownloading(true);
      const result = await generateAndShareResumePdf(optimizedResume);

      if (!result.shared) {
        Alert.alert(
          'PDF created',
          `The file was created at:\n${result.uri}`
        );
      }
    } catch (error) {
      Alert.alert('Download failed', error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.screenTitle}>Review Resume</Text>
          <View style={styles.iconButton} />
        </View>

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
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.back()}
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
              name={downloading ? 'hourglass-outline' : 'download-outline'}
              size={21}
              color="#FFFFFF"
            />
            <Text style={styles.primaryButtonText}>
              {downloading ? 'Creating PDF...' : 'Download PDF'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
    fontSize: 14,
    fontWeight: '900',
  },
  primaryButton: {
    flex: 1.25,
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
    fontSize: 14,
    fontWeight: '900',
  },
  buttonDisabled: { opacity: 0.65 },
});
