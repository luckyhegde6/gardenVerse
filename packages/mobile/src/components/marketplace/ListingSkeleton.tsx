import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import {
  useThemeColors,
  SPACING,
  BORDER_RADIUS,
  ColorScheme,
} from "@/styles/tokens";

interface ListingSkeletonProps {
  /** Visual variant: "card" (vertical) or "horizontal" */
  variant?: "card" | "horizontal";
  /** Number of skeleton placeholders to render. Defaults to 3. */
  count?: number;
}

function SkeletonBlock({
  width,
  height,
  borderRadius = BORDER_RADIUS.sm,
  color,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  color: string;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(pulse.value, [0, 1], [0.35, 0.7]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width: width as number | undefined,
          height,
          borderRadius,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// ─── Card Variant (vertical, like ProductCard) ──────────────────────────────

function CardSkeleton({ colors }: { colors: ColorScheme }) {
  const skeletonColor = colors.surfaceSecondary;
  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.surface }]}>
      {/* Image area */}
      <SkeletonBlock height={130} borderRadius={BORDER_RADIUS.md} color={skeletonColor} />
      {/* Spacer */}
      <View style={styles.cardBody}>
        {/* Title line */}
        <SkeletonBlock width="80%" height={16} color={skeletonColor} />
        <View style={styles.skeletonSpacer} />
        {/* Description line */}
        <SkeletonBlock width="60%" height={12} color={skeletonColor} />
        <View style={styles.skeletonSpacer} />
        {/* Bottom row: seller + price */}
        <View style={styles.cardBottomRow}>
          {/* Seller avatar + name */}
          <View style={styles.cardSellerRow}>
            <SkeletonBlock width={24} height={24} borderRadius={12} color={skeletonColor} />
            <View style={{ width: SPACING.sm }} />
            <SkeletonBlock width={60} height={12} color={skeletonColor} />
          </View>
          {/* Price */}
          <SkeletonBlock width={70} height={18} borderRadius={BORDER_RADIUS.sm} color={skeletonColor} />
        </View>
      </View>
    </View>
  );
}

// ─── Horizontal Variant (like ProductCardHorizontal) ────────────────────────

function HorizontalSkeleton({ colors }: { colors: ColorScheme }) {
  const skeletonColor = colors.surfaceSecondary;
  return (
    <View style={[styles.horizontalContainer, { backgroundColor: colors.surface }]}>
      {/* Image area */}
      <SkeletonBlock width={100} height={100} borderRadius={BORDER_RADIUS.md} color={skeletonColor} />
      {/* Content */}
      <View style={styles.horizontalBody}>
        {/* Title */}
        <SkeletonBlock width="85%" height={16} color={skeletonColor} />
        <View style={styles.skeletonSpacer} />
        {/* Category badge */}
        <SkeletonBlock width={60} height={20} borderRadius={BORDER_RADIUS.full} color={skeletonColor} />
        <View style={styles.skeletonSpacer} />
        {/* Bottom: price + seller */}
        <View style={styles.horizontalBottomRow}>
          <SkeletonBlock width={70} height={16} color={skeletonColor} />
          <SkeletonBlock width={80} height={12} color={skeletonColor} />
        </View>
      </View>
    </View>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function ListingSkeleton({
  variant = "card",
  count = 3,
}: ListingSkeletonProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.wrapper}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={variant === "card" ? styles.cardGap : styles.horizontalGap}>
          {variant === "card" ? <CardSkeleton colors={colors} /> : <HorizontalSkeleton colors={colors} />}
        </View>
      ))}
    </View>
  );
}

export default ListingSkeleton;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },

  // Card variant
  cardContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
  },
  cardBody: {
    padding: SPACING.md,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  cardSellerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardGap: {
    marginBottom: SPACING.md,
  },

  // Horizontal variant
  horizontalContainer: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: "center",
  },
  horizontalBody: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  horizontalBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  horizontalGap: {
    marginBottom: SPACING.sm,
  },

  // Shared
  skeletonSpacer: {
    height: SPACING.sm,
  },
});
