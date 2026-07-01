import React from "react";
import {
  View,
  Image,
  Pressable,
  ViewStyle,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, useThemeColors } from "@/styles/tokens";

type CardVariant = "default" | "elevated";
type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  heroImage?: ImageSourcePropType;
  /** @deprecated Use StyleSheet instead of className */
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  variant = "default",
  padding = "md",
  style,
  onPress,
  heroImage,
  className: _className,
}: CardProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardStyles: ViewStyle[] = [
    styles.base,
    { backgroundColor: colors.surface },
    variant === "elevated" && styles.elevated,
    padding === "sm" && styles.paddingSm,
    padding === "lg" && styles.paddingLg,
    style,
  ].filter(Boolean) as ViewStyle[];

  const content = (
    <>
      {heroImage ? (
        <Image source={heroImage} style={styles.heroImage} />
      ) : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        style={[cardStyles, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyles}>{content}</View>;
}

export default Card;

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
    overflow: "hidden",
  },
  elevated: {
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.lg,
  },
  paddingSm: {
    padding: SPACING.sm,
  },
  paddingLg: {
    padding: SPACING.lg,
  },
  heroImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
});
