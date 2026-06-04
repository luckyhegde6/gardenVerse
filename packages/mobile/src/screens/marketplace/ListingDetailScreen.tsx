import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { useMarketplace } from "../../hooks/useMarketplace";
import { formatRelativeTime } from "../../utils/formatting";
import { MarketplaceListing } from "../../types";

export function ListingDetailScreen() {
  const router = useRouter();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { getListingById } = useMarketplace();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getListingById(listingId);
        setListing(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    })();
  }, [listingId, getListingById]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-500 mt-3">Loading listing...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-4xl mb-3">😕</Text>
        <Text className="text-gray-900 text-lg font-semibold mb-1">
          Could not load listing
        </Text>
        <Text className="text-gray-500 text-center mb-4">{error}</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const seller = listing.seller || {};

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Image */}
      {listing.images && listing.images.length > 0 ? (
        <Image
          source={{ uri: listing.images[0] }}
          className="w-full h-64"
          resizeMode="cover"
        />
      ) : (
        <View className="h-64 bg-gray-200 items-center justify-center">
          <Text className="text-6xl">
            {listing.category === "vegetables"
              ? "🥦"
              : listing.category === "herbs"
              ? "🌿"
              : listing.category === "plants"
              ? "🌱"
              : listing.category === "crafts"
              ? "🧵"
              : "🌾"}
          </Text>
        </View>
      )}

      <View className="px-4 py-4">
        {/* Title and Price */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {listing.title}
            </Text>
            <Badge label={listing.category} variant="primary" size="sm" />
            <Badge
              label={listing.status}
              variant={listing.status === "ACTIVE" ? "success" : "neutral"}
              size="sm"
            />
          </View>
          <View className="items-end">
            <Text className="text-xl font-bold text-primary-600">
              {listing.price} {listing.currency}
            </Text>
            <Text className="text-xs text-gray-400">
              Qty: {listing.quantity}
            </Text>
          </View>
        </View>

        {/* Seller Info */}
        <Card className="flex-row items-center mb-4">
          {seller.username && (
            <>
              <Avatar name={seller.displayName || seller.username} size="md" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {seller.displayName || seller.username}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-400">@{seller.username}</Text>
                  {seller.marketplaceReliability != null && (
                    <>
                      <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                      <Text className="text-xs text-green-600">
                        Reliability: {seller.marketplaceReliability}%
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Description */}
        {listing.description && (
          <Card className="mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Description
            </Text>
            <Text className="text-sm text-gray-600 leading-6">
              {listing.description}
            </Text>
          </Card>
        )}

        {/* Listing Details */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Details
          </Text>
          <DetailRow label="Category" value={listing.category} />
          <DetailRow label="Quantity" value={String(listing.quantity)} />
          <DetailRow label="Price" value={`${listing.price} ${listing.currency}`} />
          {listing.location && <DetailRow label="Location" value={listing.location} />}
          <DetailRow
            label="Listed"
            value={formatRelativeTime(listing.createdAt)}
          />
          {listing.isLocal && <DetailRow label="Local Pickup" value="Yes" />}
        </Card>

        {/* Action Buttons */}
        <Button
          title={listing.status === "ACTIVE" ? "Buy Now" : "Not Available"}
          onPress={() => {}}
          size="lg"
          className="mb-3"
          disabled={listing.status !== "ACTIVE"}
        />

        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity className="flex-1 flex-row items-center justify-center border border-primary-600 rounded-xl py-3">
            <Text className="text-primary-600 font-semibold text-sm">
              Share
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 flex-row items-center justify-center border border-red-400 rounded-xl py-3">
            <Text className="text-red-500 font-semibold text-sm">Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{value}</Text>
    </View>
  );
}
