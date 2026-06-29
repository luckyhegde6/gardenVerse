import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { COLORS, SPACING, TYPOGRAPHY } from "@/styles/tokens";

type PlantStatus = "healthy" | "dry" | "sick" | "growing";

interface PlantHealthBadgeProps {
  status: PlantStatus;
}

const STATUS_COLORS: Record<PlantStatus, string> = {
  healthy: COLORS.leafGreen,
  dry: COLORS.sunYellow,
  sick: COLORS.dangerRed,
  growing: COLORS.skyBlue,
};

const STATUS_LABELS: Record<PlantStatus, string> = {
  healthy: "Healthy",
  dry: "Needs Water",
  sick: "Unhealthy",
  growing: "Growing...",
};

export function PlantHealthBadge({ status }: PlantHealthBadgeProps) {
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

  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, dotAnimatedStyle]} />
      <Text style={styles.label}>{label}</Text>
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
