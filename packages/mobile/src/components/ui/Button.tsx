import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from "react-native";
import { colors, spacing, borderRadius, typography, shadows } from "../../styles/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: string;
  disabled?: boolean;
  fullWidth?: boolean;
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
  disabled = false,
  fullWidth = false,
  className: _className,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

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

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? colors.primary
              : colors.white
          }
        />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    height: 52,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sm: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  lg: {
    height: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceSecondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: colors.error,
  },
  textBase: {
    ...typography.button,
    color: colors.white,
  },
  textSecondary: {
    color: colors.text,
  },
  textOutlineGhost: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.white,
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
