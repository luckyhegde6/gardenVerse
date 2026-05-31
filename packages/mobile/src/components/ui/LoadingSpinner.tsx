import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../styles/theme";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  size?: "small" | "large";
  color?: string;
  /** @deprecated Use StyleSheet instead of className */
  className?: string;
}

export function LoadingSpinner({
  fullScreen = false,
  message,
  size = "large",
  color = colors.primary,
  className: _className,
}: LoadingSpinnerProps) {
  const content = (
    <View style={styles.content}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
}

export default LoadingSpinner;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    ...typography.bodySmall,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
