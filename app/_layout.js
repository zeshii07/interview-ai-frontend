import { useEffect, useRef, useState } from 'react';
import { Stack as NativeStack, router } from 'expo-router';
// Pure-JS fallback stack — doesn't require expo-glass-effect or react-native-screens
// native module. Used only if the native Stack fails to load.
import { Stack as JSStack } from 'expo-router/js-stack';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Appearance,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/theme';
import { clearSignedOutLocalState, onAuthChange } from '../services/authService';
import { checkOnboardingSeen, loadLastWorkingRoute } from '../utils/storage';

import LoginScreen from './(auth)/login';
import OnboardingScreen from './(auth)/onboarding';

/**
 * Defensive Stack resolver.
 *
 * In SDK 57, `import { Stack } from 'expo-router'` goes through:
 *
 *   expo-router/build/index.js
 *     └─> ./exports (deprecated getter)
 *           └─> ./stack
 *                 └─> build/layouts/Stack.js
 *                       └─> StackClient.js
 *                             └─> createNativeStackNavigator()  ← runs at module-eval
 *                                   └─> require("expo-glass-effect")
 *                                         + isLiquidGlassAvailable()  ← runs at eval
 *
 * If `expo-glass-effect` is missing or its module-eval throws, the entire
 * chain fails and `Stack` ends up `undefined`. That's what produces:
 *
 *   ERROR [TypeError: undefined is not a function]
 *   Code: _layout.js
 *   > 2 | import { Stack, router } from 'expo-router';
 *
 * The fix has two parts:
 *   1. Add `expo-glass-effect` (and other missing peer deps) to package.json.
 *      See FIXES.md for the full list.
 *   2. Use a defensive resolver here so the app still boots with the pure-JS
 *      Stack (`expo-router/js-stack`) if the native Stack is unavailable.
 *      The JS Stack doesn't need `expo-glass-effect` or the
 *      `react-native-screens` native module — it renders plain Views.
 *
 * Once `npx expo install --fix` + `npx expo start -c` is run with the patched
 * package.json, `NativeStack` will be a proper function and the fallback
 * will never trigger.
 */
const Stack = typeof NativeStack === 'function' ? NativeStack : JSStack;

Appearance.setColorScheme('light');

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Could not prevent splash auto-hide:', error);
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);

  const [storageReady, setStorageReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState(null);
  const [startupError, setStartupError] = useState(null);
  const [lastWorkingRoute, setLastWorkingRoute] = useState(null);
  const [routeRestoreHandled, setRouteRestoreHandled] = useState(false);
  const initialAuthHandled = useRef(false);
  const restoreEligible = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadStoredState = async () => {
      try {
        const [seen, savedRoute] = await Promise.all([
          checkOnboardingSeen(),
          loadLastWorkingRoute(),
        ]);
        Appearance.setColorScheme('light');

        if (mounted) {
          setShowOnboarding(!seen);
          setLastWorkingRoute(savedRoute);
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);

        if (mounted) {
          setShowOnboarding(false);
          setStartupError('Some saved settings could not be loaded.');
        }
      } finally {
        if (mounted) {
          setStorageReady(true);
        }
      }
    };

    loadStoredState();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let unsubscribe;

    try {
      unsubscribe = onAuthChange(async (currentUser) => {
        if (!initialAuthHandled.current) {
          initialAuthHandled.current = true;
          restoreEligible.current = Boolean(currentUser);
        }
        if (!currentUser) {
          await clearSignedOutLocalState();
          setLastWorkingRoute(null);
        }
        setUser(currentUser);
        setAuthReady(true);
      });
    } catch (error) {
      console.error('Firebase authentication initialization failed:', error);
      setStartupError('Authentication could not be initialized.');
      setAuthReady(true);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const fontReady = fontsLoaded || Boolean(fontError);
  const appIsReady = fontReady && storageReady && authReady;

  useEffect(() => {
    if (!appIsReady) {
      return;
    }

    SplashScreen.hideAsync().catch((error) => {
      console.warn('Could not hide splash screen:', error);
    });
  }, [appIsReady]);

  useEffect(() => {
    if (!appIsReady || !user || routeRestoreHandled || !restoreEligible.current) return;

    setRouteRestoreHandled(true);
    if (lastWorkingRoute) {
      router.replace(lastWorkingRoute);
    }
  }, [appIsReady, lastWorkingRoute, routeRestoreHandled, user]);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Starting Hirely…
        </Text>
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <>
        <StatusBar
          style="dark"
          backgroundColor={Colors.bgPrimary}
        />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar
          style="dark"
          backgroundColor={Colors.bgPrimary}
        />

        {startupError ? (
          <Text style={styles.errorText}>
            {startupError}
          </Text>
        ) : null}

        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar
        style="dark"
        backgroundColor={Colors.bgPrimary}
      />

      <Stack
        key="light"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.bgPrimary,
          },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.bgPrimary,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="interview/session"
          options={{
            title: 'AI Interview',
            headerStyle: { backgroundColor: Colors.bgPrimary },
            headerTintColor: Colors.textPrimary,
            contentStyle: { backgroundColor: Colors.bgPrimary },
          }}
        />

        <Stack.Screen
          name="resume/analyze"
          options={{
            title: 'Resume AI',
          }}
        />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="settings/about" options={{ title: 'About Hirely' }} />
        <Stack.Screen name="settings/delete-account" options={{ title: 'Account & Data' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },

  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },

  errorText: {
    color: Colors.error,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 16,
    paddingTop: 8,
    textAlign: 'center',
  },
});
