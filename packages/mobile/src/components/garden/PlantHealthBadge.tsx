import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors, COLORS, SPACING, TYPOGRAPHY } from "@/styles/tokens";

type PlantStatus = "healthy" | "dry" | "sick" | "growing";

interface PlantHealthBadgeProps {
  status: PlantStatus;
}

function getStatusColor(status: PlantStatus, colors: ReturnType<typeof useThemeColors>): string {
  switch (status) {
    case "healthy": return colors.leafGreen;
    case "dry": return colors.sunYellow;
    case "sick": return colors.dangerRed;
    case "growing": return colors.skyBlue;
  }
}

const STATUS_LABELS: Record<PlantStatus, string> = {
  healthy: "Healthy",
  dry: "Needs Water",
  sick: "Unhealthy",
  growing: "Growing...",
};

export function PlantHealthBadge({ status }: PlantHealthBadgeProps) {
  const colors = useThemeColors();
  const dotScale = useSharedValue(1);

  React.useEffect(() => {
    if (status === "growing") {
      dotScale.value = withRepeat(withTiming(1.3, { duration: 500 }), -1, true);
    }
  }, [status]);

  const dotAnimatedStyle = useAnimatedStyle(() => {
    if (status !== "growing") return {};
    return {
      transform: [{ scale: dotScale.value }],
    };
  });

  const color = getStatusColor(status, colors);
  const label = STATUS_LABELS[status];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, dotAnimatedStyle]} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default PlantHealthBadge;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
