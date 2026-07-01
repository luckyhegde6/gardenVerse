import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { useThemeColors, COLORS } from "@/styles/tokens";
import { EnvironmentEffects } from "@components/garden/EnvironmentEffects";

interface GardenViewportProps {
  children: React.ReactNode;
  environmentCondition?: string;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const VIEWPORT_HEIGHT = SCREEN_HEIGHT * 0.6;

export function GardenViewport({ children, environmentCondition }: GardenViewportProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      {environmentCondition ? (
        <View style={styles.layer}>
          <EnvironmentEffects condition={environmentCondition as "clear" | "rain" | "clouds" | "night" | "storm" | "haze"} />
        </View>
      ) : null}
      <View style={styles.content}>
        {children}
      </View>
      <View style={[styles.gradient, { backgroundColor: colors.background }]} />
    </View>
  );
}

export default GardenViewport;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: VIEWPORT_HEIGHT,
    overflow: "hidden",
    position: "relative",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 2,
    backgroundColor: COLORS.background,
    opacity: 0.6,
  },
});
