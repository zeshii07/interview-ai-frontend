import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Colors } from '../constants/theme';
import { checkOnboardingSeen } from '../utils/storage';
import OnboardingScreen from './(auth)/onboarding';

// Prevent the native splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // 1. Load the font used by @expo/vector-icons (Crucial for standalone builds!)
        await Font.loadAsync({
          ...require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
        });

        // 2. Check if user has seen onboarding
        const seen = await checkOnboardingSeen();
        setShowOnboarding(!seen);
      } catch (error) {
        console.warn('Error loading app assets:', error);
      } finally {
        // 3. Tell the app we are ready to render
        setIsReady(true);
        // 4. Hide the native splash screen safely
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  // Show a simple loader while assets load
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // If user hasn't seen onboarding, show it
  if (showOnboarding) {
    return (
      <>
        <StatusBar style="light" backgroundColor={Colors.bgPrimary} />
        <OnboardingScreen />
      </>
    );
  }

  // Otherwise, show the normal app
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.bgPrimary} />
      <Stack
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="interview/session" 
          options={{ 
            title: 'Interview Session',
            headerBackTitle: 'Back',
          }} 
        />
        <Stack.Screen 
          name="resume/analyze" 
          options={{ 
            title: 'Resume Analyzer',
            headerBackTitle: 'Back',
          }} 
        />
      </Stack>
    </>
  );
}