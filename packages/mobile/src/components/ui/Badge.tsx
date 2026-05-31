import React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, typography } from "../../styles/theme";

type BadgeVariant = "primary" | "success" | "warning" | "error" | "info" | "neutral" | "secondary" | "danger";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  /** @deprecated Use StyleSheet instead of className */
  className?: string;
}

const VARIANT_CONFIG: Record<
  BadgeVariant,
  { bg: string; text: string; dotColor: string }
> = {
  primary: { bg: colors.primaryBg, text: colors.primary, dotColor: colors.primary },
  success: { bg: colors.successBg, text: colors.primaryDark, dotColor: colors.success },
  warning: { bg: colors.warningBg, text: colors.warning, dotColor: colors.warning },
  error: { bg: colors.errorBg, text: colors.error, dotColor: colors.error },
  info: { bg: colors.infoBg, text: colors.info, dotColor: colors.info },
  neutral: { bg: colors.surfaceSecondary, text: colors.textSecondary, dotColor: colors.textMuted },
  secondary: { bg: colors.infoBg, text: colors.info, dotColor: colors.info },
  danger: { bg: colors.errorBg, text: colors.error, dotColor: colors.error },
};

export function Badge({
  label,
  variant = "primary",
  size = "md",
  dot = false,
  className: _className,
}: BadgeProps) {
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.primary;

  const containerStyles: ViewStyle[] = [
    styles.container,
    ...(size === "sm" ? [styles.containerSm] : []),
    { backgroundColor: config.bg },
  ];

  const labelStyles: TextStyle[] = [
    styles.label,
    ...(size === "sm" ? [styles.labelSm] : []),
    { color: config.text },
  ];

  return (
    <View style={containerStyles}>
      {dot ? (
        <View
          style={[styles.dot, { backgroundColor: config.dotColor }]}
        />
      ) : null}
      <Text style={labelStyles}>{label}</Text>
    </View>
  );
}

export default Badge;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  containerSm: {
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  labelSm: {
    fontSize: 11,
    lineHeight: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
});
