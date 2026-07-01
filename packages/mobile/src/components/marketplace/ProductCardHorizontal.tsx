import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  useThemeColors,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from "@/styles/tokens";
import { MarketplaceListing } from "@/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CATEGORY_EMOJI: Record<string, string> = {
  seeds: "🌱",
  fertilizers: "🧪",
  tools: "🔧",
  services: "🛠️",
  harvest: "🌾",
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] || "🌿";
}

interface ProductCardHorizontalProps {
  listing: MarketplaceListing;
  onPress: () => void;
  onBuy?: () => void;
}

function ProductCardHorizontalComponent({
  listing,
  onPress,
  onBuy,
}: ProductCardHorizontalProps) {
  const colors = useThemeColors();
  const [imageError, setImageError] = useState(false);
  const scale = useSharedValue(1);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: 300,
          backgroundColor: colors.surface,
          borderRadius: BORDER_RADIUS.md,
          ...SHADOWS.sm,
          flexDirection: "row",
          overflow: "hidden",
        },
        imageContainer: {
          width: 110,
          height: 140,
          backgroundColor: colors.surfaceVariant,
        },
        image: {
          width: "100%",
          height: "100%",
        },
        imageFallback: {
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceVariant,
        },
        fallbackEmoji: {
          fontSize: 36,
        },
        info: {
          flex: 1,
          padding: SPACING.sm + 2,
          justifyContent: "space-between",
        },
        categoryRow: {
          flexDirection: "row",
          marginBottom: SPACING.xs,
        },
        categoryBadge: {
          backgroundColor: colors.primary,
          paddingHorizontal: SPACING.sm - 2,
          paddingVertical: 1,
          borderRadius: BORDER_RADIUS.sm,
        },
        categoryBadgeText: {
          ...TYPOGRAPHY.caption,
          color: colors.white,
          fontWeight: "600",
          fontSize: 10,
          textTransform: "capitalize",
        },
        title: {
          ...TYPOGRAPHY.bodySmall,
          fontWeight: "600",
          color: colors.text,
        },
        seller: {
          ...TYPOGRAPHY.caption,
          color: colors.textSecondary,
          fontSize: 11,
        },
        footer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        priceRow: {
          flexDirection: "row",
          alignItems: "baseline",
          gap: 2,
        },
        price: {
          ...TYPOGRAPHY.headingS,
          fontSize: 16,
          color: colors.primary,
          fontWeight: "700",
        },
        currency: {
          ...TYPOGRAPHY.caption,
          color: colors.textSecondary,
          fontSize: 11,
        },
        buyButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: SPACING.sm + 2,
          paddingVertical: SPACING.xs - 1,
          borderRadius: BORDER_RADIUS.sm,
        },
        buyButtonPressed: {
          opacity: 0.8,
        },
        buyButtonText: {
          ...TYPOGRAPHY.label,
          color: colors.white,
          fontWeight: "600",
          fontSize: 12,
        },
      }),
    [colors],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const primaryImage = listing.images && listing.images.length > 0
    ? listing.images[0]
    : null;
  const showImage = primaryImage && !imageError;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${listing.price} ${listing.currency}`}
    >
      <View style={styles.imageContainer}>
        {showImage ? (
          <Image
            source={{ uri: primaryImage as string }}
            style={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackEmoji}>
              {getCategoryEmoji(listing.category)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{listing.category}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <Text style={styles.seller} numberOfLines={1}>
          {listing.seller.displayName || listing.seller.username}
        </Text>

        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{listing.price.toLocaleString()}</Text>
            <Text style={styles.currency}>{listing.currency}</Text>
          </View>
          {onBuy && (
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [
                styles.buyButton,
                pressed && styles.buyButtonPressed,
              ]}
              onPress={(e: any) => {
                e.stopPropagation?.();
                onBuy();
              }}
            >
              <Text style={styles.buyButtonText}>Buy</Text>
            </Pressable>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const ProductCardHorizontal = React.memo(ProductCardHorizontalComponent);
export default ProductCardHorizontal;
