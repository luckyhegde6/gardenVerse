import React from "react";
import { View, StyleSheet, DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, useThemeColors } from "@/styles/tokens";

interface LoadingCardProps {
  lines?: number;
  width?: number;
}

export function LoadingCard({ lines = 3, width }: LoadingCardProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const lineWidths: DimensionValue[] = ["80%", "60%", "50%"];

  return (
    <Animated.View style={[styles.card, width ? { width } : undefined, animatedStyle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.line,
            { width: lineWidths[i] || "50%", backgroundColor: colors.surfaceVariant },
            i < lines - 1 && styles.lineMargin,
          ]}
        />
      ))}
    </Animated.View>
  );
}

export default LoadingCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  line: {
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
  },
  lineMargin: {
    marginBottom: SPACING.sm,
  },
});
