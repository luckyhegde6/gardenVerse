import React from "react";
import { Text, TextStyle, StyleSheet } from "react-native";
import { colors } from "../../styles/theme";

type IconSize = "sm" | "md" | "lg" | "xl";

interface IconProps {
  name: string;
  size?: IconSize;
  color?: string;
}

const SIZE_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 28,
  xl: 36,
};

export function Icon({ name, size = "md", color }: IconProps) {
  const textStyles: TextStyle[] = [
    styles.base,
    { fontSize: SIZE_MAP[size] },
    color ? { color } : undefined,
  ].filter(Boolean) as TextStyle[];

  return <Text style={textStyles}>{name}</Text>;
}

export default Icon;

const styles = StyleSheet.create({
  base: {
    textAlign: "center",
  },
});
