 import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';

export default function RootLayout() {
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