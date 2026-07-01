import React from "react";
import { Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SPACING, TYPOGRAPHY } from "@/styles/tokens";

interface OfflineBannerProps {
  isOffline: boolean;
  hasStaleData?: boolean;
}

function OfflineBannerComponent({ isOffline, hasStaleData = false }: OfflineBannerProps) {
  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15).stiffness(150)}
      style={styles.banner}
    >
      <Text style={styles.text}>📡 You're offline</Text>
      {hasStaleData && <Text style={styles.subtitle}>Showing cached data</Text>}
    </Animated.View>
  );
}

export const OfflineBanner = React.memo(OfflineBannerComponent);

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: "#FEF3C7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    zIndex: 9999,
  },
  text: {
    ...TYPOGRAPHY.label,
    color: "#92400E",
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: "#92400E",
    marginLeft: SPACING.xs,
  },
});
