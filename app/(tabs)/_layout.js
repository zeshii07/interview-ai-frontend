import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontSizes } from '../../constants/theme';
import useInterviewStore from '../../store/interviewStore';
import { getCurrentUser } from '../../services/authService';

/**
 * Tab bar for the 5 primary tabs (Home, Tools, Progress, Profile, Jobs).
 *
 * EDGE-TO-EDGE NOTE (SDK 58 / RN 0.88): edge-to-edge is enforced on
 * Android, so the system gesture/nav bar overlaps app content. The tab
 * bar therefore must NOT set a custom `height` (or position/padding) in
 * `tabBarStyle`: when an explicit height is present, React Navigation
 * uses it as the TOTAL height and skips adding the bottom safe-area
 * inset — the icons/labels end up hidden behind the gesture area and the
 * bar appears missing entirely (no way to switch tabs).
 *
 * The reliable pattern (and what this file follows) is to override only
 * VISUAL keys — background, top hairline, shadow, label typography — and
 * let @react-navigation/bottom-tabs compute the height +
 * `insets.bottom` itself. That renders correctly on gesture nav,
 * 3-button nav, and iOS.
 */
export default function TabLayout() {
  const initializeApp = useInterviewStore((state) => state.initializeApp);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const initialize = async () => {
      try {
        await Promise.resolve(initializeApp(getCurrentUser()?.uid));
      } catch (error) {
        console.error('Interview store initialization failed:', error);
      }
    };
    initialize();
    return () => { isMounted.current = false; };
  }, [initializeApp]);

  return (
    <Tabs
      screenOptions={{
        // Attached (non-floating) bar on a solid card background with a
        // hairline top border and a soft shadow. No height / position /
        // padding overrides — see the note above.
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          // Visual-only shadow keys; these do not affect layout.
          elevation: 8,
          shadowColor: '#0F172A',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,

        // Compact labels — small enough to fit the default tab bar
        // height without clipping on any device.
        tabBarLabelStyle: {
          fontSize: FontSizes.xs, // 11pt
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.2,
        },

        // Per-tab headers (Tools/Progress/Profile/Jobs show one).
        headerStyle: { backgroundColor: Colors.bgPrimary },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
