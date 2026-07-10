import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyAC3h5G9pVbb_ldabJeZOQQ65Nbmg62E1U",
  authDomain: "hirely-8f434.firebaseapp.com",
  projectId: "hirely-8f434",
  storageBucket: "hirely-8f434.firebasestorage.app",
  messagingSenderId: "942664899237",
  appId: "1:942664899237:web:431621f24ff123e8240b4c"
};

const app = initializeApp(firebaseConfig);

let auth;
try {
  if (AsyncStorage) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = initializeAuth(app); 
  }
} catch (error) {
  auth = initializeAuth(app); 
}

// ADD THIS: Configure Google Provider with your Client ID
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Paste your Web Client ID from Google Cloud Console here:
googleProvider.setCustomParameters({ client_id: '942664899237-grjioq8dl0m6hbpai871plmak0qsrb08.apps.googleusercontent.com' });

export { auth };