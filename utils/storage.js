import AsyncStorage from '@react-native-async-storage/async-storage';

// All keys explicitly defined as strings
const KEYS = {
  HISTORY: '@hirely_history',
  FAVORITES: '@hirely_favorites',
  ONBOARDING: '@hirely_onboarding_seen',
};

export const saveHistory = async (history) => {
  try {
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

export const loadHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
};

export const saveFavorites = async (favorites) => {
  try {
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
};

export const loadFavorites = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
};

export const checkOnboardingSeen = async () => {
  try {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING);
    return value === 'true';
  } catch (error) {
    return false;
  }
};

export const setOnboardingSeen = async () => {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING, 'true');
  } catch (error) {
    console.error('Failed to save onboarding status');
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([KEYS.HISTORY, KEYS.FAVORITES, KEYS.ONBOARDING]);
  } catch (error) {
    console.error('Failed to clear data');
  }
};