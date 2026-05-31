import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MarketplaceListing } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { formatRelativeTime } from "../../utils/formatting";

interface ListingCardProps {
  listing: MarketplaceListing;
  onPress: () => void;
}

export function ListingCard({ listing, onPress }: ListingCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Badge label={listing.category} variant="primary" size="sm" />
        <Text className="text-xs text-gray-400">
          {formatRelativeTime(listing.createdAt)}
        </Text>
      </View>

      <Text
        className="text-base font-semibold text-gray-900 mb-1"
        numberOfLines={2}
      >
        {listing.title}
      </Text>

      {listing.description && (
        <Text className="text-sm text-gray-500 mb-3" numberOfLines={2}>
          {listing.description}
        </Text>
      )}

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Avatar
            uri={listing.seller.avatarUrl}
            name={listing.seller.username}
            size="sm"
          />
          <Text className="text-sm text-gray-600 ml-2">
            {listing.seller.username}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-lg font-bold text-primary-700">
            {listing.price} {listing.currency}
          </Text>
          <Text className="text-xs text-gray-400">Qty: {listing.quantity}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
