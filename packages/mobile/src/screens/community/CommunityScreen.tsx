import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { GroupCard } from "../../components/community/GroupCard";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Group } from "../../types";
import api from "../../services/api";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "GreenMaster", score: 15420, avatar: "🌿" },
  { rank: 2, name: "EcoWarrior", score: 12380, avatar: "🌍" },
  { rank: 3, name: "SeedKing", score: 10950, avatar: "🌱" },
];

const CHALLENGES = [
  {
    id: "1",
    title: "Summer Harvest Sprint",
    description: "Harvest 20 crops before summer ends",
    progress: 9,
    target: 20,
    active: true,
  },
  {
    id: "2",
    title: "Watering Warrior",
    description: "Water crops 50 times",
    progress: 32,
    target: 50,
    active: true,
  },
  {
    id: "3",
    title: "Community Supporter",
    description: "Join 3 community groups",
    progress: 1,
    target: 3,
    active: false,
  },
];

export function CommunityScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const resp = await api.get("/community/groups");
      const data = resp.data?.data || resp.data || [];
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroups();
  }, [fetchGroups]);

  const topChallenges = CHALLENGES.filter((c) => c.active).slice(0, 2);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
          <Text className="text-lg font-bold text-gray-900">🏆 Leaderboard</Text>
          <TouchableOpacity>
            <Text className="text-primary-600 text-sm font-medium">
              See All
            </Text>
          </TouchableOpacity>
        </View>
        {MOCK_LEADERBOARD.map((entry) => (
          <View
            key={entry.rank}
            className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-2 border border-gray-100"
          >
            <Text
              className={`text-lg font-bold w-8 ${
                entry.rank === 1
                  ? "text-amber-500"
                  : entry.rank === 2
                    ? "text-gray-400"
                    : entry.rank === 3
                      ? "text-amber-700"
                      : "text-gray-400"
              }`}
            >
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

      {/* Active Challenges */}
      {topChallenges.length > 0 && (
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            🎯 Active Challenges
          </Text>
          {topChallenges.map((challenge) => (
            <Card key={challenge.id} className="mb-2">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {challenge.title}
                </Text>
                <Badge label="Active" variant="success" size="sm" />
              </View>
              <Text className="text-xs text-gray-500 mb-2">
                {challenge.description}
              </Text>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                />
              </View>
              <Text className="text-xs text-gray-400 mt-1">
                {challenge.progress}/{challenge.target}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* Groups */}
      <View className="px-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-gray-900">👥 Groups</Text>
          <TouchableOpacity>
            <Text className="text-primary-600 text-sm font-medium">
              + Create Group
            </Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <LoadingSpinner message="Loading groups..." />
        ) : groups.length === 0 ? (
          <Card className="p-6 items-center">
            <Text className="text-3xl mb-2">🌐</Text>
            <Text className="text-gray-500 text-sm text-center">
              No groups yet. Create the first one!
            </Text>
          </Card>
        ) : (
          groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onPress={() =>
                router.push({ pathname: "/group-detail/[groupId]", params: { groupId: group.id } })
              }
            />
          ))
        )}
      </View>

      {/* Events / Meetups Placeholder */}
      <View className="px-4 mb-8">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          📅 Upcoming Events
        </Text>
        <Card className="p-6 items-center border-dashed border-2 border-gray-200">
          <Text className="text-3xl mb-2">🎉</Text>
          <Text className="text-gray-500 text-sm text-center">
            No upcoming events. Check back later!
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}
