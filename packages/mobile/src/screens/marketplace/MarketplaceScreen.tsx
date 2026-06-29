import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { SearchBar } from "@components/marketplace/SearchBar";
import { CategoryChip } from "@components/marketplace/CategoryChip";
import { ProductCard } from "@components/marketplace/ProductCard";
import { FeaturedRow } from "@components/marketplace/FeaturedRow";
import { TrendingRow } from "@components/marketplace/TrendingRow";
import { BuyModal } from "@components/marketplace/BuyModal";
import { ListingSkeleton } from "@components/marketplace/ListingSkeleton";
import { EmptyMarketplace } from "@components/marketplace/EmptyMarketplace";
import { useMarketplace } from "@hooks/useMarketplace";
import { MarketplaceListing } from "@/types";
import { COLORS, SPACING, TYPOGRAPHY } from "@/styles/tokens";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: "All", emoji: "\uD83D\uDD00" },
  { label: "Seeds", emoji: "\uD83C\uDF31" },
  { label: "Fertilizers", emoji: "\uD83E\uDDEA" },
  { label: "Tools", emoji: "\uD83D\uDD27" },
  { label: "Services", emoji: "\uD83D\uDEE0\uFE0F" },
  { label: "Harvest", emoji: "\uD83C\uDF3E" },
] as const;

// ─── Animated FAB ────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FAB({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  return (
    <AnimatedPressable
      style={[styles.fab, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="Create listing"
    >
      <Text style={styles.fabText}>+</Text>
    </AnimatedPressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function MarketplaceScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedListing, setSelectedListing] =
    useState<MarketplaceListing | null>(null);

  const {
    listings,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadMore,
  } = useMarketplace({
    category:
      selectedCategory === "all" ? undefined : selectedCategory.toLowerCase(),
    search: searchQuery || undefined,
  });

  const isFiltered =
    selectedCategory !== "all" || searchQuery.length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleListingPress = useCallback(
    (listing: MarketplaceListing) => {
      router.push({
        pathname: "/listing-detail/[listingId]",
        params: { listingId: listing.id },
      });
    },
    [router],
  );

  const handleBuy = useCallback((listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setBuyModalVisible(true);
  }, []);

  const handleBuyClose = useCallback(() => {
    setBuyModalVisible(false);
    setSelectedListing(null);
  }, []);

  const handleBuyConfirm = useCallback(
    (_quantity: number, _couponCode?: string) => {
      handleBuyClose();
    },
    [handleBuyClose],
  );

  const handleCreateListing = useCallback(() => {
    router.push("/create-listing");
  }, [router]);

  const handleResetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSearchQuery("");
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderHeader = useCallback(() => {
    if (listings.length === 0) return null;

    const featured = listings.slice(0, 3);
    const trending = listings.slice(3, 6);

    return (
      <View style={styles.headerSection}>
        {!isFiltered && featured.length > 0 && (
          <FeaturedRow
            listings={featured}
            onListingPress={handleListingPress}
            onBuy={handleBuy}
          />
        )}
        {!isFiltered && trending.length > 0 && (
          <TrendingRow
            listings={trending}
            onListingPress={handleListingPress}
            onBuy={handleBuy}
          />
        )}
      </View>
    );
  }, [listings, isFiltered, handleListingPress, handleBuy]);

  const renderItem = useCallback(
    ({ item, index }: { item: MarketplaceListing; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify()}
        style={styles.listItem}
      >
        <ProductCard
          listing={item}
          onPress={() => handleListingPress(item)}
          onBuy={() => handleBuy(item)}
        />
      </Animated.View>
    ),
    [handleListingPress, handleBuy],
  );

  const keyExtractor = useCallback(
    (item: MarketplaceListing) => item.id,
    [],
  );

  // ── Content state ─────────────────────────────────────────────────────────

  const renderContent = () => {
    // Error state (no cached data)
    if (error && listings.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    // Loading state (first load)
    if (isLoading && listings.length === 0) {
      return (
        <View style={styles.skeletonContainer}>
          <ListingSkeleton variant="card" count={4} />
        </View>
      );
    }

    // Empty state
    if (listings.length === 0) {
      return (
        <EmptyMarketplace
          isSearch={isFiltered}
          searchQuery={searchQuery}
          onCreateListing={handleCreateListing}
          onResetFilters={isFiltered ? handleResetFilters : undefined}
        />
      );
    }

    // Data state
    return (
      <FlashList<MarketplaceListing>
        data={listings}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={280}
        ListHeaderComponent={renderHeader()}
        refreshing={isRefreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent as any}
      />
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Sticky header: SearchBar + CategoryChips */}
      <View style={styles.stickyHeader}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search listings..."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.label}
              label={cat.label}
              emoji={cat.emoji}
              selected={selectedCategory === cat.label.toLowerCase()}
              onPress={() => setSelectedCategory(cat.label.toLowerCase())}
            />
          ))}
        </ScrollView>
      </View>

      {/* Main content area */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Buy confirmation modal */}
      <BuyModal
        visible={buyModalVisible}
        listing={selectedListing}
        onClose={handleBuyClose}
        onConfirm={handleBuyConfirm}
      />

      {/* Create listing FAB */}
      <FAB onPress={handleCreateListing} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stickyHeader: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  categoryRow: {
    gap: SPACING.sm,
  },
  content: {
    flex: 1,
  },

  // Skeleton
  skeletonContainer: {
    padding: SPACING.md,
  },

  // Header section (FeaturedRow + TrendingRow)
  headerSection: {
    paddingTop: SPACING.md,
  },

  // FlashList
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  listItem: {
    marginBottom: SPACING.md,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: "600",
    lineHeight: 30,
  },

  // Error state
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.dangerRed,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});
