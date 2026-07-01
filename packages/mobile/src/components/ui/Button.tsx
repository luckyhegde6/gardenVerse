import React, { useCallback, useRef } from "react";
import {
  Text,
  ActivityIndicator,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleSheet,
  Animated,
} from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, useThemeColors } from "@/styles/tokens";

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
  const colors = useThemeColors();
  const isDisabled = disabled || isLoading;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const buttonStyles: ViewStyle[] = [
    styles.base,
    size === "sm" && styles.sm,
    size === "lg" && styles.lg,
    variant === "primary" && { backgroundColor: colors.primary },
    variant === "secondary" && { backgroundColor: colors.surfaceSecondary },
    variant === "outline" && { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.primary },
    variant === "ghost" && { backgroundColor: "transparent" },
    variant === "danger" && { backgroundColor: colors.dangerRed },
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textColor = variant === "secondary" ? colors.text : (variant === "outline" || variant === "ghost") ? colors.primary : colors.white;

  const textStyles: TextStyle[] = [
    styles.textBase,
    { color: textColor },
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
              ? colors.primary
              : colors.white
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
    <Pressable
      style={buttonStyles}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={title}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        {renderContent()}
      </Animated.View>
    </Pressable>
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
