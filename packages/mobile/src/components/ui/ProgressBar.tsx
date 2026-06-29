import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../../styles/tokens";

interface ProgressBarProps {
  value: number;
  maxValue?: number;
  showLabel?: boolean;
  labelPosition?: "top" | "right" | "none";
  height?: number;
  color?: string;
  trackColor?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  maxValue = 100,
  showLabel = false,
  labelPosition = "right",
  height = 8,
  color = COLORS.leafGreen,
  trackColor = COLORS.border,
  animated = true,
}: ProgressBarProps) {
  const progress = useSharedValue(0);
  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(percentage, { duration: 800 });
    } else {
      progress.value = percentage;
    }
  }, [percentage, animated, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 100], [0, 100])}%`,
  }));

  return (
    <View style={styles.container}>
      {showLabel && labelPosition === "top" && (
        <Text style={styles.labelTop}>{Math.round(percentage)}%</Text>
      )}
      <View
        style={[
          styles.track,
          { backgroundColor: trackColor, height },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, height },
            animatedStyle,
          ]}
        />
      </View>
      {showLabel && labelPosition === "right" && (
        <Text style={styles.labelRight}>{Math.round(percentage)}%</Text>
      )}
    </View>
  );
}

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  track: {
    flex: 1,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  fill: {
    borderRadius: BORDER_RADIUS.full,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  labelTop: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  labelRight: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    minWidth: 32,
  },
});
