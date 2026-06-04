import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

function getWebStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    const ls = getWebStorage();
    return ls ? ls.getItem(key) : null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    const ls = getWebStorage();
    if (ls) ls.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // fallback: silently ignore
  }
}

export async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    const ls = getWebStorage();
    if (ls) ls.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // fallback: silently ignore
  }
}

export const StorageKeys = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  ONBOARDING_COMPLETE: "onboarding_complete",
  THEME_MODE: "theme_mode",
  NOTIFICATION_PREFERENCES: "notification_preferences",
} as const;
