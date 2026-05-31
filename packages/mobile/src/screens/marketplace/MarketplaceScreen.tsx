import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMarketplace } from "../../hooks/useMarketplace";
import { ListingCard } from "../../components/marketplace/ListingCard";
import { CategoryFilter } from "../../components/marketplace/CategoryFilter";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { MarketplaceStackParamList, MarketplaceListing } from "../../types";

type MarketplaceNavProp = NativeStackNavigationProp<
  MarketplaceStackParamList,
  "MarketplaceHome"
>;

export function MarketplaceScreen() {
  const navigation = useNavigation<MarketplaceNavProp>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { listings, isLoading, isRefreshing, error, refresh, loadMore } =
    useMarketplace({
      category: selectedCategory === "all" ? undefined : selectedCategory,
      search: searchQuery || undefined,
    });

  const handleListingPress = useCallback(
    (listing: MarketplaceListing) => {
      navigation.navigate("ListingDetail", { listingId: listing.id });
    },
    [navigation],
  );

  const filteredListings = searchQuery
    ? listings.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : listings;

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

      {/* Listings */}
      {isLoading && listings.length === 0 ? (
        <LoadingSpinner fullScreen message="Loading listings..." />
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
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
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Create Listing FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate("CreateListing")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-2xl font-bold">+</Text>
      </TouchableOpacity>
    </View>
  );
}
