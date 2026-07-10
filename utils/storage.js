import AsyncStorage from '@react-native-async-storage/async-storage';
const STORAGE_KEYS = {
  HISTORY: '@hirely_history',
  FAVORITES: '@hirely_favorites',
  ONBOARDING_SEEN: '@hirely_onboarding_seen',
};


// Save Interview History
export const saveHistory = async (history) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INTERVIEW_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

// Load Interview History
export const loadHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INTERVIEW_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
};

// Save Favorite Questions
export const saveFavorites = async (favorites) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_QUESTIONS, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
};

// Load Favorite Questions
export const loadFavorites = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_QUESTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
};

// Clear All Data
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.INTERVIEW_HISTORY, STORAGE_KEYS.FAVORITE_QUESTIONS]);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
};

// Add this to your STORAGE_KEYS object at the top:

// ... keep your existing functions ...

// ADD THESE TWO NEW FUNCTIONS AT THE VERY BOTTOM:

export const checkOnboardingSeen = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
    return value === 'true'; // returns true or false
  } catch (error) {
    return false;
  }
};

export const setOnboardingSeen = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
  } catch (error) {
    console.error('Failed to save onboarding status');
  }
};