import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { COLORS, SPACING, TYPOGRAPHY } from "@/styles/tokens";
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
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
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
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  buttonContainer: {
    minWidth: 160,
  },
});
