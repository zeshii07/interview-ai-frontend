import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Elevation } from '../../constants/theme';
import SectionHeader from '../../components/ui/SectionHeader';
import ToolCard from '../../components/ui/ToolCard';
import WideToolCard from '../../components/ui/WideToolCard';
import ComingSoonRow from '../../components/ui/ComingSoonRow';
import { TOOL_CATEGORIES, TOOLS } from '../../constants/tools';

/**
 * All Tools
 *
 * Three deliberately different presentations instead of one repeated card:
 *   1. "Recommended"  — full-width horizontal cards (flagship, indigo first)
 *   2. grid           — 2-column cards, each with its own accent color
 *   3. "Coming soon"  — compact quiet rows in a single grouped card
 *
 * Plus a search bar and category chips that filter all three sections.
 */
export default function ToolsScreen() {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const [searchFocused, setSearchFocused] = React.useState(false);

  const visibleTools = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = TOOLS;
    if (q) {
      list = list.filter((tool) =>
        [tool.title, tool.description, tool.category]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q))
      );
    }
    if (activeCategory !== 'All') {
      list = list.filter((tool) => tool.category === activeCategory);
    }
    return list;
  }, [query, activeCategory]);

  const recommended = visibleTools.filter((tool) => tool.featured);
  const gridTools = visibleTools.filter(
    (tool) => !tool.featured && !tool.comingSoon
  );
  const comingSoon = visibleTools.filter((tool) => tool.comingSoon);

  const isFiltering = query.trim().length > 0 || activeCategory !== 'All';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>All Tools</Text>
        <Text style={styles.subtitle}>Your complete AI career toolkit</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <Ionicons
          name="search-outline"
          size={17}
          color={Colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tools…"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {query.length > 0 ? (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
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
        keyboardShouldPersistTaps="handled"
      >
        {visibleTools.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={34} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No tools found</Text>
            <Text style={styles.emptyText}>
              Nothing matches “{query.trim()}”
              {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}. Try a
              different word.
            </Text>
            {query.length > 0 || activeCategory !== 'All' ? (
              <TouchableOpacity
                style={styles.emptyReset}
                onPress={() => {
                  setQuery('');
                  setActiveCategory('All');
                }}
              >
                <Text style={styles.emptyResetText}>Clear search & filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
            {isFiltering ? (
              <Text style={styles.resultCount}>
                {visibleTools.length} tool{visibleTools.length === 1 ? '' : 's'}
              </Text>
            ) : null}

            {recommended.length > 0 ? (
              <>
                <SectionHeader title="Recommended" icon="star-outline" />
                <View style={styles.sectionBody}>
                  <View style={styles.wideStack}>
                    {recommended.map((tool, index) => (
                      <WideToolCard
                        key={tool.id}
                        title={tool.title}
                        description={tool.description}
                        icon={tool.icon}
                        accent={tool.accent}
                        accentBg={tool.accentBg}
                        featured={index === 0}
                        onPress={tool.route ? () => router.push(tool.route) : undefined}
                      />
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            {gridTools.length > 0 ? (
              <>
                <SectionHeader
                  title={isFiltering ? 'Results' : 'All tools'}
                  icon="grid-outline"
                />
                <View style={styles.sectionBody}>
                  <View style={styles.toolsGrid}>
                    {gridTools.map((tool) => (
                      <View key={tool.id} style={styles.toolCardWrap}>
                        <ToolCard
                          title={tool.title}
                          description={tool.description}
                          icon={tool.icon}
                          accent={tool.accent}
                          accentBg={tool.accentBg}
                          onPress={tool.route ? () => router.push(tool.route) : undefined}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            {comingSoon.length > 0 ? (
              <>
                <SectionHeader title="Coming soon" icon="time-outline" />
                <View style={styles.sectionBody}>
                  <View style={styles.comingSoonCard}>
                    {comingSoon.map((tool) => (
                      <ComingSoonRow
                        key={tool.id}
                        title={tool.title}
                        icon={tool.icon}
                        accent={tool.accent}
                        accentBg={tool.accentBg}
                      />
                    ))}
                  </View>
                </View>
              </>
            ) : null}
          </>
        )}

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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Elevation.card,
  },
  searchWrapFocused: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: -2,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  categoryRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
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
    // extra room so content clears the floating tab bar
    paddingBottom: Spacing.xl + 52,
  },
  resultCount: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sectionBody: {
    paddingHorizontal: Spacing.md,
  },
  wideStack: {
    gap: Spacing.sm,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  comingSoonCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyReset: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryBg,
  },
  emptyResetText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
});
