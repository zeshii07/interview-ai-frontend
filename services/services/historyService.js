import { get, ref, remove, set } from 'firebase/database';

import { db } from '../constants/firebase';

const historyPath = (userId) =>
  ref(db, `users/${userId}/interviewHistory`);

export const loadCloudHistory = async (userId) => {
  if (!userId) return [];

  const snapshot = await get(historyPath(userId));
  const history = snapshot.val();
  if (!history || typeof history !== 'object') return [];

  return Object.entries(history)
    .map(([entryId, item]) => ({
      ...item,
      id: item?.id ?? entryId,
    }))
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.timestamp).getTime() -
        new Date(a.updatedAt || a.timestamp).getTime()
    )
    .slice(0, 200);
};

export const saveCloudHistoryItem = async (userId, item) => {
  if (!userId || !item?.id) return;

  await set(
    ref(db, `users/${userId}/interviewHistory/${item.id}`),
    item
  );
};

export const migrateHistoryToCloud = async (userId, history) => {
  if (!userId || !Array.isArray(history)) return;
  await Promise.all(
    history.map((item) => saveCloudHistoryItem(userId, item))
  );
};

export const deleteCloudHistory = async (userId) => {
  if (!userId) return;

  await remove(historyPath(userId));
};
