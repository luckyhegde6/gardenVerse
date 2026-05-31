import React from "react";
import { View, TouchableOpacity, ViewStyle, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, shadows } from "../../styles/theme";

type CardVariant = "default" | "elevated";
type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: ViewStyle;
  /** @deprecated Use StyleSheet instead of className */
  className?: string;
  onPress?: () => void;
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  style,
  className: _className,
  onPress,
}: CardProps) {
  const cardStyles: ViewStyle[] = [
    styles.base,
    variant === "elevated" && styles.elevated,
    padding === "sm" && styles.paddingSm,
    padding === "lg" && styles.paddingLg,
    style,
  ].filter(Boolean) as ViewStyle[];

  const content = <>{children}</>;

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{content}</View>;
}

export default Card;

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  elevated: {
    borderRadius: borderRadius.lg,
    ...shadows.lg,
  },
  paddingSm: {
    padding: spacing.sm,
  },
  paddingLg: {
    padding: spacing.lg,
  },
});
