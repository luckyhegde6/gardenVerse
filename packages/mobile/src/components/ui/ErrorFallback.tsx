import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SPACING, TYPOGRAPHY, useThemeColors } from "@/styles/tokens";
import { Button } from "@components/ui/Button";

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
  icon?: string;
}

export function ErrorFallback({
  message = "Something went wrong",
  onRetry,
  icon = "\u26A0\uFE0F",
}: ErrorFallbackProps) {
  const colors = useThemeColors();
  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry ? (
        <View style={styles.buttonContainer}>
          <Button title="Try Again" onPress={onRetry} variant="primary" />
        </View>
      ) : null}
    </Animated.View>
  );
}

export default ErrorFallback;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  message: {
    ...TYPOGRAPHY.body,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  buttonContainer: {
    minWidth: 160,
  },
});
