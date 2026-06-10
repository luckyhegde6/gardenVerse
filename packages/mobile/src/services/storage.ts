import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // silently ignore
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // silently ignore
  }
}

export const StorageKeys = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  ONBOARDING_COMPLETE: "onboarding_complete",
  THEME_MODE: "theme_mode",
  NOTIFICATION_PREFERENCES: "notification_preferences",
  GARDEN_STATE: "garden_state",
  QUEST_PROGRESS: "quest_progress",
  DAILY_REWARDS: "daily_rewards",
  FRIENDS_DATA: "friends_data",
  SOCIAL_FEED: "social_feed",
  MARKETPLACE_CACHE: "marketplace_cache",
  ACHIEVEMENTS: "achievements",
  INVENTORY: "inventory",
  SETTINGS: "settings",
} as const;
