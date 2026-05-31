import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../../styles/theme";

interface DividerProps {
  label?: string;
  color?: string;
}

export function Divider({ label, color }: DividerProps) {
  const lineColor = color ?? colors.border;

  if (label) {
    return (
      <View style={styles.labeledContainer}>
        <View style={[styles.line, { backgroundColor: lineColor }]} />
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.line, { backgroundColor: lineColor }]} />
      </View>
    );
  }

  return <View style={[styles.line, { marginVertical: spacing.md, backgroundColor: lineColor }]} />;
}

export default Divider;

const styles = StyleSheet.create({
  labeledContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    marginHorizontal: spacing.md,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
});
