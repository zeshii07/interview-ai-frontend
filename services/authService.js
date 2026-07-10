import { auth, googleProvider } from '../constants/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  signInWithCredential,
  onAuthStateChanged // <-- ADDED THIS
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Make sure WebBrowser can close properly
WebBrowser.maybeCompleteAuthSession();

// Register with Name
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update profile with the user's name
    await updateProfile(userCredential.user, { displayName: displayName });
    return { success: true, user: userCredential.user };
  } catch (error) {
    let message = 'Registration failed.';
    if (error.code === 'auth/email-already-in-use') message = 'This email is already registered.';
    if (error.code === 'auth/weak-password') message = 'Password must be at least 6 characters.';
    return { success: false, error: message };
  }
};

// Login
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: 'Invalid email or password.' };
  }
};

// Forgot Password
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

// Google Login
export const signInWithGoogle = async () => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
    
    const authResult = await AuthSession.startAsync({
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleProvider.customParameters.client_id}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email`,
    });

    if (authResult.type === 'success' && authResult.params.code) {
      // Exchange code for token (handled seamlessly by Firebase)
      const credential = GoogleAuthProvider.credential(authResult.params.code, undefined, redirectUri);
      const userCredential = await signInWithCredential(auth, credential);
      return { success: true, user: userCredential.user };
    }
    return { success: false, error: 'Google sign-in was cancelled.' };
  } catch (error) {
    return { success: false, error: 'Google sign-in failed.' };
  }
};

// Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Logout failed.' };
  }
};

// Auth Listener
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};