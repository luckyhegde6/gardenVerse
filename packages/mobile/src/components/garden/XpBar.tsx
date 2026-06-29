import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "@/styles/tokens";

interface XpBarProps {
  currentXP: number;
  xpToNext: number;
  level: number;
}

export function XpBar({ currentXP, xpToNext, level }: XpBarProps) {
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
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>{currentXP}/{xpToNext} XP</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
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
    color: COLORS.textMuted,
  },
  xpText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  track: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.leafGreen,
    borderRadius: BORDER_RADIUS.full,
  },
});
