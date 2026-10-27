import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import SectionHeader from '../../components/ui/SectionHeader';
import ToolCard from '../../components/ui/ToolCard';
import Badge from '../../components/ui/Badge';

const ALL_TOOLS = [
  {
    title: 'ATS Resume Generator',
    description: 'Generate a pro PDF resume',
    icon: 'document-text-outline',
    route: '/resume/generator',
    category: 'Resume',
    featured: true,
  },
  {
    title: 'Analyze Your Resume',
    description: 'AI-powered resume scoring',
    icon: 'analytics-outline',
    route: '/resume/analyze',
    category: 'Resume',
  },
  {
    title: 'Question Bank',
    description: 'Practice key interview questions',
    icon: 'help-circle-outline',
    route: '/questions',
    category: 'Interview',
  },
  {
    title: 'AI Mock Interview',
    description: 'Full simulated interview',
    icon: 'mic-outline',
    route: '/interview/type',
    category: 'Interview',
    featured: true,
  },
  {
    title: 'Interview Readiness',
    description: 'Check your preparation score',
    icon: 'pulse-outline',
    route: '/(tabs)/progress',
    category: 'Insights',
  },
  {
    title: 'Find Jobs',
    description: 'Search across job boards',
    icon: 'briefcase-outline',
    route: '/(tabs)/jobs',
    category: 'Career',
  },
  {
    title: 'AI Coach',
    description: 'Personalized coaching',
    icon: 'headset-outline',
    comingSoon: true,
    category: 'Insights',
  },
  {
    title: 'Salary Insights',
    description: 'Compare salaries for your role',
    icon: 'cash-outline',
    comingSoon: true,
    category: 'Career',
  },
];

const CATEGORIES = ['All', 'Resume', 'Interview', 'Insights', 'Career'];

export default function ToolsScreen() {
  const [activeCategory, setActiveCategory] = React.useState('All');

  const filteredTools =
    activeCategory === 'All'
      ? ALL_TOOLS
      : ALL_TOOLS.filter((t) => t.category === activeCategory);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>All Tools</Text>
        <Text style={styles.subtitle}>Your complete AI career toolkit</Text>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.7}
            style={[
              styles.categoryChip,
              activeCategory === cat && styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toolsGrid}>
          {filteredTools.map((tool) => (
            <View key={tool.title} style={styles.toolCardWrap}>
              <ToolCard
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                featured={tool.featured}
                comingSoon={tool.comingSoon}
                onPress={tool.route ? () => router.push(tool.route) : undefined}
              />
            </View>
          ))}
        </View>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  categoryRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  toolCardWrap: {
    width: '48.5%',
  },
});
