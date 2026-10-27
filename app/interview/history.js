import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useInterviewStore from '../../store/interviewStore';
import FilterChip from '../../components/ui/FilterChip';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/ui/ErrorState';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'role', label: 'Role-based' },
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'mock', label: 'Mock' },
];

export default function HistoryScreen() {
  const interviewHistory = useInterviewStore((s) => s.interviewHistory);
  const clearHistory = useInterviewStore((s) => s.clearHistory);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return interviewHistory;
    return interviewHistory.filter((item) => {
      const type = item.type || item.interviewType || 'general';
      return type === filter;
    });
  }, [interviewHistory, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // The store loads from cloud on init; just simulate a refresh
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear all history?',
      'This deletes every recorded interview session. This can\'t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  const handleItemPress = (item) => {
    // In a full implementation, this would open a detail view of the session
    Alert.alert(
      item.role || 'Interview session',
      `Score: ${(item.averageScore || 0).toFixed(1)}/10\nDate: ${new Date(item.updatedAt || item.timestamp).toLocaleString()}`,
      [{ text: 'OK' }]
    );
  };

  const renderItem = ({ item, index }) => {
    const score = Number(item.averageScore || 0);
    const date = new Date(item.updatedAt || item.timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeaderRow}>
          <View style={styles.sessionIconWrap}>
            <Text style={styles.sessionNumber}>{(filter === 'all' ? interviewHistory.length - index : filteredHistory.length - index)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionRole} numberOfLines={1}>{item.role || 'Interview'}</Text>
            <Text style={styles.sessionDate}>{dateStr}</Text>
          </View>
          <View style={[
            styles.scoreBadge,
            { backgroundColor: score >= 7 ? Colors.successBg : score >= 5 ? Colors.warningBg : Colors.errorBg },
          ]}>
            <Text style={[
              styles.scoreText,
              { color: score >= 7 ? Colors.success : score >= 5 ? Colors.warning : Colors.error },
            ]}>
              {score.toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.sessionMetaRow}>
          <Badge
            label={item.difficulty || 'mixed'}
            variant="neutral"
            size="sm"
          />
          {item.type ? (
            <Badge
              label={item.type}
              variant="primary"
              size="sm"
            />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        {interviewHistory.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              selected={filter === item.value}
              onPress={() => setFilter(item.value)}
            />
          )}
        />
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={(item, idx) => item.id || String(idx)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <ErrorState
            variant="empty"
            icon="time-outline"
            title="No sessions found"
            message={
              filter === 'all'
                ? 'You haven\'t completed any interviews yet. Start your first one now!'
                : `No ${filter} interviews yet. Try a different filter or start a new interview.`
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />

      {interviewHistory.length === 0 ? (
        <View style={styles.footerCTA}>
          <Button
            label="Start your first interview"
            icon="mic-outline"
            iconPosition="left"
            size="lg"
            fullWidth
            onPress={() => router.push('/interview/type')}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filterRow: {
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sessionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sessionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionNumber: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  sessionRole: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sessionDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scoreBadge: {
    width: 44,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  sessionMetaRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingLeft: 52,
  },
  footerCTA: {
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
