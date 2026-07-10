//  import { Tabs } from 'expo-router';
// import { useEffect } from 'react';
// import { Colors, Spacing } from '../../constants/theme';
// import { Ionicons } from '@expo/vector-icons';
// import useInterviewStore from '../../store/interviewStore';

// export default function TabLayout() {
//   const initializeApp = useInterviewStore((state) => state.initializeApp);

//   useEffect(() => {
//     initializeApp();
//   }, []);

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarStyle: {
//           backgroundColor: Colors.backgroundCard,
//           borderTopColor: Colors.border,
//           borderTopWidth: 1,
//           paddingVertical: Spacing.sm,
//           height: 60,
//         },
//         tabBarActiveTintColor: Colors.primary,
//         tabBarInactiveTintColor: Colors.textMuted,
//         tabBarLabelStyle: {
//           fontSize: 11,
//           fontWeight: '500',
//         },
//         headerStyle: {
//           backgroundColor: Colors.background,
//         },
//         headerTintColor: Colors.text,
//         headerShadowVisible: false,
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="home-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="practice"
//         options={{
//           title: 'Practice',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="chatbubble-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="questions"
//         options={{
//           title: 'Questions',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="list-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="history"
//         options={{
//           title: 'History',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="time-outline" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }


import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import useInterviewStore from '../../store/interviewStore';

export default function TabLayout() {
  const initializeApp = useInterviewStore((state) => state.initializeApp);

  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: Spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? Spacing.sm : Spacing.sm,
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: 'Questions',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}