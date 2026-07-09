import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
import Card from '../../components/ui/Card';
import useInterviewStore from '../../store/interviewStore';

const HistoryScreen = () => {
  const { interviewHistory, clearHistory } = useInterviewStore();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item }) => (
    <Card style={styles.historyCard} padding="md">
      <View style={styles.historyHeader}>
        <View style={styles.historyBadges}>
          <View style={[styles.miniBadge, { backgroundColor: Colors.primary + '20' }]}>
            <Text style={[styles.miniBadgeText, { color: Colors.primary }]}>
              {item.role}
            </Text>
          </View>
        </View>
        <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <Text style={styles.historyQuestion} numberOfLines={2}>
        {item.question}
      </Text>
      
      <View style={styles.historyScore}>
        <Text style={styles.scoreLabel}>Score:</Text>
        <Text style={[
          styles.scoreValue,
          { color: item.feedback.rating >= 7 ? Colors.success : Colors.warning }
        ]}>
          {item.feedback.rating}/{item.feedback.rating_max}
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {interviewHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No interviews yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete your first mock interview to see your history here
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Interview History</Text>
            <Text style={styles.count}>{interviewHistory.length} sessions</Text>
          </View>
          <FlatList
            data={interviewHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  count: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  historyCard: {
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  miniBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  miniBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  historyDate: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  historyQuestion: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  historyScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
  scoreValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HistoryScreen;