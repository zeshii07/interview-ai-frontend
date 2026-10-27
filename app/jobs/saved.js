import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import useSavedJobsStore from '../../store/savedJobsStore';
import JobCard from '../../components/jobs/JobCard';
import ErrorState from '../../components/ui/ErrorState';

export default function SavedJobsScreen() {
  const savedJobs = useSavedJobsStore((s) => s.savedJobs);
  const isSyncing = useSavedJobsStore((s) => s.isSyncing);
  const syncError = useSavedJobsStore((s) => s.syncError);
  const hydrateFromCloud = useSavedJobsStore((s) => s.hydrateFromCloud);
  const userId = useSavedJobsStore((s) => s.userId);
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userId) hydrateFromCloud(userId).catch(() => {});
    }, [userId, hydrateFromCloud])
  );

  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try { await hydrateFromCloud(userId); }
    finally { setRefreshing(false); }
  }, [userId, hydrateFromCloud]);

  const openJobDetail = useCallback((job) => {
    if (!job?.id) return;
    router.push({
      pathname: '/jobs/detail',
      params: { job: encodeURIComponent(JSON.stringify(job)) },
    });
  }, []);

  const renderEmpty = () => (
    <ErrorState
      variant="empty"
      icon="bookmarks-outline"
      title="No saved jobs yet"
      message="Tap the bookmark icon on any job posting to save it for later. Saved jobs sync across your devices."
    />
  );

  return (
    <View style={styles.screen}>
      {syncError ? (
        <View style={styles.syncBanner}>
          <Ionicons name="cloud-offline-outline" size={13} color={Colors.warning} />
          <Text style={styles.syncBannerText}>Couldn't sync saved jobs. Showing local copies.</Text>
        </View>
      ) : null}

      <FlatList
        data={savedJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} onPress={openJobDetail} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          savedJobs.length > 0 ? (
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>
                {savedJobs.length} saved {savedJobs.length === 1 ? 'job' : 'jobs'}
              </Text>
              {isSyncing ? <Text style={styles.syncingText}>Syncing…</Text> : null}
            </View>
          ) : null
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.warningBg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.20)',
  },
  syncBannerText: {
    fontSize: FontSizes.xs,
    color: Colors.warning,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  syncingText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
});
