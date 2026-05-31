import { Platform } from "react-native";

type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

const HapticFeedback = {
  light: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },

  medium: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },

  heavy: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },

  success: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },

  warning: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  },

  error: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  },
};

export async function triggerHaptic(
  type: HapticType = "medium",
): Promise<void> {
  await HapticFeedback[type]();
}

export default HapticFeedback;
