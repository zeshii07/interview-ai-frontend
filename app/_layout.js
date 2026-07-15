import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
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
import { onAuthChange } from '../services/authService';
import { checkOnboardingSeen } from '../utils/storage';

import LoginScreen from './(auth)/login';
import OnboardingScreen from './(auth)/onboarding';

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

  useEffect(() => {
    let mounted = true;

    const loadStoredState = async () => {
      try {
        const seen = await checkOnboardingSeen();
        Appearance.setColorScheme('light');

        if (mounted) {
          setShowOnboarding(!seen);
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);

        if (mounted) {
          // Do not crash the whole application because storage failed.
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
      unsubscribe = onAuthChange((currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
      });
    } catch (error) {
      console.error('Firebase authentication initialization failed:', error);
      setStartupError('Authentication could not be initialized.');
      setAuthReady(true);
    }

    // Prevent permanent splash screen if Firebase does not respond.
    const fallbackTimer = setTimeout(() => {
      setAuthReady(true);
    }, 8000);

    return () => {
      clearTimeout(fallbackTimer);

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
        <OnboardingScreen />
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
