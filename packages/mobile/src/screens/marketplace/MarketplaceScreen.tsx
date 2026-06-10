import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useMarketplace } from "../../hooks/useMarketplace";
import { ListingCard } from "../../components/marketplace/ListingCard";
import { CategoryFilter } from "../../components/marketplace/CategoryFilter";
// import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { MarketplaceListing } from "../../types";

const { width } = Dimensions.get("window");

const FEATURED_EMOJIS: Record<string, string> = {
  seeds: "🌱",
  fertilizers: "🧪",
  tools: "🔧",
  services: "🛠️",
  harvest: "🌾",
};

export function MarketplaceScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { listings, isLoading, isRefreshing, error: _error, refresh, loadMore } =
    useMarketplace({
      category: selectedCategory === "all" ? undefined : selectedCategory,
      search: searchQuery || undefined,
    });

  const handleListingPress = useCallback(
    (listing: MarketplaceListing) => {
      router.push({ pathname: "/listing-detail/[listingId]", params: { listingId: listing.id } });
    },
    [router],
  );

  const filteredListings = searchQuery
    ? listings.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : listings;

  const featured = filteredListings.slice(0, 3);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="px-4 pt-3 pb-1">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search listings..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text className="text-gray-400">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filter */}
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Main Content */}
      {isLoading && listings.length === 0 ? (
        <View className="flex-1 px-4 pt-4">
          {/* Featured skeleton */}
          <View className="mb-4">
            <SkeletonLoader width="45%" height={20} borderRadius={6} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              {[0, 1].map((i) => (
                <View
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                  style={{ width: width * 0.7 }}
                >
                  <SkeletonLoader width="100%" height={112} borderRadius={0} />
                  <View className="p-3">
                    <SkeletonLoader width="80%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
                    <View className="flex-row items-center justify-between">
                      <SkeletonLoader width="40%" height={12} borderRadius={4} />
                      <SkeletonLoader width={50} height={14} borderRadius={4} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
          {/* Section header skeleton */}
          <SkeletonLoader width="35%" height={18} borderRadius={6} style={{ marginBottom: 4 }} />
          <SkeletonLoader width="50%" height={12} borderRadius={4} style={{ marginBottom: 16 }} />
          {/* Listing card skeletons */}
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row">
              <SkeletonLoader width={80} height={80} borderRadius={12} />
              <View className="flex-1 ml-3 justify-center">
                <SkeletonLoader width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="60%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                <View className="flex-row items-center justify-between">
                  <SkeletonLoader width="30%" height={12} borderRadius={4} />
                  <SkeletonLoader width={60} height={16} borderRadius={4} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          title="No listings found"
          description={
            searchQuery
              ? `No results for "${searchQuery}"`
              : "No items available in this category"
          }
          icon="🏪"
        />
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item: MarketplaceListing) => item.id}
          ListHeaderComponent={() => (
            <>
              {/* Featured Section */}
              {featured.length > 0 && selectedCategory === "all" && !searchQuery && (
                <View className="px-4 mb-4">
                  <Text className="text-lg font-bold text-gray-900 mb-3">
                    ⭐ Featured Listings
                  </Text>
                  <FlatList
                    horizontal
                    data={featured}
                    keyExtractor={(item: MarketplaceListing) => `featured-${item.id}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12 }}
                    renderItem={({ item }: { item: MarketplaceListing }) => (
                      <TouchableOpacity
                        onPress={() => handleListingPress(item)}
                        activeOpacity={0.8}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        style={{ width: width * 0.7 }}
                      >
                        <View className="h-28 bg-gradient-to-br from-primary-50 to-green-50 items-center justify-center">
                          <Text className="text-4xl">
                            {FEATURED_EMOJIS[item.category] || "🌿"}
                          </Text>
                        </View>
                        <View className="p-3">
                          <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View className="flex-row items-center justify-between mt-1">
                            <Text className="text-xs text-gray-400">
                              {item.seller?.username || "Unknown"}
                            </Text>
                            <Text className="text-sm font-bold text-primary-600">
                              {item.price} {item.currency}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

              {/* Section Header */}
              <View className="px-4 mb-2">
                <Text className="text-base font-bold text-gray-900">
                  {searchQuery ? `Results for "${searchQuery}"` : "All Listings"}
                </Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  {filteredListings.length} item{filteredListings.length !== 1 ? "s" : ""} available
                </Text>
              </View>
            </>
          )}
          renderItem={({ item }: { item: MarketplaceListing }) => (
            <View className="px-4">
              <ListingCard
                listing={item}
                onPress={() => handleListingPress(item)}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Create Listing FAB */}
      <TouchableOpacity
        onPress={() => router.push("/create-listing")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-2xl font-bold">+</Text>
      </TouchableOpacity>
    </View>
  );
}
