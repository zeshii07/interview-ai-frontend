import { useEffect, useRef, useState } from 'react';
// NOTE: `Stack` and `router` are both imported from the main 'expo-router'
// entry. Earlier patches imported them from 'expo-router/stack' /
// 'expo-router/js-stack' subpaths — those resolve, but they are non-standard
// and one of them ('expo-router/stack') does not export `router`, which is
// what caused the original "router is undefined" crash. The canonical import
// is the safest and works across SDK versions.
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Appearance,
  StyleSheet,
  Text,
  View,
  LogBox,
} from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

import ErrorBoundary from '../components/ErrorBoundary';
import { Colors } from '../constants/theme';
import { clearSignedOutLocalState, onAuthChange } from '../services/authService';
import { checkOnboardingSeen, loadLastWorkingRoute } from '../utils/storage';

import LoginScreen from './(auth)/login';
import OnboardingScreen from './(auth)/onboarding';

// SPRINT 3: Suppress the React 19 + expo-router useLinking warning.
// This is a known non-fatal warning that fires on app startup because
// expo-router's `useLinking` hook resolves the initial URL via a Promise
// that can complete before the component finishes mounting. React 19
// elevated this from a console.warn to a red error in dev mode.
// The app still works — we just suppress the noise.
LogBox.ignoreLogs([
  "Can't perform a React state update on a component that hasn't mounted yet",
  'Setting a timer for a long period',
  'AsyncStorage has been extracted',
  'ViewPropTypes will be removed',
  "[object Object] is not a valid icon name for family",
]);

Appearance.setColorScheme('light');

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Could not prevent splash auto-hide:', error);
});

// Wrap the whole layout in the ErrorBoundary so that a render error in any
// screen shows a friendly "Something went wrong" card with a Reload button
// instead of hard-crashing the app (in release builds an uncaught render
// error kills the process immediately).
function RootLayout() {
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
  const isMounted = useRef(true);

  // Storage / onboarding bootstrap
  useEffect(() => {
    isMounted.current = true;

    const loadStoredState = async () => {
      try {
        const [seen, savedRoute] = await Promise.all([
          checkOnboardingSeen(),
          loadLastWorkingRoute(),
        ]);
        Appearance.setColorScheme('light');

        if (isMounted.current) {
          setShowOnboarding(!seen);
          setLastWorkingRoute(savedRoute);
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);

        if (isMounted.current) {
          setShowOnboarding(false);
          setStartupError('Some saved settings could not be loaded.');
        }
      } finally {
        if (isMounted.current) {
          setStorageReady(true);
        }
      }
    };

    loadStoredState();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Auth bootstrap — unsubscribe on unmount (memory leak fix)
  useEffect(() => {
    let unsubscribe;

    try {
      unsubscribe = onAuthChange(async (currentUser) => {
        if (!isMounted.current) return;

        if (!initialAuthHandled.current) {
          initialAuthHandled.current = true;
          restoreEligible.current = Boolean(currentUser);
        }
        if (!currentUser) {
          await clearSignedOutLocalState();
          if (isMounted.current) setLastWorkingRoute(null);
        }
        if (isMounted.current) {
          setUser(currentUser);
          setAuthReady(true);
        }
      });
    } catch (error) {
      console.error('Firebase authentication initialization failed:', error);
      if (isMounted.current) {
        setStartupError('Authentication could not be initialized.');
        setAuthReady(true);
      }
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

    // BUGFIX: defensive guard — if router is somehow still undefined (e.g.
    // expo-router failed to load entirely), fall back to no-op instead of
    // crashing the whole app on startup.
    if (lastWorkingRoute && typeof router !== 'undefined' && typeof router.replace === 'function') {
      // Defer the replace to the next animation frame so it doesn't run
      // during the render phase (which can trigger React 19's "state
      // update on unmounted component" warning).
      requestAnimationFrame(() => {
        try {
          router.replace(lastWorkingRoute);
        } catch (err) {
          console.warn('Failed to restore last working route:', err);
        }
      });
    }
  }, [appIsReady, lastWorkingRoute, routeRestoreHandled, user]);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Starting Hirely…</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <>
        <StatusBar style="dark" />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        {startupError ? <Text style={styles.errorText}>{startupError}</Text> : null}
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />

      <Stack
        key="light"
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bgPrimary },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bgPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="interview/session"
          options={{
            title: 'AI Interview',
            headerStyle: { backgroundColor: Colors.bgPrimary },
            headerTintColor: Colors.textPrimary,
            contentStyle: { backgroundColor: Colors.bgPrimary },
          }}
        />
        {/* Sprint 2 — Interview flow routes */}
        <Stack.Screen name="interview/type" options={{ title: 'Choose Interview Type', headerShown: false }} />
        <Stack.Screen name="interview/role" options={{ title: 'Select Role', headerShown: false }} />
        <Stack.Screen name="interview/preferences" options={{ title: 'Preferences', headerShown: false }} />
        <Stack.Screen name="interview/practice" options={{ title: 'Practice', headerShown: false }} />
        <Stack.Screen name="interview/mock-start" options={{ title: 'Mock Interview', headerShown: false }} />
        <Stack.Screen name="interview/mock-progress" options={{ title: 'Mock Interview', headerShown: false }} />
        <Stack.Screen name="interview/results" options={{ title: 'Results', headerShown: false }} />
        <Stack.Screen name="interview/dashboard" options={{ title: 'Dashboard', headerShown: false }} />
        <Stack.Screen name="interview/report" options={{ title: 'Detailed Report', headerShown: false }} />
        <Stack.Screen name="interview/celebration" options={{ title: 'Congratulations', headerShown: false }} />
        <Stack.Screen name="interview/history" options={{ title: 'History', headerShown: false }} />
        <Stack.Screen name="interview/settings" options={{ title: 'Interview Settings', headerShown: false }} />
        <Stack.Screen name="resume/analyze" options={{ title: 'Resume AI' }} />
        <Stack.Screen name="resume/generator" options={{ title: 'Resume Generator' }} />
        <Stack.Screen name="resume/preview" options={{ title: 'Resume Preview' }} />
        <Stack.Screen name="questions" options={{ title: 'Question Bank' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="settings/about" options={{ title: 'About Hirely' }} />
        <Stack.Screen name="settings/delete-account" options={{ title: 'Account & Data' }} />
        <Stack.Screen name="settings/edit-profile" options={{ title: 'Edit Profile', headerShown: false }} />
        <Stack.Screen name="jobs/index" options={{ title: 'Find Jobs' }} />
        <Stack.Screen name="jobs/detail" options={{ title: 'Job Details' }} />
        <Stack.Screen name="jobs/saved" options={{ title: 'Saved Jobs' }} />
      </Stack>
    </>
  );
}

export default function RootLayoutWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <RootLayout />
    </ErrorBoundary>
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
