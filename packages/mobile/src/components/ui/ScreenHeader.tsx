import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBack?: boolean;
}

export function ScreenHeader({
  title,
  onBack,
  rightAction,
  showBack = false,
}: ScreenHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.right}>
          {rightAction || null}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ScreenHeader;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80,
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 80,
  },
  title: {
    ...typography.h4,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 22,
    color: colors.text,
  },
});
