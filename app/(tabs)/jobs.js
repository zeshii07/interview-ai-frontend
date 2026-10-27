import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { Colors } from '../../constants/theme';
import JobsScreen from '../jobs/index';

/**
 * Tab screen for "Jobs" — wraps the redesigned JobsScreen and adds a
 * "Saved jobs" link in the header.
 */
export default function JobsTabScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Find Jobs',
          headerStyle: { backgroundColor: Colors.bgPrimary },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/jobs/saved')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Saved jobs"
              accessibilityRole="button"
            >
              <Ionicons name="bookmarks-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <JobsScreen />
    </>
  );
}
