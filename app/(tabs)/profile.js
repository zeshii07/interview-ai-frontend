import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import { getCurrentUser, logoutUser, onProfileChange } from '../../services/authService';
import { subscribeProfilePhoto } from '../../services/profilePhotoService';
import Button from '../../components/ui/Button';

export default function ProfileScreen() {
  // SPRINT 3.2: subscribe to profile changes (name) + photo (RTDB) so the
  // Profile tab updates immediately when the user edits their profile on
  // the Edit Profile screen.
  const [user, setUser] = React.useState(getCurrentUser());
  const [profilePhoto, setProfilePhoto] = React.useState(null);

  React.useEffect(() => {
    const unsubProfile = onProfileChange((u) => setUser(u));

    // Subscribe to photo changes in RTDB. We pass the uid at subscription
    // time; if the user logs out, the subscription returns no-op.
    let unsubPhoto = () => {};
    if (user?.uid) {
      unsubPhoto = subscribeProfilePhoto(user.uid, (photo) => {
        setProfilePhoto(photo);
      });
    }

    return () => {
      unsubProfile();
      unsubPhoto();
    };
  }, [user?.uid]);

  const displayName = user?.displayName || 'User';
  const email = user?.email || '';
  const photoURL = profilePhoto; // from RTDB, not Firebase Auth
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          const result = await logoutUser();
          if (!result.success) {
            Alert.alert('Sign out failed', result.error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit profile', route: '/settings/edit-profile' },
    { icon: 'document-text-outline', label: 'Resume management', route: '/resume/generator' },
    { icon: 'notifications-outline', label: 'Notifications', route: '/settings/index', badge: 'Coming soon' },
    { icon: 'moon-outline', label: 'Dark mode', route: '/settings/index', badge: 'Coming soon' },
    { icon: 'shield-checkmark-outline', label: 'Privacy & security', route: '/settings/index' },
    { icon: 'information-circle-outline', label: 'About Hirely', route: '/settings/about' },
    { icon: 'trash-outline', label: 'Delete account', route: '/settings/delete-account', danger: true },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{email}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/settings/edit-profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Plan card */}
      <View style={styles.planCard}>
        <View style={styles.planLeft}>
          <Ionicons name="rocket-outline" size={18} color={Colors.primary} />
          <View>
            <Text style={styles.planTitle}>Free plan</Text>
            <Text style={styles.planSubtitle}>Upgrade for unlimited interviews</Text>
          </View>
        </View>
        <Button label="Upgrade" variant="secondary" size="sm" onPress={() => {}} />
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.menuItem,
              idx < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={() => item.route && router.push(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={item.icon}
                size={18}
                color={item.danger ? Colors.error : Colors.textSecondary}
              />
              <Text style={[styles.menuItemText, item.danger && styles.menuItemTextDanger]}>
                {item.label}
              </Text>
            </View>
            {item.badge ? (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>{item.badge}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Button
        label="Sign out"
        variant="ghost"
        size="md"
        icon="log-out-outline"
        iconPosition="left"
        onPress={handleLogout}
        style={{ marginTop: Spacing.lg, marginHorizontal: Spacing.md }}
      />

      <Text style={styles.versionText}>Hirely v1.1.0</Text>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gradientStart,
    backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarText: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.accentBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  planTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  planSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  menuCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: Colors.error,
  },
  comingSoonBadge: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  versionText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
