import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PriceBadge } from '../../components/marketplace/PriceBadge';
import { formatRelativeTime, formatDate } from '../../utils/formatting';
import { MarketplaceStackParamList } from '../../types';

type ListingDetailRouteProp = RouteProp<
  MarketplaceStackParamList,
  'ListingDetail'
>;

export function ListingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<ListingDetailRouteProp>();
  const { listingId } = route.params;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Image Carousel Placeholder */}
      <View className="h-64 bg-gray-200 items-center justify-center">
        <Text className="text-6xl">🌾</Text>
      </View>

      <View className="px-4 py-4">
        {/* Title and Price */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              Organic Tomato Seeds
            </Text>
            <Badge label="seeds" variant="primary" size="sm" />
          </View>
          <PriceBadge price={25} currency="GVC" size="lg" />
        </View>

        {/* Seller Info */}
        <Card className="flex-row items-center mb-4">
          <Avatar name="GreenThumb" size="md" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-gray-900">
              GreenThumb
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-400">
                Member since Mar 2024
              </Text>
              <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
              <Text className="text-xs text-green-600">
                Trust Score: 98
              </Text>
            </View>
          </View>
        </Card>

        {/* Description */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Description
          </Text>
          <Text className="text-sm text-gray-600 leading-6">
            High-quality organic tomato seeds, non-GMO. Perfect for home
            gardens. Each packet contains approximately 50 seeds. Grown and
            harvested sustainably.
          </Text>
        </Card>

        {/* Listing Details */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Details
          </Text>
          <DetailRow label="Category" value="Seeds" />
          <DetailRow label="Quantity" value="50 seeds" />
          <DetailRow label="Condition" value="New" />
          <DetailRow label="Location" value="San Francisco, CA" />
          <DetailRow label="Listed" value={formatRelativeTime(new Date().toISOString())} />
        </Card>

        {/* Action Buttons */}
        <Button
          title="Buy Now"
          onPress={() => {}}
          size="lg"
          className="mb-3"
        />

        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity className="flex-1 flex-row items-center justify-center border border-primary-600 rounded-xl py-3">
            <Text className="text-primary-600 font-semibold text-sm">📤 Share</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 flex-row items-center justify-center border border-red-400 rounded-xl py-3">
            <Text className="text-red-500 font-semibold text-sm">🚩 Report</Text>
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
