import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { ProgressBar } from "@components/ui/ProgressBar";
import GamificationService, {
  AchievementData,
} from "@services/gamification";

type Achievement = AchievementData;

export function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await GamificationService.getAchievements();
      setAchievements(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load achievements";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlocked = achievements.filter((a) => a.completed);
  const inProgress = achievements.filter((a) => !a.completed);
  const totalXp = achievements.reduce((s, a) => s + a.xpReward, 0);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-sm text-gray-500 mt-3">
          Loading achievements…
        </Text>
      </View>
    );
  }

  if (error && achievements.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-4xl mb-3">⚠️</Text>
        <Text className="text-base font-semibold text-gray-900 mb-1">
          Couldn't load achievements
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-4">
          {error}
        </Text>
        <Text
          className="text-sm font-semibold text-primary-700"
          onPress={() => fetchAchievements()}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchAchievements(true)}
          tintColor="#059669"
        />
      }
    >
      <View className="px-4 py-4">
        {/* Summary */}
        <Card className="mb-4 items-center py-6 bg-primary-800">
          <Text className="text-4xl mb-2">🏆</Text>
          <Text className="text-white text-2xl font-bold">
            {unlocked.length}/{achievements.length}
          </Text>
          <Text className="text-primary-200 text-sm">
            Achievements Unlocked
          </Text>
          <Text className="text-white/60 text-xs mt-2">
            {totalXp.toLocaleString()} Total XP Available
          </Text>
        </Card>

        {/* Recently Unlocked */}
        {unlocked.length > 0 && (
          <View className="mb-4">
            <Text className="text-base font-bold text-gray-900 mb-3">
              Recently Unlocked
            </Text>
            {unlocked.slice(0, 3).map((achievement) => (
              <Card
                key={achievement.id}
                className="flex-row items-center mb-2 bg-green-50 border border-green-200"
              >
                <Text className="text-3xl mr-3">{achievement.icon}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {achievement.name}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {achievement.description}
                  </Text>
                </View>
                <Badge
                  label={`+${achievement.xpReward}XP`}
                  variant="success"
                  size="sm"
                />
              </Card>
            ))}
          </View>
        )}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <>
            <Text className="text-base font-bold text-gray-900 mb-3">
              In Progress
            </Text>
            {inProgress.map((achievement) => (
              <Card key={achievement.id} className="mb-3">
                <View className="flex-row items-start">
                  <Text className="text-2xl mr-3">{achievement.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {achievement.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mb-2">
                      {achievement.description}
                    </Text>
                    <ProgressBar
                      value={achievement.progress}
                      maxValue={achievement.maxProgress}
                      height={6}
                      showLabel
                      labelPosition="right"
                    />
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-xs text-gray-400">
                        {achievement.progress}/{achievement.maxProgress}
                      </Text>
                      <Text className="text-xs text-amber-600">
                        +{achievement.xpReward} XP
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {achievements.length === 0 && !loading && (
          <Card className="items-center py-8">
            <Text className="text-3xl mb-2">🎯</Text>
            <Text className="text-sm text-gray-500">
              No achievements yet — start gardening to unlock them!
            </Text>
          </Card>
        )}

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
