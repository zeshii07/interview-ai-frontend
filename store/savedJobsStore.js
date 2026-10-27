import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadCloudSavedJobs,
  saveCloudJob,
  unsaveCloudJob,
  clearCloudSavedJobs,
} from '../services/savedJobsService';

const MAX_DESCRIPTION_LENGTH = 600;

const compactJob = (job) => ({
  id: String(job?.id || ''),
  provider: job?.provider || 'unknown',
  providerLabel: job?.providerLabel || job?.provider || 'Unknown',
  title: job?.title || 'Untitled role',
  company: job?.company || 'Unknown company',
  location: job?.location || 'Unspecified',
  isRemote: Boolean(job?.isRemote),
  url: job?.url || null,
  postedAt: job?.postedAt || null,
  salary: job?.salary || null,
  experienceLevel: job?.experienceLevel || 'unspecified',
  description: job?.description ? String(job.description).slice(0, MAX_DESCRIPTION_LENGTH) : '',
  matchScore: Number(job?.matchScore) || 0,
});

const useSavedJobsStore = create(
  persist(
    (set, get) => ({
      savedJobs: [],
      userId: null,
      cloudSynced: false,
      isSyncing: false,
      syncError: null,

      setUserId: (userId) => {
        const next = userId || null;
        if (get().userId === next) return;
        set({ userId: next, cloudSynced: false });
        if (next) get().hydrateFromCloud(next).catch(() => {});
        else set({ savedJobs: [] });
      },

      hydrateFromCloud: async (userId) => {
        if (!userId) return;
        set({ isSyncing: true, syncError: null });
        try {
          const cloudJobs = await loadCloudSavedJobs(userId);
          const local = get().savedJobs;
          const byId = new Map();
          for (const j of local) byId.set(j.id, j);
          for (const j of cloudJobs) byId.set(j.id, j);
          const merged = [...byId.values()].sort(
            (a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0)
          );
          set({ savedJobs: merged, cloudSynced: true, isSyncing: false });
        } catch (err) {
          set({ isSyncing: false, syncError: err?.message || 'Cloud sync failed' });
        }
      },

      isSaved: (jobId) => {
        if (!jobId) return false;
        return get().savedJobs.some((j) => j.id === jobId);
      },

      saveJob: async (job) => {
        if (!job?.id) return;
        const compact = compactJob(job);
        if (get().savedJobs.some((j) => j.id === compact.id)) return;
        const stamped = { ...compact, savedAt: new Date().toISOString() };
        set({ savedJobs: [stamped, ...get().savedJobs] });
        const userId = get().userId;
        if (userId) {
          try { await saveCloudJob(userId, stamped); }
          catch (err) { console.warn('[savedJobsStore.saveJob] cloud sync failed:', err); }
        }
      },

      unsaveJob: async (jobId) => {
        if (!jobId) return;
        set({ savedJobs: get().savedJobs.filter((j) => j.id !== jobId) });
        const userId = get().userId;
        if (userId) {
          try { await unsaveCloudJob(userId, jobId); }
          catch (err) { console.warn('[savedJobsStore.unsaveJob] cloud sync failed:', err); }
        }
      },

      toggleSaved: async (job) => {
        if (!job?.id) return;
        if (get().isSaved(job.id)) await get().unsaveJob(job.id);
        else await get().saveJob(job);
      },

      clearAll: async () => {
        const userId = get().userId;
        set({ savedJobs: [] });
        if (userId) {
          try { await clearCloudSavedJobs(userId); }
          catch (err) { console.warn('[savedJobsStore.clearAll] cloud sync failed:', err); }
        }
      },

      clearUserState: () => {
        set({ savedJobs: [], userId: null, cloudSynced: false });
      },
    }),
    {
      name: 'hirely-saved-jobs-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ savedJobs: state.savedJobs }),
    }
  )
);

export default useSavedJobsStore;
