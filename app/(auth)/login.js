import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loginUser, registerUser, resetPassword } from '../../services/authService';
import LegalModal from '../../components/legal-modal';
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '../../components/legal-content';
import { loadPreferences, savePreferences } from '../../utils/storage';
import { Colors, Gradients } from '../../constants/theme';

const PURPLE = '#6541F5';
const INK = Colors.textPrimary;
const MUTED = Colors.textSecondary;
const BORDER = Colors.border;
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [unavailableProvider, setUnavailableProvider] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legal, setLegal] = useState(null);

  const authenticate = async () => {
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    if (!cleanEmail || !password || (!isLogin && !cleanName)) {
      Alert.alert('Missing information', 'Please complete all required fields.');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please enter the same password in both fields.');
      return;
    }
    if (!isLogin && !acceptedTerms) {
      Alert.alert('Accept the terms', 'Please review and accept the Terms & Conditions and Privacy Policy to create your account.');
      return;
    }
    setLoading(true);
    try {
      const result = isLogin
        ? await loginUser(cleanEmail, password)
        : await registerUser(cleanEmail, password, cleanName);
      if (!result.success) Alert.alert('Unable to continue', result.error || 'Please try again.');
      else if (!isLogin) { const preferences = await loadPreferences(); await savePreferences({ ...preferences, acceptedTerms: true }); }
    } catch (error) {
      Alert.alert('Unable to continue', error?.message || 'Please try again.');
    } finally { setLoading(false); }
  };

  const sendReset = async () => {
    if (!resetEmail.trim()) return Alert.alert('Email required', 'Enter the email linked to your account.');
    setLoading(true);
    try {
      const result = await resetPassword(resetEmail.trim());
      if (result.success) {
        Alert.alert('Check your inbox', result.message);
        setForgotOpen(false);
        setResetEmail('');
      } else Alert.alert('Reset failed', result.error || 'Please try again.');
    } catch (error) {
      Alert.alert('Reset failed', error?.message || 'Please try again.');
    } finally { setLoading(false); }
  };

  const field = ({ id, icon, placeholder, value, onChangeText, secure, eye, passwordVisible, onTogglePassword, ...props }) => (
    <View style={[styles.inputShell, focused === id && styles.inputFocused]}>
      <Ionicons name={icon} size={25} color="#73778D" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A9ABBA"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
        secureTextEntry={secure}
        editable={!loading}
        selectionColor={PURPLE}
        autoCorrect={false}
        {...props}
      />
      {eye && <Pressable onPress={onTogglePassword} hitSlop={12} style={styles.eye} accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}><Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={26} color="#73778D" /></Pressable>}
    </View>
  );

  const toggleMode = () => {
    setIsLogin((v) => !v);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAcceptedTerms(false);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.leftGlow} />
      <View pointerEvents="none" style={styles.rightGlow} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
        <View style={styles.brandBlock}>
          <Image source={require('../../assets/logo.png')} resizeMode="contain" style={styles.logoImage} accessibilityLabel="Hirely" />
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{isLogin ? 'Welcome back!' : 'Create Your Account'}</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Login to continue your journey' : 'Sign up to start your journey'}</Text>
        </View>
        <View style={styles.form}>
          {!isLogin && field({ id: 'name', icon: 'person-outline', placeholder: 'Full Name', value: name, onChangeText: setName, autoCapitalize: 'words', autoComplete: 'name', textContentType: 'name' })}
          {field({ id: 'email', icon: 'mail-outline', placeholder: 'Email Address', value: email, onChangeText: setEmail, keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email', textContentType: 'emailAddress' })}
          {field({ id: 'password', icon: 'lock-closed-outline', placeholder: isLogin ? 'Password' : 'Create Password', value: password, onChangeText: setPassword, secure: !showPassword, eye: true, passwordVisible: showPassword, onTogglePassword: () => setShowPassword((value) => !value), autoCapitalize: 'none', autoComplete: isLogin ? 'current-password' : 'new-password', textContentType: isLogin ? 'password' : 'newPassword' })}
          {!isLogin && field({ id: 'confirm', icon: 'lock-closed-outline', placeholder: 'Confirm Password', value: confirmPassword, onChangeText: setConfirmPassword, secure: !showConfirmPassword, eye: true, passwordVisible: showConfirmPassword, onTogglePassword: () => setShowConfirmPassword((value) => !value), autoCapitalize: 'none', autoComplete: 'new-password', textContentType: 'newPassword' })}
          {!isLogin && <View style={styles.consentRow}><Pressable onPress={()=>setAcceptedTerms(value=>!value)} accessibilityRole="checkbox" accessibilityState={{checked:acceptedTerms}} style={[styles.checkbox,acceptedTerms&&styles.checkboxChecked]}>{acceptedTerms?<Ionicons name="checkmark" size={17} color="#FFF"/>:null}</Pressable><Text style={styles.consentText}>I agree to the <Text onPress={()=>setLegal('terms')} style={styles.consentLink}>Terms & Conditions</Text> and acknowledge the <Text onPress={()=>setLegal('privacy')} style={styles.consentLink}>Privacy Policy</Text>.</Text></View>}
          {isLogin && <Pressable onPress={() => { setResetEmail(email.trim()); setForgotOpen(true); }} style={styles.forgot}><Text style={styles.forgotText}>Forgot password?</Text></Pressable>}
          <Pressable onPress={authenticate} disabled={loading} style={({ pressed }) => [styles.primary, pressed && styles.pressed, loading && styles.disabled]}><Text style={styles.primaryText}>{loading ? 'Please wait…' : isLogin ? 'Login' : 'Sign Up'}</Text></Pressable>
          <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>or continue with</Text><View style={styles.line} /></View>
          <View style={styles.socialRow}>
            <Pressable onPress={() => setUnavailableProvider('Google')} disabled={loading} style={({ pressed }) => [styles.social, pressed && styles.pressed]}><Text style={styles.google}>G</Text><Text style={styles.socialText}>Google</Text></Pressable>
            <Pressable onPress={() => setUnavailableProvider('Apple')} disabled={loading} style={({ pressed }) => [styles.social, pressed && styles.pressed]}><Ionicons name="logo-apple" size={30} color="#050505" /><Text style={styles.socialText}>Apple</Text></Pressable>
          </View>
          <Pressable onPress={toggleMode} disabled={loading} style={styles.toggle}><Text style={styles.toggleText}>{isLogin ? "Don't have an account?  " : 'Already have an account? '}<Text style={styles.toggleLink}>{isLogin ? 'Sign up' : 'Log in'}</Text></Text></Pressable>
        </View>
      </ScrollView>
      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !loading && setForgotOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Reset your password</Text><Pressable onPress={() => setForgotOpen(false)} hitSlop={12}><Ionicons name="close" size={24} color={MUTED} /></Pressable></View>
            <Text style={styles.modalCopy}>Enter your account email and we’ll send you a secure reset link.</Text>
            {field({ id: 'reset', icon: 'mail-outline', placeholder: 'Email Address', value: resetEmail, onChangeText: setResetEmail, keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email' })}
            <Pressable onPress={sendReset} disabled={loading} style={[styles.primary, loading && styles.disabled]}><Text style={styles.primaryText}>{loading ? 'Please wait…' : 'Send reset link'}</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={Boolean(unavailableProvider)} transparent animationType="fade" onRequestClose={() => setUnavailableProvider(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setUnavailableProvider(null)} />
          <View style={[styles.modalCard, styles.unavailableCard]}>
            <View style={styles.unavailableIcon}><Ionicons name="sparkles" size={28} color={PURPLE} /></View>
            <Text style={styles.modalTitle}>{unavailableProvider} sign-in</Text>
            <Text style={[styles.modalCopy, styles.unavailableCopy]}>This option is currently unavailable. Please continue securely with your email and password.</Text>
            <Pressable onPress={() => setUnavailableProvider(null)} style={styles.primary}><Text style={styles.primaryText}>Got it</Text></Pressable>
          </View>
        </View>
      </Modal>
      <LegalModal visible={legal==='privacy'} title="Hirely Privacy Policy" sections={PRIVACY_SECTIONS} onClose={()=>setLegal(null)}/>
      <LegalModal visible={legal==='terms'} title="Terms & Conditions" sections={TERMS_SECTIONS} onClose={()=>setLegal(null)}/>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, ...Gradients.screen },
  content: { flexGrow: 1, width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 52 },
  leftGlow: { position: 'absolute', width: 390, height: 560, borderRadius: 260, backgroundColor: Colors.primaryBg, top: -275, left: -235, transform: [{ rotate: '-18deg' }] },
  rightGlow: { position: 'absolute', width: 270, height: 500, borderRadius: 180, backgroundColor: Colors.bgSecondary, top: 350, right: -225 },
  brandBlock: { alignItems: 'center', paddingTop: 34 },
  logoImage: { width: 230, height: 108 },
  heading: { alignItems: 'center', paddingTop: 24, paddingBottom: 34 },
  title: { color: INK, fontSize: 27, lineHeight: 34, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: MUTED, fontSize: 18, lineHeight: 25, paddingTop: 7, textAlign: 'center' },
  form: { gap: 16 },
  inputShell: { height: 66, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 15, borderCurve: 'continuous', backgroundColor: Colors.bgCard, paddingHorizontal: 18 },
  inputFocused: { borderColor: PURPLE, boxShadow: '0 0 0 3px rgba(101,65,245,0.10)' },
  input: { flex: 1, height: '100%', paddingHorizontal: 17, paddingVertical: 0, color: INK, fontSize: 17 },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  forgot: { alignSelf: 'flex-end', minHeight: 30, justifyContent: 'center', marginTop: -6 },
  forgotText: { color: PURPLE, fontSize: 16, fontWeight: '700' },
  primary: { height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderCurve: 'continuous', backgroundColor: PURPLE, boxShadow: '0 10px 28px rgba(101,65,245,0.22)' },
  primaryText: { color: '#FFF', fontSize: 19, fontWeight: '700' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 13 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: MUTED, fontSize: 16 },
  socialRow: { flexDirection: 'row', gap: 14 },
  social: { flex: 1, height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, borderWidth: 1, borderColor: BORDER, borderRadius: 14, borderCurve: 'continuous', backgroundColor: Colors.bgCard },
  google: { color: '#4285F4', fontSize: 29, fontWeight: '900' },
  socialText: { color: INK, fontSize: 18, fontWeight: '500' },
  toggle: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  toggleText: { color: MUTED, fontSize: 16, textAlign: 'center' },
  toggleLink: { color: PURPLE, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(17,20,47,0.45)' },
  modalCard: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 18, borderRadius: 24, borderCurve: 'continuous', backgroundColor: Colors.bgCard, padding: 24, boxShadow: '0 20px 45px rgba(17,20,47,0.2)' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: INK, fontSize: 24, fontWeight: '800' },
  modalCopy: { color: MUTED, fontSize: 15, lineHeight: 22 },
  unavailableCard: { alignItems: 'center' },
  unavailableIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryBg },
  unavailableCopy: { textAlign: 'center' },
  consentRow:{flexDirection:'row',alignItems:'flex-start',gap:11},
  checkbox:{width:25,height:25,borderRadius:7,borderWidth:1.5,borderColor:BORDER,alignItems:'center',justifyContent:'center',backgroundColor:Colors.bgCard},
  checkboxChecked:{borderColor:PURPLE,backgroundColor:PURPLE},
  consentText:{flex:1,color:MUTED,fontSize:12,lineHeight:19},consentLink:{color:PURPLE,fontWeight:'800'},
});
