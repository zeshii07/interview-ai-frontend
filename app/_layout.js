// import { useState, useEffect } from 'react';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import { View, ActivityIndicator } from 'react-native';
// import { useFonts } from 'expo-font';
// import * as SplashScreen from 'expo-splash-screen';
// import { Colors } from '../constants/theme';
// import { checkOnboardingSeen } from '../utils/storage';
// import OnboardingScreen from './(auth)/onboarding';

// // Keep the native splash screen visible while we load assets
// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const [appIsReady, setAppIsReady] = useState(false);
//   const [showOnboarding, setShowOnboarding] = useState(false);

//   // 1. EXPLICITLY load the Ionicons font
//   const [fontsLoaded, fontError] = useFonts({
//     Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
//   });

//   // 2. Once font is loaded (or fails), check storage
//   useEffect(() => {
//     async function prepare() {
//       try {
//         // Check if user saw onboarding
//         const seen = await checkOnboardingSeen();
//         setShowOnboarding(!seen);
//       } catch (e) {
//         console.warn('Storage error:', e);
//       } finally {
//         // Tell the app we are completely ready to render UI
//         setAppIsReady(true);
//       }
//     }

//     // Only prepare if the font is loaded (or if it failed to load, we proceed anyway so it doesn't hang forever)
//     if (fontsLoaded || fontError) {
//       prepare();
//     }
//   }, [fontsLoaded, fontError]);

//   // 3. Hide the splash screen once we are ready
//   useEffect(() => {
//     if (appIsReady) {
//       SplashScreen.hideAsync();
//     }
//   }, [appIsReady]);

//   // 4. Show a simple dark loader while preparing
//   if (!fontsLoaded && !fontError) {
//     return (
//       <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color={Colors.primary} />
//       </View>
//     );
//   }

//   if (!appIsReady) {
//     return (
//       <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color={Colors.primary} />
//       </View>
//     );
//   }

//   // --- RENDER APP ---

//   // Show Onboarding if not seen
//   if (showOnboarding) {
//     return (
//       <>
//         <StatusBar style="light" backgroundColor={Colors.bgPrimary} />
//         <OnboardingScreen />
//       </>
//     );
//   }

//   // Show Main App
//   return (
//     <>
//       <StatusBar style="light" backgroundColor={Colors.bgPrimary} />
//       <Stack
//         screenOptions={{
//           headerStyle: {
//             backgroundColor: Colors.bgPrimary,
//           },
//           headerTintColor: Colors.textPrimary,
//           headerShadowVisible: false,
//           contentStyle: {
//             backgroundColor: Colors.bgPrimary,
//           },
//         }}
//       >
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen 
//           name="interview/session" 
//           options={{ 
//             title: 'Interview Session',
//             headerBackTitle: 'Back',
//           }} 
//         />
//         <Stack.Screen 
//           name="resume/analyze" 
//           options={{ 
//             title: 'Resume Analyzer',
//             headerBackTitle: 'Back',
//           }} 
//         />
//       </Stack>
//     </>
//   );
// }

import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../constants/theme';
import { onAuthChange } from '../services/authService';
import { checkOnboardingSeen } from '../utils/storage';
import LoginScreen from './(auth)/login';
import OnboardingScreen from './(auth)/onboarding';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState(null); // NULL = not logged in

  const [fontsLoaded, fontError] = useFonts({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        const seen = await checkOnboardingSeen();
        setShowOnboarding(!seen);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    if (fontsLoaded || fontError) {
      prepare();
    }
  }, [fontsLoaded, fontError]);

  // LISTEN FOR FIREBASE AUTH CHANGES
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser); // Updates state if user logs in or out
    });
    return unsubscribe; // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Loading State
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // --- ROUTING LOGIC ---

  // 1. Show Onboarding if not seen
  if (showOnboarding) {
    return (
      <>
        <StatusBar style="light" backgroundColor={Colors.bgPrimary} />
        <OnboardingScreen />
      </>
    );
  }

  // 2. Show Login if NO USER is found in Firebase
  if (!user) {
    return (
      <>
        <StatusBar style="light" backgroundColor={Colors.bgPrimary} />
        <LoginScreen />
      </>
    );
  }

  // 3. Show Main App if USER IS logged in
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.bgPrimary} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bgPrimary },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bgPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="interview/session" options={{ title: 'Session', headerBackTitle: 'Back' }} />
        <Stack.Screen name="resume/analyze" options={{ title: 'Resume AI', headerBackTitle: 'Back' }} />
      </Stack>
    </>
  );
}