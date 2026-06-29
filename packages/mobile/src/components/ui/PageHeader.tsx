import React from "react";
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../../styles/tokens";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightActions?: React.ReactNode;
}

export function PageHeader({ title, onBack, rightActions }: PageHeaderProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Go back">
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        {rightActions || null}
      </View>
    </View>
  );
}

export default PageHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.darkForest,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.md,
  },
  left: {
    width: 40,
    alignItems: "flex-start",
  },
  backButton: {
    padding: SPACING.xs,
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.white,
  },
  title: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
  },
  right: {
    width: 40,
    alignItems: "flex-end",
  },
});
