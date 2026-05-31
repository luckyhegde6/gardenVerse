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

async function requestCameraPermission(): Promise<PermissionResult> {
  const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
  return { granted: status === "granted", canAskAgain };
}

async function requestLocationPermission(): Promise<PermissionResult> {
  const { status, canAskAgain } =
    await Location.requestForegroundPermissionsAsync();
  return { granted: status === "granted", canAskAgain };
}

async function requestNotificationPermission(): Promise<PermissionResult> {
  const { status } = await Notifications.requestPermissionsAsync();
  return { granted: status === "granted", canAskAgain: true };
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
    case "camera":
      return requestCameraPermission();
    case "location":
      return requestLocationPermission();
    case "notification":
      return requestNotificationPermission();
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
