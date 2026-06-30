import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors, COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "@/styles/tokens";

interface XpBarProps {
  currentXP: number;
  xpToNext: number;
  level: number;
}

export function XpBar({ currentXP, xpToNext, level }: XpBarProps) {
  const colors = useThemeColors();
  const progress = useSharedValue(0);
  const percentage = xpToNext > 0 ? Math.min(currentXP / xpToNext, 1) : 1;

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 800 });
  }, [percentage]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as unknown as number,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.levelText, { color: colors.textMuted }]}>Level {level}</Text>
        <Text style={[styles.xpText, { color: colors.textMuted }]}>{currentXP}/{xpToNext} XP</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.leafGreen }, fillStyle]} />
      </View>
    </View>
  );
}

export default XpBar;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  levelText: {
    ...TYPOGRAPHY.caption,
  },
  xpText: {
    ...TYPOGRAPHY.caption,
  },
  track: {
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.full,
  },
});
