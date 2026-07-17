import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'react-native';

import LoadingOverlay from '../../components/ui/LoadingOverlay';
import useInterviewStore from '../../store/interviewStore';
import { Colors, Gradients } from '../../constants/theme';

const p = { ink: Colors.textPrimary, muted: Colors.textMuted, purple: '#7047F5', dark: '#5330DB', lavender: Colors.primaryBg, line: Colors.border, bg: Colors.bgPrimary, card: Colors.bgCard, green: '#169B70', amber: '#B86D12', red: '#C84A59' };

function InsightCard({ icon, title, tone = 'purple', items = [] }) {
  const tones = { purple: [p.lavender, p.dark], green: ['#DDF5EA', p.green], amber: ['#FBEACD', p.amber] };
  const [backgroundColor, color] = tones[tone];
  if (!items.length) return null;
  return <View style={styles.card}><View style={styles.cardHead}><View style={[styles.cardIcon, { backgroundColor }]}><Ionicons name={icon} size={20} color={color} /></View><Text style={styles.cardTitle}>{title}</Text></View>{items.map((item, index) => <View key={`${title}-${index}`} style={styles.item}><View style={[styles.dot, { backgroundColor: color }]} /><View style={styles.itemCopy}><Text selectable style={styles.itemTitle}>{item.area || item.section || item}</Text>{item.detail ? <Text selectable style={styles.itemBody}>{item.detail}</Text> : null}{item.suggested ? <Text selectable style={styles.itemBody}>{item.suggested}</Text> : null}{item.reason ? <Text selectable style={styles.reason}>{item.reason}</Text> : null}</View></View>)}</View>;
}

export default function ResumeAnalyzeScreen() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const { isAnalyzingResume, analyzeResume } = useInterviewStore();

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'], copyToCacheDirectory: true, multiple: false });
    if (!result.canceled) { setFile(result.assets[0]); setAnalysis(null); }
  };

  const runAnalysis = async () => {
    if (!file) return Alert.alert('Resume required', 'Upload a PDF, DOCX, or DOC resume first.');
    try { setAnalysis(await analyzeResume('', jobDescription.trim(), file)); }
    catch (error) { Alert.alert('Analysis failed', error.message); }
  };

  return <View style={styles.screen}><View pointerEvents="none" style={styles.glow} />{isAnalyzingResume ? <LoadingOverlay message="Reading your resume and preparing insights…" /> : null}<ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={styles.hero}><View style={styles.eyebrow}><Ionicons name="sparkles" size={13} color="#D4CAFF" /><Text style={styles.eyebrowText}>AI CAREER TOOL</Text></View><Text style={styles.title}>Resume Analyzer</Text><Text style={styles.subtitle}>Upload your resume for a clear overview of its strengths, gaps, and next improvements.</Text></View>
    <View style={styles.card}><Text style={styles.label}>YOUR RESUME</Text><Pressable onPress={pickResume} style={({ pressed }) => [styles.upload, pressed && styles.pressed]}><View style={styles.uploadIcon}><Ionicons name={file ? 'checkmark' : 'cloud-upload-outline'} size={27} color={file ? p.green : p.purple} /></View><View style={styles.uploadCopy}><Text style={styles.uploadTitle}>{file ? file.name : 'Upload PDF or Word file'}</Text><Text style={styles.uploadSub}>{file ? `${Math.max(1, Math.round((file.size || 0) / 1024))} KB · Tap to replace` : 'PDF, DOCX, or DOC · Up to 10 MB'}</Text></View><Ionicons name="chevron-forward" size={20} color={p.muted} /></Pressable>
      <Text style={styles.label}>TARGET JOB DESCRIPTION (OPTIONAL)</Text><TextInput multiline value={jobDescription} onChangeText={setJobDescription} editable={!isAnalyzingResume} placeholder="Paste a job description to also receive a match score…" placeholderTextColor="#9B9CAA" textAlignVertical="top" style={styles.input} />
      <Pressable onPress={runAnalysis} disabled={!file || isAnalyzingResume} style={({ pressed }) => [styles.primary, (!file || isAnalyzingResume) && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>Analyze my resume</Text><Ionicons name="arrow-forward" size={20} color="#FFF" /></Pressable>
    </View>
    {analysis ? <View style={styles.results}><Text style={styles.resultsTitle}>Your resume overview</Text><View style={styles.scoreHero}><View><Text style={styles.scoreLabel}>OVERALL SCORE</Text><Text selectable style={styles.score}>{analysis.overall_score}<Text style={styles.scoreMax}>/100</Text></Text></View><Text selectable style={styles.summary}>{analysis.summary}</Text></View>
      <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricLabel}>ATS readiness</Text><Text style={styles.metricValue}>{analysis.ats_compatibility ?? '—'}%</Text></View>{analysis.job_match_score != null ? <View style={styles.metric}><Text style={styles.metricLabel}>Job match</Text><Text style={styles.metricValue}>{analysis.job_match_score}%</Text></View> : null}</View>
      <InsightCard icon="checkmark-circle-outline" title="CV strengths" tone="green" items={analysis.strengths} /><InsightCard icon="alert-circle-outline" title="Weaknesses to address" tone="amber" items={analysis.weaknesses} /><InsightCard icon="trending-up-outline" title="What to improve" items={analysis.suggestions} /><InsightCard icon="add-circle-outline" title="Sections to add" items={analysis.missing_sections} />
    </View> : null}
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, ...Gradients.screen }, glow: { position: 'absolute', width: 300, height: 480, borderRadius: 120, backgroundColor: '#F0EBFF', right: -220, top: 80, transform: [{ rotate: '-22deg' }] }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 22, paddingBottom: 52, gap: 18 },
  hero: { overflow: 'hidden', gap: 8, borderRadius: 24, ...Gradients.hero, borderWidth: 1, borderColor: Colors.borderLight, padding: 22, boxShadow: '0 12px 28px rgba(55,38,116,0.10)' }, eyebrow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: Colors.primaryBg, paddingHorizontal: 9, paddingVertical: 6 }, eyebrowText: { color: Colors.primaryDark, fontSize: 9, fontWeight: '900', letterSpacing: .8 }, title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' }, subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  card: { gap: 14, borderRadius: 20, borderWidth: 1, borderColor: p.line, backgroundColor: p.card, padding: 18, boxShadow: '0 8px 24px rgba(57,41,110,.05)' }, label: { color: p.muted, fontSize: 10, fontWeight: '900', letterSpacing: .9, paddingTop: 2 }, upload: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: p.line, borderRadius: 16, backgroundColor: p.bg, padding: 13 }, uploadIcon: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: p.lavender }, uploadCopy: { flex: 1, gap: 3 }, uploadTitle: { color: p.ink, fontSize: 14, fontWeight: '800' }, uploadSub: { color: p.muted, fontSize: 11 }, input: { minHeight: 112, borderWidth: 1, borderColor: p.line, borderRadius: 15, backgroundColor: p.bg, padding: 14, color: p.ink, fontSize: 14, lineHeight: 21 }, primary: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, backgroundColor: p.purple, boxShadow: '0 8px 18px rgba(112,71,245,.2)' }, primaryText: { color: '#FFF', fontSize: 16, fontWeight: '800' }, disabled: { opacity: .45 }, pressed: { opacity: .76, transform: [{ scale: .99 }] },
  results: { gap: 15 }, resultsTitle: { color: p.ink, fontSize: 24, fontWeight: '800' }, scoreHero: { gap: 12, borderRadius: 22, backgroundColor: p.lavender, padding: 19 }, scoreLabel: { color: p.dark, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, score: { color: p.ink, fontSize: 47, fontWeight: '900', fontVariant: ['tabular-nums'] }, scoreMax: { color: p.muted, fontSize: 16 }, summary: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 }, metrics: { flexDirection: 'row', gap: 10 }, metric: { flex: 1, gap: 5, borderRadius: 17, borderWidth: 1, borderColor: p.line, backgroundColor: p.card, padding: 15 }, metricLabel: { color: p.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }, metricValue: { color: p.dark, fontSize: 27, fontWeight: '900' }, cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 }, cardIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent:'center' }, cardTitle: { color: p.ink, fontSize: 17, fontWeight: '800' }, item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, dot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 }, itemCopy: { flex: 1, gap: 3 }, itemTitle: { color: p.ink, fontSize: 13, lineHeight: 20, fontWeight: '800' }, itemBody: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 }, reason: { color: p.muted, fontSize: 11, lineHeight: 17, fontStyle: 'italic' },
});
