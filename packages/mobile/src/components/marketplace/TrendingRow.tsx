import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import {
  useThemeColors,
  SPACING,
  TYPOGRAPHY,
} from "@/styles/tokens";
import { MarketplaceListing } from "@/types";
import { ProductCardHorizontal } from "@components/marketplace/ProductCardHorizontal";

interface TrendingRowProps {
  listings: MarketplaceListing[];
  onListingPress: (listing: MarketplaceListing) => void;
  onBuy?: (listing: MarketplaceListing) => void;
}

function TrendingRowComponent({
  listings,
  onListingPress,
  onBuy,
}: TrendingRowProps) {
  const colors = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          color: colors.text,
        },
        headerSubtitle: {
          ...TYPOGRAPHY.caption,
          color: colors.textMuted,
        },
        scrollContent: {
          paddingHorizontal: SPACING.md,
        },
        cardWrapper: {
          marginRight: SPACING.sm + 2,
        },
      }),
    [colors],
  );

  if (listings.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>🔥</Text>
          <Text style={styles.headerTitle}>Trending</Text>
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

export const TrendingRow = React.memo(TrendingRowComponent);
export default TrendingRow;
