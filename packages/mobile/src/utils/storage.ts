import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const memoryStore = new Map<string, string>();

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) return memoryStore.get(key) ?? null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    memoryStore.set(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

export async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    memoryStore.delete(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    memoryStore.delete(key);
  }
}

export const StorageKeys = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  THEME_MODE: 'theme_mode',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
} as const;
