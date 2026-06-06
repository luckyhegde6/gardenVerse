import { Platform } from "react-native";

type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

/**
 * Haptic feedback utility with both primitive and semantic methods.
 *
 * Primitives: light, medium, heavy, success, warning, error
 * Semantic:   select (= light), action (= medium), harvest (= heavy)
 */
export const HapticFeedback = {
  // ─── Primitives ───────────────────────────────────────────────────────
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

  // ─── Semantic aliases ─────────────────────────────────────────────────
  // These map domain actions to the underlying haptic styles for cleaner
  // usage in feature components (e.g. HapticFeedback.action() in buttons).

  /** Light tap — selection, toggles, navigation */
  select: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },

  /** Medium impact — care actions (water, fertilize, prune) */
  action: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },

  /** Heavy impact — harvest / destructive actions */
  harvest: async () => {
    if (Platform.OS === "web") return;
    try {
      const Haptics = require("expo-haptics");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },
};

export async function triggerHaptic(
  type: HapticType = "medium",
): Promise<void> {
  await HapticFeedback[type]();
}

export default HapticFeedback;
