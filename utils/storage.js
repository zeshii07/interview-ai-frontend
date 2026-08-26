import AsyncStorage from '@react-native-async-storage/async-storage';

// All keys explicitly defined as strings
const KEYS = {
  HISTORY: '@hirely_history',
  FAVORITES: '@hirely_favorites',
  ONBOARDING: '@hirely_onboarding_seen',
  PREFERENCES: '@hirely_preferences',
  LAST_WORKING_ROUTE: '@hirely_last_working_route',
  RESUME_BUILDER: '@hirely_resume_builder',
  INTERVIEW_SESSION: '@hirely_interview_session',
};

export const DEFAULT_PREFERENCES = { language: 'English', acceptedTerms: false };

export const loadPreferences = async () => {
  try {
    const value = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return value ? { ...DEFAULT_PREFERENCES, ...JSON.parse(value) } : DEFAULT_PREFERENCES;
  } catch { return DEFAULT_PREFERENCES; }
};

export const savePreferences = async (preferences) => {
  const next = { ...DEFAULT_PREFERENCES, ...preferences };
  await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(next));
  return next;
};

const historyKey = (userId) => userId ? `${KEYS.HISTORY}:${userId}` : KEYS.HISTORY;

export const saveHistory = async (history, userId) => {
  try {
    await AsyncStorage.setItem(historyKey(userId), JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

export const loadHistory = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(historyKey(userId));
    if (data) return JSON.parse(data);

    // Preserve history created before per-user storage was introduced.
    if (userId) {
      const legacyData = await AsyncStorage.getItem(KEYS.HISTORY);
      if (legacyData) {
        await AsyncStorage.setItem(historyKey(userId), legacyData);
        await AsyncStorage.removeItem(KEYS.HISTORY);
        return JSON.parse(legacyData);
      }
    }

    return [];
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
    const storedKeys = await AsyncStorage.getAllKeys();
    const historyKeys = storedKeys.filter(
      (key) => key === KEYS.HISTORY || key.startsWith(`${KEYS.HISTORY}:`)
    );
    await AsyncStorage.multiRemove([
      ...historyKeys,
      KEYS.FAVORITES,
      KEYS.ONBOARDING,
      KEYS.PREFERENCES,
      KEYS.LAST_WORKING_ROUTE,
      KEYS.RESUME_BUILDER,
      KEYS.INTERVIEW_SESSION,
    ]);
  } catch (error) {
    console.error('Failed to clear data');
  }
};

export const loadLastWorkingRoute = async () => {
  try {
    const route = await AsyncStorage.getItem(KEYS.LAST_WORKING_ROUTE);
    return ['/resume/generator', '/resume/preview', '/resume/analyze', '/interview/session'].includes(route)
      ? route
      : null;
  } catch {
    return null;
  }
};

export const saveLastWorkingRoute = async (route) => {
  try {
    if (['/resume/generator', '/resume/preview', '/resume/analyze', '/interview/session'].includes(route)) {
      await AsyncStorage.setItem(KEYS.LAST_WORKING_ROUTE, route);
    } else {
      await AsyncStorage.removeItem(KEYS.LAST_WORKING_ROUTE);
    }
  } catch (error) {
    console.error('Failed to save the active working screen:', error);
  }
};

export const clearPrivateWorkingState = async () => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.LAST_WORKING_ROUTE,
      KEYS.RESUME_BUILDER,
      KEYS.INTERVIEW_SESSION,
    ]);
  } catch (error) {
    console.error('Failed to clear private working state:', error);
  }
};
