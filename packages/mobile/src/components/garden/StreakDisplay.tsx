import React, { useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors, COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "@/styles/tokens";

interface StreakDisplayProps {
  streak: number;
  label?: string;
}

export function StreakDisplay({ streak, label = "Day Streak" }: StreakDisplayProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (streak >= 7) {
      scale.value = withRepeat(withTiming(1.05, { duration: 1000 }), -1, true);
    }
  }, [streak]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.sunYellow + '26' }, animatedStyle]}>
      <Text style={styles.fire}>{'\uD83D\uDD25'}</Text>
      <Text style={[styles.count, { color: colors.text }]}>{streak}</Text>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </Animated.View>
  );
}

export default StreakDisplay;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.sunYellow}26`,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: "flex-start",
    gap: SPACING.xs,
  },
  fire: {
    fontSize: 14,
  },
  count: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: "700",
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
  },
});
