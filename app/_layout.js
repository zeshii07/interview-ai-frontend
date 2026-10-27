import { useEffect, useRef, useState } from 'react';
import { Stack as NativeStack, router } from 'expo-router/stack';
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

// Defensive resolver — prefer native Stack, fall back to JS Stack.
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
  const isMounted = useRef(true);

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
        if (isMounted.current) setStorageReady(true);
      }
    };
    loadStoredState();
    return () => { isMounted.current = false; };
  }, []);

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
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const fontReady = fontsLoaded || Boolean(fontError);
  const appIsReady = fontReady && storageReady && authReady;

  useEffect(() => {
    if (!appIsReady) return;
    SplashScreen.hideAsync().catch((error) => {
      console.warn('Could not hide splash screen:', error);
    });
  }, [appIsReady]);

  useEffect(() => {
    if (!appIsReady || !user || routeRestoreHandled || !restoreEligible.current) return;
    setRouteRestoreHandled(true);
    if (lastWorkingRoute) router.replace(lastWorkingRoute);
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
        <StatusBar style="dark" backgroundColor={Colors.bgPrimary} />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" backgroundColor={Colors.bgPrimary} />
        {startupError ? <Text style={styles.errorText}>{startupError}</Text> : null}
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.bgPrimary} />
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
        <Stack.Screen name="jobs/index" options={{ title: 'Find Jobs' }} />
        <Stack.Screen name="jobs/detail" options={{ title: 'Job Details' }} />
        <Stack.Screen name="jobs/saved" options={{ title: 'Saved Jobs' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
  errorText: {
    color: Colors.error, backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 16, paddingTop: 8, textAlign: 'center',
  },
});
