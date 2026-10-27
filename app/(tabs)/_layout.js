import { useEffect, useRef } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs as NativeTabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewStore from '../../store/interviewStore';
import { getCurrentUser } from '../../services/authService';

// Defensive resolver — falls back to a hand-rolled tab bar if the native
// Tabs fails to load (e.g. react-native-screens native module missing).
const Tabs = typeof NativeTabs === 'function' ? NativeTabs : null;

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

  if (!Tabs) return <FallbackTabLayout />;

  return (
    <Tabs
      screenOptions={{
        // IMPROVED (Sprint 3): Taller tab bar with bigger touch targets,
        // bigger labels, and more padding so labels are clearly visible
        // above the icons. Previously the labels were too small (11pt) and
        // positioned too close to the icons, making them hard to see.
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

        // IMPROVED: bigger label font + more visible weight + better spacing
        tabBarLabelStyle: {
          fontSize: FontSizes.sm - 1, // 12pt — readable
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.2,
        },

        // IMPROVED: icon size 24 instead of default 22 for better tap target
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

function FallbackTabLayout() {
  const fallbackScreens = [
    { name: 'index', title: 'Home', icon: 'home-outline' },
    { name: 'tools', title: 'Tools', icon: 'grid-outline' },
    { name: 'progress', title: 'Progress', icon: 'trending-up-outline' },
    { name: 'profile', title: 'Profile', icon: 'person-outline' },
    { name: 'jobs', title: 'Jobs', icon: 'briefcase-outline' },
  ];

  return (
    <View style={fallbackStyles.container}>
      <View style={fallbackStyles.content}>
        <Text style={fallbackStyles.title}>Tab layout fallback mode</Text>
        <Text style={fallbackStyles.body}>
          expo-router&apos;s `Tabs` is undefined. Run:{'\n\n'}
          1. `npx expo install --fix`{'\n'}
          2. `npx expo start -c`{'\n\n'}
          See FIXES.md for the full diagnostic.
        </Text>
      </View>
      <View style={fallbackStyles.tabBar}>
        {fallbackScreens.map((s) => (
          <TouchableOpacity key={s.name} style={fallbackStyles.tab} disabled>
            <Ionicons name={s.icon} size={22} color={Colors.textMuted} />
            <Text style={fallbackStyles.tabLabel}>{s.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const fallbackStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    height: 76,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, marginTop: 4, color: Colors.textMuted, fontWeight: '700' },
});
