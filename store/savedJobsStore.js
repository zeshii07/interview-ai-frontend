import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadCloudSavedJobs,
  saveCloudJob,
  unsaveCloudJob,
  clearCloudSavedJobs,
} from '../services/savedJobsService';

/**
 * Saved-jobs store.
 *
 * - Source of truth for the UI.
 * - Persisted to AsyncStorage so saved jobs survive app restarts.
 * - Synced to Firebase RTDB under users/{uid}/savedJobs for cross-device
 *   sync (when `userId` is provided).
 *
 * Job shape (stored):
 *   {
 *     id            : string  — provider-prefixed id ("adzuna:abc")
 *     provider      : string
 *     providerLabel : string
 *     title         : string
 *     company       : string
 *     location      : string
 *     isRemote      : boolean
 *     url           : string | null
 *     postedAt      : string | null  (ISO date)
 *     salary        : { min, max, currency, predicted } | null
 *     experienceLevel: string
 *     description   : string (truncated to 600 chars to keep RTDB payload small)
 *     matchScore    : number
 *     savedAt       : string  (ISO date — set on save)
 *   }
 */

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
  description: job?.description
    ? String(job.description).slice(0, MAX_DESCRIPTION_LENGTH)
    : '',
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
        // Re-hydrate from cloud when the user changes (login / switch)
        if (next) {
          get().hydrateFromCloud(next).catch(() => {});
        } else {
          set({ savedJobs: [] });
        }
      },

      hydrateFromCloud: async (userId) => {
        if (!userId) return;
        set({ isSyncing: true, syncError: null });
        try {
          const cloudJobs = await loadCloudSavedJobs(userId);
          // Merge cloud jobs with whatever's already in local storage.
          // Cloud wins on conflict (newest savedAt).
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
        const existing = get().savedJobs.find((j) => j.id === compact.id);
        if (existing) return; // already saved — no-op

        const stamped = { ...compact, savedAt: new Date().toISOString() };
        set({ savedJobs: [stamped, ...get().savedJobs] });

        const userId = get().userId;
        if (userId) {
          try {
            await saveCloudJob(userId, stamped);
          } catch (err) {
            // Cloud save failed — keep the local entry (it'll sync later).
            console.warn('[savedJobsStore.saveJob] cloud sync failed:', err);
          }
        }
      },

      unsaveJob: async (jobId) => {
        if (!jobId) return;
        set({ savedJobs: get().savedJobs.filter((j) => j.id !== jobId) });

        const userId = get().userId;
        if (userId) {
          try {
            await unsaveCloudJob(userId, jobId);
          } catch (err) {
            console.warn('[savedJobsStore.unsaveJob] cloud sync failed:', err);
          }
        }
      },

      toggleSaved: async (job) => {
        if (!job?.id) return;
        if (get().isSaved(job.id)) {
          await get().unsaveJob(job.id);
        } else {
          await get().saveJob(job);
        }
      },

      clearAll: async () => {
        const userId = get().userId;
        set({ savedJobs: [] });
        if (userId) {
          try {
            await clearCloudSavedJobs(userId);
          } catch (err) {
            console.warn('[savedJobsStore.clearAll] cloud sync failed:', err);
          }
        }
      },

      // Called from authService.clearSignedOutLocalState to wipe local state
      // on logout (mirrors the interviewStore.clearUserState pattern).
      clearUserState: () => {
        set({ savedJobs: [], userId: null, cloudSynced: false });
      },
    }),
    {
      name: 'hirely-saved-jobs-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the saved jobs themselves — userId is set on login.
      partialize: (state) => ({ savedJobs: state.savedJobs }),
    }
  )
);

export default useSavedJobsStore;
