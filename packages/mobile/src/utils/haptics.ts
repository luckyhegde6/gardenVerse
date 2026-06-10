import { Platform } from "react-native";

type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

// expo-haptics is not installed; provide no-op fallbacks.
const noop = async () => {};

export const HapticFeedback: Record<string, () => Promise<void>> = {
  light: noop,
  medium: noop,
  heavy: noop,
  success: noop,
  warning: noop,
  error: noop,
};

export async function triggerHaptic(
  type: HapticType = "medium",
): Promise<void> {
  if (Platform.OS === "web") return;
  await HapticFeedback[type]();
}

export default HapticFeedback;
