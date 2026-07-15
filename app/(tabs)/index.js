import React from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { getCurrentUser, logoutUser, onAuthChange, onProfileChange } from '../../services/authService';
import useInterviewStore from '../../store/interviewStore';
import { DIFFICULTY_LEVELS } from '../../constants/config';
import { loadPreferences } from '../../utils/storage';
import { Colors, Gradients } from '../../constants/theme';

const palette = {
  ink: Colors.textPrimary,
  muted: Colors.textMuted,
  purple: '#7047F5',
  purpleDark: '#5330DB',
  lavender: Colors.primaryBg,
  line: Colors.border,
  surface: Colors.bgCard,
  background: Colors.bgPrimary,
};

const tools = [
  {
    title: 'Analyze Your\nResume',
    description: 'Improve your resume',
    icon: 'document-text-outline',
    route: '/resume/analyze',
    featured: true,
  },
  {
    title: 'Question\nBank',
    description: 'Practice key questions',
    icon: 'help-circle-outline',
    route: '/questions',
  },
  {
    title: 'Your Progress\nHistory',
    description: 'Review past sessions',
    icon: 'bar-chart-outline',
    route: '/history',
  },
  {
    title: 'Your AI\nCoach',
    description: 'Personalized coaching',
    icon: 'headset-outline',
    comingSoon: true,
  },
];

const LANGUAGES = [
  { value: 'English', label: 'English', code: 'EN' },
  { value: 'Urdu', label: 'Urdu', code: 'UR' },
  { value: 'Hindi', label: 'Hindi', code: 'HI' },
  { value: 'Arabic', label: 'Arabic', code: 'AR' },
  { value: 'Spanish', label: 'Spanish', code: 'ES' },
  { value: 'French', label: 'French', code: 'FR' },
  { value: 'German', label: 'German', code: 'DE' },
];

function ScoreGauge({ score, displayScore }) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(score / 10, 1));

  return (
    <View
      style={[styles.gauge, { width: size, height: size }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={displayScore === 'N/A' ? 'No interview score yet' : `Your current score is ${displayScore} out of 10`}
    >
      <Svg width={size} height={size} style={styles.gaugeSvg}>
        <Defs>
          <LinearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8B6BFA" />
            <Stop offset="1" stopColor="#5633DF" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E7E2F8"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.gaugeContent} importantForAccessibility="no">
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{displayScore}</Text>
          {displayScore !== 'N/A' ? <Text style={styles.scoreMax}>/10</Text> : null}
        </View>
        <Text style={styles.scoreLabel}>Your Current Score</Text>
      </View>
    </View>
  );
}

function ToolCard({ item }) {
  return (
    <Pressable
      onPress={() => item.route && router.push(item.route)}
      disabled={item.comingSoon}
      accessibilityRole="button"
      accessibilityLabel={`${item.title.replace('\n', ' ')}. ${item.description}`}
      accessibilityState={{ disabled: Boolean(item.comingSoon) }}
      style={({ pressed }) => [
        styles.toolCard,
        item.featured && styles.toolCardFeatured,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.toolIconWrap}>
        <Ionicons name={item.icon} size={38} color={palette.purpleDark} />
        <View style={styles.toolIconDot} />
      </View>
      <View style={styles.toolCopy}>
        <Text style={styles.toolTitle}>{item.title}</Text>
        <Text style={styles.toolDescription}>{item.description}</Text>
      </View>
      {item.comingSoon ? (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>COMING SOON</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function HomeScreen() {
  const history = useInterviewStore((state) => state.interviewHistory);
  const setRole = useInterviewStore((state) => state.setRole);
  const setDifficulty = useInterviewStore((state) => state.setDifficulty);
  const setLanguage = useInterviewStore((state) => state.setLanguage);
  const [userName, setUserName] = React.useState(getCurrentUser()?.displayName?.trim() || '');
  const [setupOpen, setSetupOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [role, setRoleInput] = React.useState('');
  const [difficulty, setDifficultyInput] = React.useState('intermediate');
  const [language, setLanguageInput] = React.useState('English');

  React.useEffect(() => {
    const updateName = (user) => setUserName(user?.displayName?.trim() || '');
    const unsubscribeAuth = onAuthChange(updateName);
    const unsubscribeProfile = onProfileChange(updateName);
    return () => { unsubscribeAuth(); unsubscribeProfile(); };
  }, []);

  React.useEffect(() => { loadPreferences().then((preferences) => setLanguageInput(preferences.language)); }, []);

  const ratings = history
    .map((item) => {
      const rating = Number(item.feedback?.rating);
      const max = Number(item.feedback?.rating_max) || 10;
      return Number.isFinite(rating) && max > 0 ? (rating / max) * 10 : null;
    })
    .filter((rating) => rating !== null);
  const averageScore = ratings.length
    ? Math.round((ratings.reduce((total, rating) => total + rating, 0) / ratings.length) * 10) / 10
    : 0;
  const scoreDisplay = ratings.length ? averageScore.toFixed(1).replace('.0', '') : 'N/A';

  const startInterview = () => {
    const cleanRole = role.trim();
    if (cleanRole.length < 2) {
      Alert.alert('Role required', 'Enter the role you want to practice for.');
      return;
    }
    setRole(cleanRole);
    setDifficulty(difficulty);
    setLanguage(language);
    setSetupOpen(false);
    router.push('/interview/session');
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logoutUser },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundShapeTop} />
      <View style={styles.backgroundShapeRight} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <View style={styles.topActions}>
            <Pressable onPress={() => setMenuOpen(true)} accessibilityRole="button" accessibilityLabel="Open menu" style={styles.iconButton}>
              <Ionicons name="menu-outline" size={30} color={palette.muted} />
            </Pressable>
            <Pressable onPress={() => Alert.alert('Notifications', 'Personalized reminders and coaching notifications are coming soon.')} accessibilityRole="button" accessibilityLabel="Notifications" style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={27} color={palette.muted} />
            </Pressable>
          </View>

          <View style={styles.brand} accessibilityRole="header">
            <Image source={require('../../assets/logo.png')} resizeMode="contain" style={styles.brandLogo} accessibilityLabel="Hirely" />
          </View>

          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Profile and log out"
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Ionicons name="person" size={26} color={palette.purpleDark} />
          </Pressable>
        </View>

        <Text style={styles.welcome}>{userName ? `Welcome Back, ${userName}!` : 'Welcome Back!'}</Text>

        <View style={styles.dashboardCard}>
          <View style={styles.dashboardHeader}>
            <View>
              <Text style={styles.dashboardEyebrow}>YOUR PERFORMANCE</Text>
              <Text style={styles.dashboardTitle}>Interview readiness</Text>
            </View>
            <View style={styles.trendPill}>
              <Ionicons name="sparkles" size={14} color={palette.purpleDark} />
              <Text style={styles.trendText}>AI insights</Text>
            </View>
          </View>
          <View style={styles.dashboardBody}>
            <ScoreGauge score={averageScore} displayScore={scoreDisplay} />
            <View style={styles.dashboardStats}>
              <View style={styles.metricIcon}>
                <Ionicons name="chatbubbles-outline" size={24} color={palette.purple} />
              </View>
              <Text style={styles.metricValue}>{history.length}</Text>
              <Text style={styles.metricLabel}>Interviews completed</Text>
              <Text style={styles.metricHint}>{ratings.length ? 'Score based on your full history' : 'Complete your first interview to get a score'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.practiceCard}>
          <View style={styles.practiceGlow} />
          <View style={styles.practiceIcon}>
            <Ionicons name="mic" size={27} color="#FFFFFF" />
          </View>
          <View style={styles.practiceCopy}>
            <Text style={styles.practiceTitle}>Practice your interview with AI</Text>
            <Text style={styles.practiceSubtitle}>Get role-specific questions and instant, personalized feedback.</Text>
          </View>
          <Pressable
            onPress={() => setSetupOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Start AI interview"
            style={({ pressed }) => [styles.exploreButton, pressed && styles.explorePressed]}
          >
            <Text style={styles.exploreText}>Start AI Interview</Text>
            <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Your Career Tools</Text>
        <View style={styles.toolsGrid}>
          {tools.map((item) => (
            <ToolCard key={item.title} item={item} />
          ))}
        </View>

        <View style={styles.aiFooter}>
          <Ionicons name="sparkles" size={15} color={palette.purple} />
          <Text style={styles.aiFooterText}>Powered by advanced AI</Text>
        </View>

      </ScrollView>

      <Modal visible={setupOpen} transparent animationType="fade" onRequestClose={() => setSetupOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSetupOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Start AI Interview</Text>
                <Text style={styles.modalSubtitle}>Personalize your interview practice.</Text>
              </View>
              <Pressable onPress={() => setSetupOpen(false)} style={styles.iconButton} accessibilityLabel="Close">
                <Ionicons name="close" size={25} color={palette.muted} />
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>TARGET ROLE</Text>
            <View style={styles.roleInputShell}>
              <Ionicons name="briefcase-outline" size={21} color={palette.muted} />
              <TextInput
                value={role}
                onChangeText={setRoleInput}
                placeholder="e.g. Frontend Developer"
                placeholderTextColor="#9B9CAA"
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.roleInput}
              />
            </View>
            <Text style={styles.inputLabel}>DIFFICULTY</Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTY_LEVELS.map((level) => (
                <Pressable
                  key={level.value}
                  onPress={() => setDifficultyInput(level.value)}
                  style={[styles.difficultyButton, difficulty === level.value && styles.difficultyButtonActive]}
                >
                  <Text style={[styles.difficultyText, difficulty === level.value && styles.difficultyTextActive]}>{level.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.inputLabel}>INTERVIEW LANGUAGE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.languageRow}>
              {LANGUAGES.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setLanguageInput(item.value)}
                  style={[styles.languageButton, language === item.value && styles.languageButtonActive]}
                >
                  <View style={[styles.languageCode, language === item.value && styles.languageCodeActive]}>
                    <Text style={[styles.languageCodeText, language === item.value && styles.languageTextActive]}>{item.code}</Text>
                  </View>
                  <Text style={[styles.languageText, language === item.value && styles.languageTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={startInterview} style={({ pressed }) => [styles.modalStart, pressed && styles.pressed]}>
              <Text style={styles.modalStartText}>Begin Interview</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.menuOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          <View style={styles.menuPanel}>
            <View style={styles.menuHeader}><View style={styles.menuAvatar}><Ionicons name="person" size={24} color={palette.purpleDark}/></View><View style={styles.menuUser}><Text style={styles.menuName}>{userName || 'Hirely member'}</Text><Text numberOfLines={1} style={styles.menuEmail}>{getCurrentUser()?.email}</Text></View><Pressable onPress={() => setMenuOpen(false)} style={styles.iconButton}><Ionicons name="close" size={24} color={palette.muted}/></Pressable></View>
            {[['settings-outline','Settings','/settings'],['information-circle-outline','About Hirely','/settings/about'],['trash-outline','Account & Data','/settings/delete-account']].map(([icon,label,route])=><Pressable key={label} onPress={()=>{setMenuOpen(false);router.push(route)}} style={styles.menuRow}><View style={styles.menuRowIcon}><Ionicons name={icon} size={20} color={palette.purpleDark}/></View><Text style={styles.menuRowText}>{label}</Text><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>)}
            <Pressable onPress={()=>{setMenuOpen(false);handleLogout()}} style={styles.menuRow}><View style={[styles.menuRowIcon,{backgroundColor:'#FFF0F2'}]}><Ionicons name="log-out-outline" size={20} color="#C83F52"/></View><Text style={[styles.menuRowText,{color:'#B83346'}]}>Log out</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, ...Gradients.screen },
  backgroundShapeTop: {
    position: 'absolute',
    width: 300,
    height: 470,
    left: -125,
    top: -100,
    borderRadius: 70,
    backgroundColor: '#F0EBFF',
    transform: [{ rotate: '22deg' }],
  },
  backgroundShapeRight: {
    position: 'absolute',
    width: 240,
    height: 420,
    right: -190,
    top: 360,
    borderRadius: 90,
    backgroundColor: '#F3EFFF',
    transform: [{ rotate: '-28deg' }],
  },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 38, gap: 24 },
  topBar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandLogo: { width: 132, height: 54 },
  avatar: { marginLeft: 14, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8E1FF', borderWidth: 2, borderColor: '#FFFFFF' },
  welcome: { color: palette.ink, fontSize: 31, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  dashboardCard: { backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: palette.line, borderRadius: 18, borderCurve: 'continuous', padding: 18, boxShadow: '0 8px 24px rgba(57, 41, 110, 0.05)' },
  dashboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dashboardEyebrow: { color: palette.purpleDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  dashboardTitle: { color: palette.ink, fontSize: 23, lineHeight: 29, fontWeight: '800', paddingTop: 3 },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: palette.lavender, paddingHorizontal: 9, paddingVertical: 7 },
  trendText: { color: palette.purpleDark, fontSize: 10, fontWeight: '800' },
  dashboardBody: { minHeight: 158, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: 24, paddingTop: 10 },
  gauge: { alignItems: 'center', justifyContent: 'center' },
  gaugeSvg: { transform: [{ rotate: '-90deg' }] },
  gaugeContent: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 1, paddingHorizontal: 14 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  score: { color: palette.ink, fontSize: 31, lineHeight: 35, fontWeight: '800', letterSpacing: -1.1, fontVariant: ['tabular-nums'], textAlign: 'center' },
  scoreMax: { color: '#747482', fontSize: 12, fontWeight: '700' },
  scoreLabel: { maxWidth: 82, color: palette.muted, fontSize: 9, lineHeight: 12, fontWeight: '700', textAlign: 'center' },
  dashboardStats: { width: 104, alignItems: 'flex-start', gap: 4 },
  metricIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lavender, marginBottom: 3 },
  metricLabel: { color: palette.ink, fontSize: 13, lineHeight: 17, fontWeight: '700' },
  metricValue: { color: palette.ink, fontSize: 32, lineHeight: 36, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricHint: { color: palette.muted, fontSize: 10, lineHeight: 14, paddingTop: 2 },
  practiceCard: { position: 'relative', overflow: 'hidden', gap: 12, borderRadius: 22, borderCurve: 'continuous', ...Gradients.hero, borderWidth: 1, borderColor: Colors.borderLight, padding: 20, boxShadow: '0 12px 28px rgba(55,38,116,0.10)' },
  practiceGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, right: -55, top: -70, backgroundColor: 'rgba(112,71,245,0.32)' },
  practiceIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purple },
  practiceCopy: { gap: 5, paddingRight: 12 },
  practiceTitle: { color: Colors.textPrimary, fontSize: 22, lineHeight: 27, fontWeight: '800' },
  practiceSubtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  aiFooter: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingBottom: 12 },
  aiFooterText: { color: palette.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  toolCard: { width: '47.5%', minHeight: 178, alignItems: 'flex-start', gap: 8, paddingHorizontal: 14, paddingVertical: 17, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: palette.line, borderRadius: 16, borderCurve: 'continuous', boxShadow: '0 5px 18px rgba(52, 38, 94, 0.04)', position: 'relative' },
  toolCardFeatured: { borderColor: palette.purpleDark, borderWidth: 1.5 },
  toolIconWrap: { width: 50, height: 54, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  toolIconDot: { position: 'absolute', right: 3, bottom: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#B5A3FF', borderWidth: 2, borderColor: '#FFFFFF' },
  toolCopy: { flex: 1, gap: 5 },
  toolTitle: { color: palette.ink, fontSize: 17, lineHeight: 21, fontWeight: '800' },
  toolDescription: { color: '#28283A', fontSize: 13, lineHeight: 17 },
  comingSoonBadge: { position: 'absolute', top: 10, right: 8, borderRadius: 8, backgroundColor: palette.lavender, paddingHorizontal: 6, paddingVertical: 4 },
  comingSoonText: { color: palette.purpleDark, fontSize: 7, fontWeight: '900', letterSpacing: 0.4 },
  exploreButton: { height: 56, flexDirection: 'row', gap: 9, borderRadius: 14, borderCurve: 'continuous', backgroundColor: palette.purple, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 9px 20px rgba(112, 71, 245, 0.24)' },
  explorePressed: { backgroundColor: palette.purpleDark, transform: [{ scale: 0.99 }] },
  exploreText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(16,17,39,0.48)' },
  modalCard: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 14, borderRadius: 24, borderCurve: 'continuous', backgroundColor: palette.surface, padding: 22, boxShadow: '0 20px 48px rgba(16,17,39,0.22)' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 4 },
  modalTitle: { color: palette.ink, fontSize: 24, fontWeight: '800' },
  modalSubtitle: { color: palette.muted, fontSize: 14, paddingTop: 4 },
  inputLabel: { color: palette.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, paddingTop: 3 },
  roleInputShell: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 14, paddingHorizontal: 14, backgroundColor: palette.background },
  roleInput: { flex: 1, height: '100%', color: palette.ink, fontSize: 16 },
  difficultyRow: { flexDirection: 'row', gap: 8 },
  difficultyButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.background },
  difficultyButtonActive: { borderColor: palette.purple, backgroundColor: palette.lavender },
  difficultyText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  difficultyTextActive: { color: palette.purpleDark },
  languageRow: { gap: 8, paddingRight: 4 },
  languageButton: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.background, paddingHorizontal: 9 },
  languageButtonActive: { borderColor: palette.purple, backgroundColor: palette.lavender },
  languageCode: { width: 25, height: 25, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEEFF4' },
  languageCodeActive: { backgroundColor: '#DCD2FF' },
  languageCodeText: { color: palette.muted, fontSize: 9, fontWeight: '900' },
  languageText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  languageTextActive: { color: palette.purpleDark },
  modalStart: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, backgroundColor: palette.purple, marginTop: 6 },
  modalStartText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  menuOverlay:{flex:1,backgroundColor:'rgba(16,17,39,.4)',justifyContent:'flex-start'},
  menuPanel:{width:'84%',maxWidth:360,height:'100%',backgroundColor:palette.background,paddingTop:50,paddingHorizontal:18,gap:6,boxShadow:'8px 0 30px rgba(16,17,39,.18)'},
  menuHeader:{flexDirection:'row',alignItems:'center',gap:10,paddingBottom:18,borderBottomWidth:1,borderBottomColor:palette.line},
  menuAvatar:{width:46,height:46,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:palette.lavender},
  menuUser:{flex:1,gap:3},menuName:{color:palette.ink,fontSize:15,fontWeight:'900'},menuEmail:{color:palette.muted,fontSize:11},
  menuRow:{minHeight:62,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:palette.line},
  menuRowIcon:{width:39,height:39,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:palette.lavender},menuRowText:{flex:1,color:palette.ink,fontSize:14,fontWeight:'800'},
});
