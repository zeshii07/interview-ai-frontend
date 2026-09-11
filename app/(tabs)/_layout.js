import { useEffect } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// Use the direct (non-deprecated) path. In SDK 57, `import { Tabs } from 'expo-router'`
// goes through a deprecated getter; `expo-router/js-tabs` loads the same component
// directly from build/layouts/Tabs.js.
import { Tabs as NativeTabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '../../constants/theme';
import useInterviewStore from '../../store/interviewStore';
import { getCurrentUser } from '../../services/authService';

/**
 * Defensive Tabs resolver.
 *
 * Same pattern as the root _layout.js: if the native Tabs fails to load
 * (e.g., because react-native-screens or react-native-reanimated is still
 * mismatched), fall back to a hand-rolled bottom bar so the app still boots
 * with a visible error state instead of crashing.
 *
 * After running the patched package.json + `npx expo install --fix` +
 * `npx expo start -c`, NativeTabs will be a proper function and the
 * fallback will never trigger.
 */
const Tabs = typeof NativeTabs === 'function' ? NativeTabs : null;

export default function TabLayout() {
  const initializeApp = useInterviewStore(
    (state) => state.initializeApp
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.resolve(initializeApp(getCurrentUser()?.uid));
      } catch (error) {
        console.error(
          'Interview store initialization failed:',
          error
        );
      }
    };

    initialize();
  }, [initializeApp]);

  if (!Tabs) {
    return <FallbackTabLayout />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: Spacing.sm,
          paddingBottom: Spacing.sm,
          height: Platform.OS === 'ios' ? 84 : 64,
        },

        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        headerStyle: {
          backgroundColor: Colors.bgPrimary,
        },

        headerTintColor: Colors.textPrimary,

        headerTitleStyle: {
          fontWeight: '700',
        },

        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                focused
                  ? 'chatbubble'
                  : 'chatbubble-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="questions"
        options={{
          title: 'Questions',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function FallbackTabLayout() {
  const fallbackScreens = [
    { name: 'index',    title: 'Home',     icon: 'home-outline' },
    { name: 'practice', title: 'Practice', icon: 'chatbubble-outline' },
    { name: 'questions',title: 'Questions',icon: 'list-outline' },
    { name: 'history',  title: 'History',   icon: 'time-outline' },
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
          <TouchableOpacity
            key={s.name}
            style={fallbackStyles.tab}
            disabled
          >
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
    paddingHorizontal: Spacing.l,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.s,
  },
  body: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, marginTop: 2, color: Colors.textMuted },
});
