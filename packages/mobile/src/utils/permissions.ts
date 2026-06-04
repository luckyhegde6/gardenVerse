import { Platform, Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";

export type PermissionType = "camera" | "location" | "notification" | "gallery";

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function requestAllPermissions(): Promise<{
  camera: boolean;
  location: boolean;
  notifications: boolean;
}> {
  const [camera, location, notifications] = await Promise.all([
    requestCameraPermission(),
    requestLocationPermission(),
    requestNotificationPermission(),
  ]);
  return { camera, location, notifications };
}

async function requestGalleryPermission(): Promise<PermissionResult> {
  const { status, canAskAgain } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  return { granted: status === "granted", canAskAgain };
}

export async function requestPermission(
  type: PermissionType,
): Promise<PermissionResult> {
  switch (type) {
    case "camera": {
      const granted = await requestCameraPermission();
      return { granted, canAskAgain: false };
    }
    case "location": {
      const granted = await requestLocationPermission();
      return { granted, canAskAgain: false };
    }
    case "notification": {
      const granted = await requestNotificationPermission();
      return { granted, canAskAgain: false };
    }
    case "gallery":
      return requestGalleryPermission();
    default:
      return { granted: false, canAskAgain: false };
  }
}

export function showPermissionAlert(permissionName: string): void {
  Alert.alert(
    `${permissionName} Permission Required`,
    `GardenVerse needs ${permissionName.toLowerCase()} access to provide this feature. Please enable it in your device settings.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ],
  );
}

export async function ensurePermission(type: PermissionType): Promise<boolean> {
  const result = await requestPermission(type);
  if (!result.granted) {
    if (!result.canAskAgain) {
      showPermissionAlert(type.charAt(0).toUpperCase() + type.slice(1));
    }
    return false;
  }
  return true;
}
