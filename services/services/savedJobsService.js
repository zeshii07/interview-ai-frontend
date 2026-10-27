import { get, ref, remove, set } from 'firebase/database';
import { db } from '../constants/firebase';

const sanitizeKey = (id) => String(id).replace(/[.#$/[\]]/g, '_');
const savedJobsPath = (userId) => ref(db, `users/${userId}/savedJobs`);
const jobPath = (userId, jobId) => ref(db, `users/${userId}/savedJobs/${sanitizeKey(jobId)}`);

export const loadCloudSavedJobs = async (userId) => {
  if (!userId) return [];
  try {
    const snapshot = await get(savedJobsPath(userId));
    const jobs = snapshot.val();
    if (!jobs || typeof jobs !== 'object') return [];
    return Object.entries(jobs)
      .map(([entryId, item]) => ({
        ...item,
        id: item?.id ?? entryId,
        savedAt: item?.savedAt ?? null,
      }))
      .sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime());
  } catch (err) {
    console.error('[savedJobsService.loadCloudSavedJobs]', err);
    return [];
  }
};

export const saveCloudJob = async (userId, job) => {
  if (!userId || !job?.id) return;
  try {
    await set(jobPath(userId, job.id), {
      ...job,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[savedJobsService.saveCloudJob]', err);
    throw err;
  }
};

export const unsaveCloudJob = async (userId, jobId) => {
  if (!userId || !jobId) return;
  try {
    await remove(jobPath(userId, jobId));
  } catch (err) {
    console.error('[savedJobsService.unsaveCloudJob]', err);
    throw err;
  }
};

export const clearCloudSavedJobs = async (userId) => {
  if (!userId) return;
  try {
    await remove(savedJobsPath(userId));
  } catch (err) {
    console.error('[savedJobsService.clearCloudSavedJobs]', err);
    throw err;
  }
};
