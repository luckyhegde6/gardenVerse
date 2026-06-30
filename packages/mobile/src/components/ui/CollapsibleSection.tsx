import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, useThemeColors } from "@/styles/tokens";

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  badge?: string;
}

export function CollapsibleSection({
  title,
  defaultExpanded = true,
  children,
  badge,
}: CollapsibleSectionProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const chevronRotation = useSharedValue(defaultExpanded ? 0 : -90);
  const contentHeight = useSharedValue(defaultExpanded ? 1 : 0);

  const toggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    chevronRotation.value = withSpring(next ? 0 : -90, { damping: 15, stiffness: 200 });
    contentHeight.value = withTiming(next ? 1 : 0, { duration: 250 });
  }, [expanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    maxHeight: contentHeight.value === 0 ? 0 : undefined,
    opacity: contentHeight.value,
    overflow: "hidden",
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggle} style={styles.header} accessibilityState={{ expanded }} accessibilityLabel={title}>
        <View style={styles.headerLeft}>
          <Animated.Text style={[styles.chevron, chevronStyle, { color: colors.textSecondary }]}>{'\u25BC'}</Animated.Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.white }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
      {expanded ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={[styles.content, contentStyle]}>
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

export default CollapsibleSection;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  title: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    paddingTop: SPACING.xs,
  },
});
