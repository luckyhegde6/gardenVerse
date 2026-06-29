import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { COLORS, SPACING, TYPOGRAPHY } from "@/styles/tokens";
import { Button } from "@components/ui/Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "\u{1FAB4}",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.actionContainer}>
          <Button title={actionLabel} onPress={onAction} variant="primary" />
        </View>
      ) : null}
    </Animated.View>
  );
}

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    ...TYPOGRAPHY.headingM,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actionContainer: {
    minWidth: 160,
  },
});
