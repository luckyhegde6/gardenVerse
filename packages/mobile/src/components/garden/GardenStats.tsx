import React from "react";
import { View, Text } from "react-native";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { User } from "../../types";

interface GardenStatsProps {
  user: User;
  cropCount: number;
  soilQuality: number;
}

export function GardenStats({
  user,
  cropCount,
  soilQuality,
}: GardenStatsProps) {
  return (
    <Card className="mb-4 bg-primary-800">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-white text-lg font-bold">
            Level {user.level}
          </Text>
          <Text className="text-primary-200 text-xs">
            {user.displayName || user.username}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-white text-lg font-bold">
            {user.greenCredits}
          </Text>
          <Text className="text-primary-200 text-xs">Green Credits</Text>
        </View>
      </View>

      <ProgressBar
        value={user.experience}
        color="#86efac"
        trackColor="rgba(255,255,255,0.2)"
        height={6}
      />
      <Text className="text-primary-200 text-xs mt-1">
        {user.experience} / 1000 XP
      </Text>

      <View className="flex-row justify-between mt-4">
        <StatItem label="Crops" value={cropCount.toString()} />
        <StatItem label="Soil" value={`${Math.round(soilQuality)}%`} />
        <StatItem label="Streak" value={`${user.currentStreak} days`} />
        <StatItem
          label="Eco Score"
          value={user.sustainabilityScore.toString()}
        />
      </View>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-white font-bold text-base">{value}</Text>
      <Text className="text-primary-200 text-xs">{label}</Text>
    </View>
  );
}
