import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import { checkOnboardingSeen } from '../utils/storage';
import OnboardingScreen from './(auth)/onboarding';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const prepare = async () => {
      const seen = await checkOnboardingSeen();
      setShowOnboarding(!seen);
      setIsReady(true);
    };
    prepare();
  }, []);

  // Show a quick loading screen while checking storage
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // If user hasn't seen onboarding, show it
  if (showOnboarding) {
    return (
      <>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <OnboardingScreen />
      </>
    );
  }

  // Otherwise, show the normal app
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.background,
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