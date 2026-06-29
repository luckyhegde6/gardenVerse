import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from "../../styles/tokens";

interface MetricCardProps {
  icon: string;
  value: string | number;
  label: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  color?: string;
}

export function MetricCard({
  icon,
  value,
  label,
  trend,
  color = COLORS.primary,
}: MetricCardProps) {
  const trendColor =
    trend?.direction === "up"
      ? COLORS.leafGreen
      : trend?.direction === "down"
        ? COLORS.dangerRed
        : COLORS.textMuted;

  const trendArrow = trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "→";

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconDot, { backgroundColor: color }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {trend ? (
          <Text style={[styles.trend, { color: trendColor }]}>
            {trendArrow} {trend.value}
          </Text>
        ) : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

export default MetricCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm as Record<string, unknown>,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  iconDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 18,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.sm,
  },
  value: {
    ...TYPOGRAPHY.headingXL,
    color: COLORS.text,
  },
  trend: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "600",
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
