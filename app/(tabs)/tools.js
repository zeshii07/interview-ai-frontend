import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import SectionHeader from '../../components/ui/SectionHeader';
import ToolCard from '../../components/ui/ToolCard';
import { TOOL_CATEGORIES, getToolsByCategory } from '../../constants/tools';

export default function ToolsScreen() {
  const [activeCategory, setActiveCategory] = React.useState('All');

  const filteredTools = getToolsByCategory(activeCategory);

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
        {TOOL_CATEGORIES.map((cat) => (
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
        <SectionHeader
          title={activeCategory === 'All' ? 'Every tool' : `${activeCategory} tools`}
          icon="grid-outline"
        />
        <View style={styles.toolsGrid}>
          {filteredTools.map((tool) => (
            <View key={tool.id} style={styles.toolCardWrap}>
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
    paddingBottom: Spacing.sm,
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
    // No `alignItems: 'stretch'` — on a `flexWrap: 'wrap'` container it
    // overrides the children's cross-axis size and stretches every card to
    // full row width (breaks the 2-column layout). Rely on the explicit
    // `flexBasis: '48%'` on each card wrapper + space-between instead.
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  toolCardWrap: {
    // flexBasis (not width %) works reliably with flexWrap: 'wrap' to keep
    // exactly 2 cards per row on every screen size.
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 0,
  },
});
