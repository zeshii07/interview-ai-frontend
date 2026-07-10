import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { registerUser, loginUser, resetPassword, signInWithGoogle } from '../../services/authService';

const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // NEW: Eye toggle state
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    const result = isLogin 
      ? await loginUser(email, password) 
      : await registerUser(email, password, name);
    setLoading(false);
    if (!result.success) Alert.alert("Error", result.error);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);
    if (!result.success) Alert.alert("Error", result.error);
  };

  const handleReset = async () => {
    if (!resetEmail) return Alert.alert("Error", "Enter your email.");
    setLoading(true);
    const result = await resetPassword(resetEmail);
    setLoading(false);
    if (result.success) {
      Alert.alert("Success", result.message);
      setShowForgotModal(false);
    } else {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Modern Bright Top Section */}
        <View style={styles.topSection}>
          {/* Decorative Glow Circles for modern look */}
          <View style={styles.glowCircle1} />
          <View style={styles.glowCircle2} />
          
          <Text style={styles.logo}>Hirely</Text>
          <Text style={styles.topSubtitle}>Master your interviews with AI</Text>
        </View>

        {/* Bottom Form Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.formSubtitle}>{isLogin ? 'Sign in to continue' : 'Sign up to get started'}</Text>

          {/* Name Input */}
          {!isLogin && (
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} autoCapitalize="words" />
              </View>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
              <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          {/* Password Input with Eye Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
              <TextInput 
                style={styles.input} 
                placeholder="Password" 
                placeholderTextColor={Colors.textMuted} 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword} // Toggles based on state
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          {isLogin && (
            <TouchableOpacity onPress={() => setShowForgotModal(true)} style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Primary Button */}
          <Button 
            title={isLogin ? 'Sign In' : 'Create Account'} 
            onPress={handleAuth} 
            loading={loading} 
            fullWidth 
            size="large" 
          />

          {/* Toggle Auth */}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.toggleHighlight}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={{ flex: 1, minHeight: Spacing.xl }} />

          {/* Bottom Section */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={loading}>
            <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by Advanced AI</Text>
            <Text style={styles.footerSubtext}>Secure & Private</Text>
          </View>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>Enter your email to receive a reset link.</Text>
            <View style={[styles.inputWrapper, { marginBottom: 0 }]}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
              <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={Colors.textMuted} value={resetEmail} onChangeText={setResetEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setShowForgotModal(false)} variant="outline" size="medium" />
              <Button title="Send Link" onPress={handleReset} size="medium" loading={loading} />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  scrollContent: { flexGrow: 1 },
  
  // Modern Brighter Top Section
  topSection: { 
    height: 280, 
    backgroundColor: Colors.primary, // Changed to bright purple
    justifyContent: 'center', 
    alignItems: 'center', 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden' // Allows glow circles to bleed outside edges slightly
  },
  // Modern Glow Effects
  glowCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -60,
    right: -40
  },
  glowCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: 30,
    left: -30
  },
  logo: { color: Colors.textPrimary, fontSize: 42, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', zIndex: 1 },
  topSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: FontSizes.md, marginTop: Spacing.sm, textAlign: 'center', fontWeight: '500', zIndex: 1 },

  bottomSection: { 
    paddingHorizontal: Spacing.lg, 
    paddingTop: Spacing.xl,
    flex: 1
  },
  formTitle: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: '800' },
  formSubtitle: { color: Colors.textMuted, fontSize: FontSizes.md, marginTop: Spacing.xs, marginBottom: Spacing.xl },
  
  inputGroup: { marginBottom: Spacing.md },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.bgElevated, 
    borderWidth: 1.5, 
    borderColor: Colors.border, 
    borderRadius: Radius.md, 
    paddingHorizontal: Spacing.md, 
    height: 54, 
    marginBottom: Spacing.md 
  },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSizes.md, marginLeft: Spacing.sm, height: '100%' },
  
  // Eye Toggle Button
  eyeBtn: { 
    padding: Spacing.sm, 
    marginLeft: Spacing.sm 
  },

  forgotContainer: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotText: { color: Colors.primaryLight, fontSize: FontSizes.sm, fontWeight: '600' },

  toggleContainer: { marginTop: Spacing.md, alignItems: 'center' },
  toggleText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  toggleHighlight: { color: Colors.primaryLight, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, marginHorizontal: Spacing.md, fontWeight: '600' },

  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgElevated, borderWidth: 1.5, borderColor: Colors.borderLight, borderRadius: Radius.md, height: 54 },
  googleBtnText: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '700', marginLeft: Spacing.sm },

  footer: { alignItems: 'center', marginTop: Spacing.xl, paddingBottom: Spacing.lg },
  footerText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  footerSubtext: { color: Colors.textMuted, fontSize: 10, marginTop: 4, opacity: 0.6 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.xl, width: '100%', borderWidth: 1, borderColor: Colors.border },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: '800', marginBottom: Spacing.sm },
  modalSubtitle: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }
});

export default LoginScreen;