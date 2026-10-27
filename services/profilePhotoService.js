import { get, ref, remove, set } from 'firebase/database';
import { db } from '../constants/firebase';

/**
 * Profile photo service — stores the user's avatar in Firebase Realtime
 * Database (RTDB) instead of Firebase Auth's `photoURL` field.
 *
 * Why RTDB instead of Firebase Auth photoURL?
 *   - Firebase Auth's photoURL field has a STRICT 1024-character limit (it's
 *     designed for URLs like `https://...`, not base64 data URLs).
 *     A typical 100KB JPEG avatar is ~135KB as base64 (~180,000 chars),
 *     which throws `auth/invalid-profile-attribute: Photo URL too long`.
 *   - Firebase RTDB allows up to 256MB per node — way more than enough for
 *     a 200KB avatar.
 *
 * The trade-off: photos stored in RTDB aren't automatically available in
 * `user.photoURL` (e.g. for Firebase Auth UI components), but for our app's
 * Profile tab + Edit Profile screen, we read directly from RTDB.
 *
 * Storage path: `users/{uid}/profilePhoto` (string — base64 data URL)
 */

const photoPath = (userId) => ref(db, `users/${userId}/profilePhoto`);

export const loadProfilePhoto = async (userId) => {
  if (!userId) return null;
  try {
    const snapshot = await get(photoPath(userId));
    return snapshot.val() || null;
  } catch (err) {
    console.error('[profilePhotoService.loadProfilePhoto]', err);
    return null;
  }
};

export const saveProfilePhoto = async (userId, dataUrl) => {
  if (!userId) return;
  try {
    if (dataUrl) {
      await set(photoPath(userId), dataUrl);
    } else {
      await remove(photoPath(userId));
    }
  } catch (err) {
    console.error('[profilePhotoService.saveProfilePhoto]', err);
    throw err;
  }
};

export const deleteProfilePhoto = async (userId) => {
  if (!userId) return;
  try {
    await remove(photoPath(userId));
  } catch (err) {
    console.error('[profilePhotoService.deleteProfilePhoto]', err);
    throw err;
  }
};

/**
 * Subscribe to profile photo changes for the given user.
 * Returns an unsubscribe function. Callback fires immediately with the
 * current value, then again whenever the value changes.
 *
 * Used by the Profile tab so it updates instantly when the user changes
 * their photo on the Edit Profile screen.
 */
export const subscribeProfilePhoto = (userId, callback) => {
  if (!userId) {
    callback(null);
    return () => {};
  }

  // Use firebase/database's onValue listener for real-time updates
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { onValue } = require('firebase/database');
  const photoRef = photoPath(userId);

  const unsub = onValue(
    photoRef,
    (snapshot) => {
      callback(snapshot.val() || null);
    },
    (error) => {
      console.error('[profilePhotoService.subscribeProfilePhoto]', error);
      callback(null);
    }
  );

  return unsub;
};
