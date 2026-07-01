import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  useThemeColors,
} from "@/styles/tokens";
import { MarketplaceListing } from "@/types";
import { ProductCardHorizontal } from "@components/marketplace/ProductCardHorizontal";

interface FeaturedRowProps {
  listings: MarketplaceListing[];
  onListingPress: (listing: MarketplaceListing) => void;
  onBuy?: (listing: MarketplaceListing) => void;
}

function FeaturedRowComponent({
  listings,
  onListingPress,
  onBuy,
}: FeaturedRowProps) {
  const colors = useThemeColors();
  if (listings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>⭐</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Featured</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {listings.length} listing{listings.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {listings.map((listing) => (
          <View key={listing.id} style={styles.cardWrapper}>
            <ProductCardHorizontal
              listing={listing}
              onPress={() => onListingPress(listing)}
              onBuy={onBuy ? () => onBuy(listing) : undefined}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export const FeaturedRow = React.memo(FeaturedRowComponent);
export default FeaturedRow;

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm + 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.text,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  cardWrapper: {
    marginRight: SPACING.sm + 2,
  },
});
