import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { GroupCard } from "../../components/community/GroupCard";
import { CommunityStackParamList } from "../../types";

type CommunityNavProp = NativeStackNavigationProp<
  CommunityStackParamList,
  "CommunityHome"
>;

export function CommunityScreen() {
  const navigation = useNavigation<CommunityNavProp>();

  const mockGroups = [
    {
      id: "1",
      name: "SF Bay Gardeners",
      description: "Local gardening community in the Bay Area",
      type: "REGIONAL",
      region: "California",
      memberCount: 234,
    },
    {
      id: "2",
      name: "Organic Farmers United",
      description: "Sharing organic farming tips and resources",
      type: "TOPIC",
      memberCount: 1567,
    },
    {
      id: "3",
      name: "Seed Swappers",
      description: "Trade seeds with gardeners worldwide",
      type: "TOPIC",
      memberCount: 892,
    },
    {
      id: "4",
      name: "Urban Garden Collective",
      description: "Gardening in small spaces",
      type: "REGIONAL",
      region: "Global",
      memberCount: 3451,
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Find Nearby Gardeners */}
      <Card className="mx-4 mt-4 bg-primary-800 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">
              Find Nearby Gardeners
            </Text>
            <Text className="text-primary-200 text-sm mt-1">
              Connect with gardeners in your area
            </Text>
          </View>
          <TouchableOpacity className="bg-white/20 rounded-xl px-4 py-2">
            <Text className="text-white font-semibold">Explore</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Leaderboard Preview */}
      <View className="px-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-gray-900">Leaderboard</Text>
          <TouchableOpacity>
            <Text className="text-primary-600 text-sm font-medium">
              See All
            </Text>
          </TouchableOpacity>
        </View>
        {[
          { rank: 1, name: "GreenMaster", score: 15420, avatar: "🌿" },
          { rank: 2, name: "EcoWarrior", score: 12380, avatar: "🌍" },
          { rank: 3, name: "SeedKing", score: 10950, avatar: "🌱" },
        ].map((entry) => (
          <View
            key={entry.rank}
            className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-2 border border-gray-100"
          >
            <Text className="text-lg font-bold text-gray-400 w-8">
              #{entry.rank}
            </Text>
            <Text className="text-2xl mr-3">{entry.avatar}</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">
                {entry.name}
              </Text>
            </View>
            <Text className="text-sm font-bold text-primary-700">
              {entry.score.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Seasonal Challenges */}
      <Card className="mx-4 mb-4">
        <Text className="text-base font-semibold text-gray-900 mb-2">
          🏆 Seasonal Challenges
        </Text>
        <View className="bg-green-50 rounded-xl p-3 mb-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-medium text-gray-900">
              Summer Harvest Sprint
            </Text>
            <Badge label="Active" variant="success" size="sm" />
          </View>
          <Text className="text-xs text-gray-500 mt-1">
            Harvest 20 crops before summer ends
          </Text>
          <View className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <View className="h-full bg-primary-500 rounded-full w-[45%]" />
          </View>
          <Text className="text-xs text-gray-400 mt-1">Progress: 9/20</Text>
        </View>
      </Card>

      {/* Groups */}
      <View className="px-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-gray-900">Groups</Text>
          <TouchableOpacity>
            <Text className="text-primary-600 text-sm font-medium">
              Create Group
            </Text>
          </TouchableOpacity>
        </View>
        {mockGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onPress={() =>
              navigation.navigate("GroupDetail", { groupId: group.id })
            }
          />
        ))}
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
