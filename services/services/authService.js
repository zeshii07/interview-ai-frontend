import { auth } from '../constants/firebase';
import { deleteCloudHistory } from './historyService';
import useResumeBuilderStore from '../store/resumeBuilderStore';
import useInterviewStore from '../store/interviewStore';
import useSavedJobsStore from '../store/savedJobsStore';
import { clearPrivateWorkingState } from '../utils/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
  reload,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
} from 'firebase/auth';

const profileListeners = new Set();

const waitForHydration = (store) => {
  if (store.persist?.hasHydrated?.()) return Promise.resolve();
  return new Promise((resolve) => {
    let unsubscribe;
    const finish = () => {
      unsubscribe?.();
      resolve();
    };
    unsubscribe = store.persist?.onFinishHydration?.(finish);
    if (!unsubscribe || store.persist?.hasHydrated?.()) finish();
  });
};

export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const cleanDisplayName = displayName.trim();
    await updateProfile(userCredential.user, { displayName: cleanDisplayName });
    await reload(userCredential.user);
    profileListeners.forEach((listener) => listener(userCredential.user));
    useSavedJobsStore.getState().setUserId(userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    let message = 'Registration failed.';
    if (error.code === 'auth/email-already-in-use') message = 'This email is already registered.';
    if (error.code === 'auth/weak-password') message = 'Password must be at least 6 characters.';
    return { success: false, error: message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    useSavedJobsStore.getState().setUserId(userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: 'Invalid email or password.' };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset link sent to your email!' };
  } catch (error) {
    let message = 'Failed to send reset email.';
    if (error.code === 'auth/user-not-found') message = 'No account found with this email.';
    return { success: false, error: message };
  }
};

export const signInWithGoogle = async (idToken, accessToken) => {
  try {
    if (!idToken && !accessToken) return { success: false, error: 'Google did not return a valid sign-in token.' };
    const credential = GoogleAuthProvider.credential(idToken || null, accessToken || null);
    const userCredential = await signInWithCredential(auth, credential);
    useSavedJobsStore.getState().setUserId(userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error?.message || 'Google sign-in failed.' };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    await clearSignedOutLocalState();
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Logout failed.' };
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (currentUser) => {
    useSavedJobsStore.getState().setUserId(currentUser?.uid || null);
    callback(currentUser);
  });
};

export const clearSignedOutLocalState = async () => {
  await Promise.all([
    waitForHydration(useResumeBuilderStore),
    waitForHydration(useInterviewStore),
    waitForHydration(useSavedJobsStore),
  ]);
  useResumeBuilderStore.getState().resetBuilder();
  useInterviewStore.getState().clearUserState();
  useSavedJobsStore.getState().clearUserState();
  await clearPrivateWorkingState();
};

export const getCurrentUser = () => auth.currentUser;

export const deleteCurrentAccount = async (password) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No signed-in account was found.');
  const usesPassword = user.providerData.some((provider) => provider.providerId === 'password');
  if (usesPassword) {
    if (!password) throw new Error('Enter your password to confirm account deletion.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  }
  await deleteCloudHistory(user.uid);
  await deleteUser(user);
  await clearSignedOutLocalState();
};

export const onProfileChange = (callback) => {
  profileListeners.add(callback);
  callback(auth.currentUser);
  return () => profileListeners.delete(callback);
};
