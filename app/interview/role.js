import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import { ROLES } from '../../constants/config';
import useInterviewFlowStore from '../../store/interviewFlowStore';
import GradientHero from '../../components/ui/GradientHero';
import SelectCard from '../../components/ui/SelectCard';
import Button from '../../components/ui/Button';

export default function RoleSelectionScreen() {
  const role = useInterviewFlowStore((s) => s.role);
  const setRole = useInterviewFlowStore((s) => s.setRole);
  const [search, setSearch] = React.useState('');

  const filteredRoles = ROLES.filter((r) =>
    r.value.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (!role) return;
    router.push('/interview/preferences');
  };

  return (
    <View style={styles.screen}>
      <GradientHero
        title="Select your role"
        subtitle="We'll tailor questions to your role"
        icon="arrow-back-outline"
        onIconPress={() => router.back()}
      />

      <View style={styles.searchWrap}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roles…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{filteredRoles.length} roles available</Text>
        <View style={styles.cardsWrap}>
          {filteredRoles.map((r) => (
            <SelectCard
              key={r.value}
              title={r.value}
              icon={r.icon}
              selected={role === r.value}
              onPress={() => setRole(r.value)}
            />
          ))}
        </View>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue"
          icon="arrow-forward"
          iconPosition="right"
          size="lg"
          fullWidth
          disabled={!role}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  searchWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    padding: 0,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  cardsWrap: {
    gap: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
