import React from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useThemeColors, BORDER_RADIUS, SHADOWS } from "@/styles/tokens";

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  color?: string;
  position?: {
    bottom?: number;
    right?: number;
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionButton({
  icon,
  onPress,
  color,
  position,
}: FloatingActionButtonProps) {
  const colors = useThemeColors();
  const bgColor = color ?? colors.primary;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.button,
        { backgroundColor: bgColor },
        position ? { bottom: position.bottom ?? 24, right: position.right ?? 24 } : styles.defaultPosition,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={icon}
    >
      <Text style={[styles.icon, { color: colors.white }]}>{icon}</Text>
    </AnimatedPressable>
  );
}

export default FloatingActionButton;

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    ...SHADOWS.lg as Record<string, unknown>,
  },
  defaultPosition: {
    bottom: 24,
    right: 24,
  },
  icon: {
    fontSize: 24,
  },
});
