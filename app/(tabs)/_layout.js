import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Shadows } from '../../constants/theme';
import useInterviewStore from '../../store/interviewStore';
import { getCurrentUser } from '../../services/authService';

/**
 * Tab bar for the 5 primary tabs (Home, Tools, Progress, Profile, Jobs).
 *
 * NOTE: `Tabs` is imported from the main 'expo-router' entry — the canonical
 * import. The old code imported from 'expo-router/js-tabs' and rendered a
 * dead-end "fallback mode" screen if the import came back undefined; that
 * fallback showed users an error page instead of the app. If Tabs ever fails
 * to load, the ErrorBoundary in app/_layout.js now handles it properly.
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
        // Taller tab bar with bigger touch targets, bigger labels, and more
        // padding so labels are clearly visible above the icons.
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: Spacing.sm + 2,
          paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.sm + 4,
          height: Platform.OS === 'ios' ? 92 : 76,
          ...Shadows.small,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,

        tabBarLabelStyle: {
          fontSize: FontSizes.sm - 1, // 12pt — readable
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.2,
        },

        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },

        // Hide the header on the tab level — each tab defines its own header
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
