import React from "react";
import {
  Text,
  ActivityIndicator,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "@/styles/tokens";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: string;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
  /** @deprecated Use StyleSheet instead of className */
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  isLoading = false,
  size = "md",
  variant = "primary",
  icon,
  iconPosition = "left",
  disabled = false,
  fullWidth = false,
  testID,
  className: _className,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
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

  const buttonStyles: ViewStyle[] = [
    styles.base,
    size === "sm" && styles.sm,
    size === "lg" && styles.lg,
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "outline" && styles.outline,
    variant === "ghost" && styles.ghost,
    variant === "danger" && styles.danger,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.textBase,
    variant === "secondary" && styles.textSecondary,
    (variant === "outline" || variant === "ghost") && styles.textOutlineGhost,
    variant === "danger" && styles.textDanger,
    size === "sm" && styles.textSm,
    size === "lg" && styles.textLg,
  ].filter(Boolean) as TextStyle[];

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? COLORS.primary
              : COLORS.white
          }
        />
      );
    }

    const iconElement = icon ? <Text style={styles.icon}>{icon}</Text> : null;
    const textElement = <Text style={textStyles}>{title}</Text>;

    if (iconPosition === "right") {
      return (
        <>
          {textElement}
          {iconElement}
        </>
      );
    }

    return (
      <>
        {iconElement}
        {textElement}
      </>
    );
  };

  return (
    <AnimatedPressable
      style={[buttonStyles, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={title}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

export default Button;

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.md,
    height: 52,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  sm: {
    height: 40,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  lg: {
    height: 56,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: COLORS.dangerRed,
  },
  textBase: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  textSecondary: {
    color: COLORS.text,
  },
  textOutlineGhost: {
    color: COLORS.primary,
  },
  textDanger: {
    color: COLORS.white,
  },
  textSm: {
    fontSize: 14,
    lineHeight: 18,
  },
  textLg: {
    fontSize: 18,
    lineHeight: 22,
  },
  icon: {
    fontSize: 18,
  },
});
