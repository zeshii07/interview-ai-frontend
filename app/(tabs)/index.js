 import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import { DIFFICULTY_LEVELS } from '../../constants/config';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useInterviewStore from '../../store/interviewStore';
import { logoutUser } from '../../services/authService'; // NEW: Import logout

const HomeScreen = () => {
  const { setRole, setDifficulty } = useInterviewStore();
  const [roleInput, setRoleInput] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');

  const handleStartInterview = () => {
    const trimmedRole = roleInput.trim();
    if (!trimmedRole) return;
    setRole(trimmedRole);
    setDifficulty(selectedDifficulty);
    router.push('/interview/session');
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Logout", style: "destructive", onPress: async () => {
          await logoutUser();
        }}
      ]
    );
  };

  const features = [
    { icon: 'library-outline', title: 'Question Bank', desc: 'Browse curated questions by role', color: Colors.info, route: '/questions' },
    { icon: 'document-text-outline', title: 'Resume Analyzer', desc: 'ATS score & AI rewrites', color: Colors.secondary, route: '/resume/analyze' },
    { icon: 'time-outline', title: 'My Progress', desc: 'Track interview history', color: Colors.success, route: '/history' },
    { icon: 'school-outline', title: 'STAR Method', desc: 'Learn the best answering framework', color: Colors.warning, route: null },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>Hirely</Text>
            <Text style={styles.tagline}>Land your dream job with AI</Text>
          </View>
          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Main Setup Card */}
        <Card style={styles.setupCard} padding="lg">
          <Text style={styles.sectionTitle}>Quick Setup</Text>
          
          {/* Dynamic Role Input */}
          <Text style={styles.label}>Target Role</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.roleInput}
              placeholder="e.g., Frontend Developer, Product Manager..."
              placeholderTextColor={Colors.textMuted}
              value={roleInput}
              onChangeText={setRoleInput}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Difficulty */}
          <Text style={[styles.label, { marginTop: Spacing.lg }]}>Difficulty Level</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.diffCard, 
                  selectedDifficulty === level.value && { 
                    borderColor: level.color, 
                    backgroundColor: level.color + '15',
                    ...Shadows.small
                  }
                ]}
                onPress={() => setSelectedDifficulty(level.value)}
              >
                <Text style={styles.diffIcon}>{level.icon}</Text>
                <Text style={[styles.diffLabel, selectedDifficulty === level.value && { color: level.color }]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Start AI Interview"
              onPress={handleStartInterview}
              disabled={roleInput.trim().length < 2}
              fullWidth
              size="large"
              icon={<Ionicons name="arrow-forward-circle" size={22} color={Colors.textPrimary} style={{marginRight: 4}} />}
            />
          </View>
        </Card>

        {/* Features Grid */}
        <Text style={styles.sectionTitle}>Explore Tools</Text>
        <View style={styles.featuresGrid}>
          {features.map((f, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.featureCard} 
              onPress={() => f.route ? router.push(f.route) : null} 
              activeOpacity={0.7}
              disabled={!f.route}
            >
              <View style={[styles.featureIconBg, { backgroundColor: f.color + '15' }]}>
                <Ionicons name={f.icon} size={22} color={f.color} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
              {!f.route && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Advanced AI</Text>
          <Text style={styles.footerSubtext}>Your data is secure and private</Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xxl },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm
  },
  brandName: { color: Colors.primaryLight, fontSize: FontSizes.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  tagline: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: '800', marginTop: Spacing.xs },
  logoutBtn: { 
    backgroundColor: Colors.error + '15', 
    width: 44, 
    height: 44, 
    borderRadius: Radius.full, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '30'
  },

  setupCard: { marginBottom: Spacing.xl, ...Shadows.medium },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: '700', marginBottom: Spacing.lg },
  
  label: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '700', marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgElevated, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 54 },
  inputIcon: { marginRight: Spacing.sm },
  roleInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '500', height: '100%', paddingVertical: Spacing.sm },

  difficultyRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  diffCard: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.bgElevated, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  diffIcon: { fontSize: 24, marginBottom: 6 },
  diffLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700' },

  buttonContainer: { marginTop: Spacing.xl },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  featureCard: { width: '47%', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.small, position: 'relative' },
  featureIconBg: { width: 48, height: 48, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  featureTitle: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '700', marginBottom: 4 },
  featureDesc: { color: Colors.textMuted, fontSize: FontSizes.xs, lineHeight: 18 },
  comingSoonBadge: { position: 'absolute', top: Spacing.md, right: Spacing.md, backgroundColor: Colors.bgElevated, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  comingSoonText: { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },

  footer: { alignItems: 'center', marginTop: Spacing.xxl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, width: '100%' },
  footerText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  footerSubtext: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 4, opacity: 0.7 }
});

export default HomeScreen;