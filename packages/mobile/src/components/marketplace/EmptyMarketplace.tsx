import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  useThemeColors,
} from "@/styles/tokens";

interface EmptyMarketplaceProps {
  /** If true, shows search-specific empty state */
  isSearch?: boolean;
  /** The search query (shown in description when isSearch is true) */
  searchQuery?: string;
  /** Called when "Create Listing" button is pressed */
  onCreateListing?: () => void;
  /** Called when "Browse All" / "Reset Filters" button is pressed */
  onResetFilters?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ActionButton({
  title,
  onPress,
  variant = "primary",
  colors,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  colors: ReturnType<typeof useThemeColors>;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.actionButton,
        variant === "secondary"
          ? {
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: colors.border,
            }
          : { backgroundColor: colors.primary },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text
        style={[
          styles.actionButtonText,
          { color: variant === "secondary" ? colors.text : colors.white },
        ]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
}

export function EmptyMarketplace({
  isSearch = false,
  searchQuery,
  onCreateListing,
  onResetFilters,
}: EmptyMarketplaceProps) {
  const colors = useThemeColors();
  const emoji = isSearch ? "\uD83D\uDD0D" : "\uD83C\uDFEA";
  const title = isSearch ? "No results found" : "No listings yet";
  const description = isSearch
    ? searchQuery
      ? `No listings match "${searchQuery}". Try a different search term or browse all listings.`
      : "No listings match your search. Try adjusting your search or filters."
    : "Be the first to create a listing in the marketplace and start trading with your community.";

  const handleCreateListing = useCallback(() => {
    onCreateListing?.();
  }, [onCreateListing]);

  const handleResetFilters = useCallback(() => {
    onResetFilters?.();
  }, [onResetFilters]);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={styles.icon}>{emoji}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

      <View style={styles.actionsContainer}>
        {isSearch && onResetFilters ? (
          <ActionButton
            title="Browse All"
            onPress={handleResetFilters}
            variant="secondary"
            colors={colors}
          />
        ) : null}

        {onCreateListing ? (
          <ActionButton
            title="Create Listing"
            onPress={handleCreateListing}
            variant="primary"
            colors={colors}
          />
        ) : null}

        {onResetFilters && !isSearch ? (
          <ActionButton
            title="Browse All"
            onPress={handleResetFilters}
            variant="secondary"
            colors={colors}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

export default EmptyMarketplace;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...TYPOGRAPHY.headingM,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionButton: {
    minWidth: 140,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  actionButtonTextSecondary: {
    color: COLORS.text,
  },
});
