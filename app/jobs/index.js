import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Keyboard,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';

import { Colors, Spacing, FontSizes, Radius, Shadows } from '../../constants/theme';
import { jobsAPI, makeAbortable, isAbortError } from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import useSavedJobsStore from '../../store/savedJobsStore';
import JobCard from '../../components/jobs/JobCard';
import FilterPanel from '../../components/jobs/FilterPanel';
import FilterChip from '../../components/ui/FilterChip';
import ErrorState from '../../components/ui/ErrorState';
import SlowNetworkBanner from '../../components/ui/SlowNetworkBanner';

const DEFAULT_FILTERS = {
  query: '',
  location: '',
  remoteOnly: false,
  datePosted: null,
  jobType: null,
  salaryMin: null,
  salaryMax: null,
  experienceLevels: [],
  skills: [],
};

const QUICK_FILTERS = [
  { id: 'remote', label: 'Remote', icon: 'wifi-outline' },
  { id: '24h', label: 'Past 24h', icon: 'time-outline' },
  { id: 'full_time', label: 'Full-time', icon: 'briefcase-outline' },
  { id: '7d', label: 'Past 7 days', icon: 'calendar-outline' },
];

export default function JobsScreen() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [providers, setProviders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const abortRef = useRef(null);
  const lastSearchParamsRef = useRef(null);

  const setUserId = useSavedJobsStore((s) => s.setUserId);
  useFocusEffect(
    useCallback(() => {
      const user = getCurrentUser();
      setUserId(user?.uid || null);
    }, [setUserId])
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.remoteOnly) n++;
    if (filters.datePosted) n++;
    if (filters.jobType) n++;
    if (filters.salaryMin || filters.salaryMax) n++;
    if (filters.experienceLevels.length) n++;
    if (filters.skills.length) n++;
    return n;
  }, [filters]);

  const buildSearchParams = useCallback(
    (overrides = {}) => ({
      query: (overrides.query ?? query).trim(),
      location: (overrides.location ?? location).trim(),
      remoteOnly: filters.remoteOnly,
      datePosted: filters.datePosted,
      jobType: filters.jobType,
      salaryMin: filters.salaryMin,
      salaryMax: filters.salaryMax,
      experienceLevels: filters.experienceLevels,
      skills: filters.skills,
      page: overrides.page ?? 1,
      resultsPerPage: 20,
    }),
    [query, location, filters]
  );

  const runSearch = useCallback(
    async (params, { append = false } = {}) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = makeAbortable();
      abortRef.current = ctrl;

      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await jobsAPI.search(params, ctrl.signal);
        if (ctrl.signal.aborted) return;
        const newJobs = Array.isArray(result?.jobs) ? result.jobs : [];
        setJobs((prev) => (append ? [...prev, ...newJobs] : newJobs));
        setProviders(result?.providers || []);
        setTotal(result?.total || 0);
        setPage(params.page || 1);
        setHasSearched(true);
        setError(null);
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err?.message || 'Search failed. Please try again.');
      } finally {
        if (!append) setLoading(false);
        else setLoadingMore(false);
        if (abortRef.current === ctrl) abortRef.current = null;
      }
    },
    []
  );

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    const params = buildSearchParams({ page: 1 });
    if (!params.query && !params.skills?.length) {
      setError('Enter a job title, keyword, or skill to search.');
      return;
    }
    lastSearchParamsRef.current = params;
    runSearch(params);
  }, [buildSearchParams, runSearch]);

  const handleRefresh = useCallback(() => {
    if (!lastSearchParamsRef.current) return;
    setRefreshing(true);
    runSearch({ ...lastSearchParamsRef.current, page: 1 }).finally(() =>
      setRefreshing(false)
    );
  }, [runSearch]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || loading || jobs.length >= total) return;
    if (!lastSearchParamsRef.current) return;
    const nextParams = {
      ...lastSearchParamsRef.current,
      page: (page || 1) + 1,
    };
    lastSearchParamsRef.current = nextParams;
    runSearch(nextParams, { append: true });
  }, [loadingMore, loading, jobs.length, total, page, runSearch]);

  const handleApplyFilters = useCallback(
    (newFilters) => {
      setFilters({ ...DEFAULT_FILTERS, ...newFilters });
      setFilterPanelOpen(false);
      if (hasSearched && lastSearchParamsRef.current) {
        const params = buildSearchParams({ ...newFilters, page: 1 });
        lastSearchParamsRef.current = params;
        runSearch(params);
      }
    },
    [buildSearchParams, runSearch, hasSearched]
  );

  // Quick filter toggle for the chip row
  const toggleQuickFilter = useCallback((id) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (id === 'remote') next.remoteOnly = !prev.remoteOnly;
      else if (id === '24h') next.datePosted = prev.datePosted === '24h' ? null : '24h';
      else if (id === '7d') next.datePosted = prev.datePosted === '7d' ? null : '7d';
      else if (id === 'full_time') next.jobType = prev.jobType === 'full_time' ? null : 'full_time';
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const openJobDetail = useCallback((job) => {
    if (!job?.id) return;
    router.push({
      pathname: '/jobs/detail',
      params: { job: encodeURIComponent(JSON.stringify(job)) },
    });
  }, []);

  const renderEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <ErrorState
          variant="error"
          title="Couldn't load jobs"
          message={error}
          onRetry={handleSearch}
        />
      );
    }
    if (!hasSearched) {
      return (
        <ErrorState
          variant="empty"
          icon="briefcase-outline"
          title="Find your next role"
          message="Search across Adzuna, Jooble, Reed, and USAJobs. Enter a job title above and tap Search."
        />
      );
    }
    return (
      <ErrorState
        variant="empty"
        icon="search-outline"
        title="No jobs found"
        message="Try widening your filters — remove the salary range, change the date posted, or use broader keywords."
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerText}>Loading more…</Text>
      </View>
    );
  };

  // Map quick filters to chip state
  const quickFilterState = {
    remote: filters.remoteOnly,
    '24h': filters.datePosted === '24h',
    '7d': filters.datePosted === '7d',
    full_time: filters.jobType === 'full_time',
  };

  return (
    <View style={styles.screen}>
      <SlowNetworkBanner />

      {/* Search header — light background, no gradient (we reserve gradient
          for the Home hero per the design system) */}
      <View style={styles.searchHeader}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Job title or keyword"
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => setFilterPanelOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFilterCount > 0 ? '#FFFFFF' : Colors.textPrimary}
            />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.locationInputWrap}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Location (e.g. Remote, New York, Pakistan)"
              placeholderTextColor={Colors.textMuted}
              value={location}
              onChangeText={setLocation}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.85}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Quick filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFilterRow}
        >
          {QUICK_FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              icon={f.icon}
              selected={quickFilterState[f.id]}
              onPress={() => toggleQuickFilter(f.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Provider status */}
      {providers.length > 0 ? (
        <View style={styles.providerRow}>
          <Text style={styles.providerLabel}>Sources:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerList}>
            {providers.map((p) => (
              <View
                key={p.id}
                style={[styles.providerChip, p.ok ? styles.providerChipOk : styles.providerChipErr]}
              >
                <Text style={styles.providerChipText}>{p.label}</Text>
                <Text style={styles.providerChipCount}>{p.count}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Skills preview */}
      {filters.skills.length > 0 ? (
        <View style={styles.skillsPreviewRow}>
          <Ionicons name="sparkles-outline" size={12} color={Colors.primary} />
          <Text style={styles.skillsPreviewText} numberOfLines={1}>
            Boosting: {filters.skills.join(', ')}
          </Text>
        </View>
      ) : null}

      {/* Results */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} onPress={openJobDetail} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          jobs.length > 0 ? (
            <Text style={styles.resultsCount}>
              {total} {total === 1 ? 'job' : 'jobs'} found
            </Text>
          ) : null
        }
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
      />

      <FilterPanel
        visible={filterPanelOpen}
        initial={filters}
        onClose={() => setFilterPanelOpen(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  searchHeader: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInputWrap: {
    flex: 1,
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
  locationInputWrap: {
    flex: 1,
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },
  searchButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickFilterRow: {
    gap: Spacing.xs + 2,
    paddingTop: Spacing.xs,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  providerLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  providerList: {
    gap: 6,
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  providerChipOk: {
    backgroundColor: Colors.successBg,
  },
  providerChipErr: {
    backgroundColor: Colors.errorBg,
  },
  providerChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  providerChipCount: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  skillsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryBg,
  },
  skillsPreviewText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  resultsCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});
