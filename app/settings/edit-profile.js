import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile, reload } from 'firebase/auth';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import { getCurrentUser, onProfileChange } from '../../services/authService';
import { saveProfilePhoto, deleteProfilePhoto, loadProfilePhoto } from '../../services/profilePhotoService';

import Button from '../../components/ui/Button';
import FormField from '../../components/resume/FormField';

/**
 * Edit Profile screen.
 *
 * Lets the user edit their display name (Firebase Auth) and avatar photo
 * (Firebase Realtime Database — see profilePhotoService for why we don't
 * use Firebase Auth's photoURL field).
 *
 * SPRINT 3.2 FIXES:
 *   1. Photo is now stored in Firebase RTDB (no size limit) instead of
 *      Firebase Auth's photoURL (1024 char limit). The previous code threw
 *      `auth/invalid-profile-attribute: Photo URL too long`.
 *   2. Fixed `ImagePicker.MediaTypeOptions` deprecation warning by using
 *      `ImagePicker.MediaType.Images` (new API in expo-image-picker 57+).
 */

// RTDB has a 256MB limit per node — we cap photos at 200KB to keep things
// snappy and avoid hogging the user's data plan.
const MAX_PHOTO_BYTES = 200 * 1024;

export default function EditProfileScreen() {
  const user = getCurrentUser();
  const userId = user?.uid;

  const [firstName, setFirstName] = useState(() => {
    const displayName = user?.displayName || '';
    return displayName.split(' ')[0] || '';
  });
  const [lastName, setLastName] = useState(() => {
    const parts = (user?.displayName || '').split(' ').filter(Boolean);
    return parts.slice(1).join(' ') || '';
  });
  const [email] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || ''); // legacy — shown but not used for save
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing photo from RTDB on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await loadProfilePhoto(userId);
        if (mounted && stored) setPhotoDataUrl(stored);
      } catch (err) {
        console.warn('[EditProfile] failed to load photo:', err);
      } finally {
        if (mounted) setPhotoLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const handlePickPhoto = useCallback(async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please grant photo access in Settings to change your profile picture.'
        );
        return;
      }

      setPhotoUploading(true);

      // SPRINT 3.2 FIX: MediaTypeOptions is deprecated — use MediaType
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images, // was MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled) {
        setPhotoUploading(false);
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.base64) {
        Alert.alert('Photo error', 'Could not load that photo. Try a different one.');
        setPhotoUploading(false);
        return;
      }

      // Check size — base64 string is ~1.37x the binary size
      if (asset.base64.length > MAX_PHOTO_BYTES * 1.4) {
        Alert.alert(
          'Photo too large',
          'Please pick a smaller photo (under 200KB) or one with lower resolution.'
        );
        setPhotoUploading(false);
        return;
      }

      const dataUrl = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;

      // Save to RTDB immediately (not waiting for the Save button) so the
      // user can see the change in real-time and the photo persists even
      // if they cancel the name edit.
      await saveProfilePhoto(userId, dataUrl);
      if (!isMountedRef.current) return;

      setPhotoDataUrl(dataUrl);
      setPhotoUploading(false);
    } catch (err) {
      console.error('Photo picker failed:', err);
      Alert.alert('Photo error', err?.message || 'Could not pick photo.');
      setPhotoUploading(false);
    }
  }, [userId]);

  const handleRemovePhoto = useCallback(async () => {
    Alert.alert(
      'Remove photo?',
      'Your profile photo will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfilePhoto(userId);
              if (!isMountedRef.current) return;
              setPhotoDataUrl(null);
            } catch (err) {
              Alert.alert('Could not remove photo', err?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  }, [userId]);

  const handleSave = useCallback(async () => {
    if (!firstName.trim()) {
      Alert.alert('First name required', 'Please enter your first name.');
      return;
    }

    const fullName = `${firstName.trim()}${lastName.trim() ? ' ' + lastName.trim() : ''}`;

    setSaving(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        Alert.alert('Not signed in', 'Please sign in again to edit your profile.');
        return;
      }

      // SPRINT 3.2 FIX: only update displayName in Firebase Auth (no photoURL).
      // Photo is stored separately in RTDB via profilePhotoService.
      await updateProfile(currentUser, {
        displayName: fullName,
        // NOTE: intentionally NOT setting photoURL here — Firebase Auth's
        // photoURL field has a 1024 char limit and rejects base64 data URLs.
      });

      // Reload to refresh the cached user object
      await reload(currentUser);

      Alert.alert(
        'Profile updated',
        'Your changes have been saved.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Profile update failed:', err);
      Alert.alert(
        'Could not save profile',
        err?.message || 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName]);

  const isMountedRef = React.useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const initial = (firstName || 'U').charAt(0).toUpperCase();
  const displayPhoto = photoDataUrl || photoURL;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        enabled
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  {photoLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.avatarText}>{initial}</Text>
                  )}
                </View>
              )}

              {photoUploading ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : null}
            </View>

            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePickPhoto}
                disabled={photoUploading}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={14} color={Colors.primary} />
                <Text style={styles.photoButtonText}>
                  {displayPhoto ? 'Change photo' : 'Upload photo'}
                </Text>
              </TouchableOpacity>

              {displayPhoto ? (
                <TouchableOpacity
                  style={[styles.photoButton, styles.photoButtonDanger]}
                  onPress={handleRemovePhoto}
                  disabled={photoUploading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.error} />
                  <Text style={[styles.photoButtonText, styles.photoButtonTextDanger]}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.photoHint}>
              Optional — adds a personal touch to your account.
              {'\n'}Syncs across your devices.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Personal details</Text>

            <View style={styles.fieldRow}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <FormField
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Zeeshan"
                  required
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Ali"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <FormField
              label="Email"
              value={email}
              onChangeText={() => {}} // no-op — read-only
              placeholder="zeeshan@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              helperText="Email cannot be changed from the app. Contact support to update."
            />

            {/* Email is read-only */}
            <View style={styles.disabledNote}>
              <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.disabledNoteText}>Email is managed by Firebase Auth</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer with Save button */}
        <View style={styles.footer}>
          <Button
            label="Cancel"
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            style={{ flex: 1 }}
          />
          <Button
            label={saving ? 'Saving…' : 'Save changes'}
            icon={saving ? undefined : 'checkmark-outline'}
            iconPosition="left"
            variant="primary"
            size="md"
            disabled={saving}
            onPress={handleSave}
            style={{ flex: 1.5 }}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    ...Shadows.medium,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: Colors.gradientStart,
    backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
  },
  photoButtonDanger: {
    backgroundColor: Colors.errorBg,
  },
  photoButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  photoButtonTextDanger: {
    color: Colors.error,
  },
  photoHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: 0.2,
  },
  fieldRow: {
    flexDirection: 'row',
  },
  disabledNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  disabledNoteText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
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
