import React, { useCallback } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useThemeColors,
} from "@/styles/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CategoryChipProps {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
}

function CategoryChipComponent({
  label,
  emoji,
  selected,
  onPress,
}: CategoryChipProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  return (
    <AnimatedPressable
      style={[
        styles.base,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: "transparent", borderColor: colors.border },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} filter`}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, selected && { color: colors.white }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export const CategoryChip = React.memo(CategoryChipComponent);
export default CategoryChip;

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm - 2,
    paddingHorizontal: SPACING.md - 2,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  selected: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  unselected: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
  labelSelected: {
    color: COLORS.white,
  },
});
