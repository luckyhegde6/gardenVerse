import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useGarden } from "../../hooks/useGarden";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { WaterButton } from "../../components/garden/WaterButton";
import { FertilizeButton } from "../../components/garden/FertilizeButton";
import { HarvestButton } from "../../components/garden/HarvestButton";
import { CropSprite } from "../../components/garden/CropSprite";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  formatDate,
  formatRelativeTime,
  formatGrowthStage,
} from "../../utils/formatting";
import { GardenStackParamList, CropStatus } from "../../types";

type CropDetailRouteProp = RouteProp<GardenStackParamList, "CropDetail">;

function getHealthTip(health: number): string {
  if (health >= 80) return "⭐ Excellent condition! Keep up the good work.";
  if (health >= 60) return "👍 Healthy. Regular watering will help.";
  if (health >= 40) return "⚠️ Needs attention. Check water and nutrients.";
  return "🚨 Critical! Water and fertilize immediately.";
}

function getStreakLabel(streak: number): { label: string; emoji: string; color: string } {
  if (streak >= 30) return { label: "Legendary", emoji: "🔥", color: "#dc2626" };
  if (streak >= 14) return { label: "Dedicated", emoji: "⭐", color: "#d97706" };
  if (streak >= 7) return { label: "Consistent", emoji: "💪", color: "#16a34a" };
  if (streak >= 3) return { label: "Getting started", emoji: "👍", color: "#6366f1" };
  return { label: "New", emoji: "🌱", color: "#9ca3af" };
}

export function CropDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<CropDetailRouteProp>();
  const { cropId } = route.params;
  const { getCropById, waterCrop, fertilizeCrop, harvestCrop, isLoading, gardens } = useGarden();

  const crop = getCropById(cropId);
  const garden = gardens.find(g => g.crops?.some((c: any) => c.id === cropId));
  const isVirtual = garden?.type === "VIRTUAL";

  if (isLoading && !crop) {
    return <LoadingSpinner fullScreen />;
  }

  if (!crop) {
    return (
      <EmptyState
        title="Crop not found"
        description="This crop may have been removed"
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const healthColor = crop.health >= 70 ? "#22c55e" : crop.health >= 40 ? "#f59e0b" : "#ef4444";
  const stageColor = crop.growthStage >= 100 ? "#22c55e" : "#3b82f6";
  const isMature = crop.status === CropStatus.MATURE;
  const isHarvested = crop.status === CropStatus.HARVESTED;
  const isUnhealthy = crop.status === CropStatus.WILTED || crop.status === CropStatus.DISEASED;
  const streak = getStreakLabel(crop.careStreak || 0);

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {isVirtual && (
        <View className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <Text className="text-amber-700 text-xs text-center font-medium">
            ⚡ Virtual Garden — 100x Growth Speed Active
          </Text>
        </View>
      )}

      {/* Header */}
      <View className="bg-white items-center py-8">
        <CropSprite crop={crop} size={96} />
        <Text className="text-xl font-bold text-gray-900 mt-3">{crop.name}</Text>
        {crop.species && <Text className="text-sm text-gray-500 italic">{crop.species}</Text>}
        <View className="flex-row mt-2 gap-2">
          <Badge label={crop.status} variant={isHarvested ? "neutral" : isUnhealthy ? "error" : isMature ? "success" : "primary"} size="sm" />
        </View>
      </View>

      <View className="px-4 py-4">
        {/* Care Streak Card */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-900">💚 Care Streak</Text>
            <Badge label={`${crop.careStreak || 0} days`} variant={streak.label === "Legendary" ? "error" : streak.label === "Dedicated" ? "warning" : "primary"} size="sm" />
          </View>
          <View className="flex-row items-center gap-2 mb-1">
            <Text style={{ fontSize: 24 }}>{streak.emoji}</Text>
            <View>
              <Text className="text-sm font-medium text-gray-800">{streak.label}</Text>
              <Text className="text-xs text-gray-400">Total care actions: {crop.totalCareCount || 0}</Text>
            </View>
          </View>
          <ProgressBar value={Math.min(100, ((crop.careStreak || 0) / 30) * 100)} color={streak.color} height={6} />
          <Text className="text-xs text-gray-400 mt-1">30 days to reach Legendary streak</Text>
        </Card>

        {/* Growth Progress */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">Growth Stage</Text>
          <ProgressBar value={crop.growthStage} color={stageColor} height={12} showLabel labelPosition="right" />
          <Text className="text-sm text-gray-500 mt-1">{formatGrowthStage(crop.growthStage)}</Text>
        </Card>

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <Card className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Health</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: healthColor }} />
              <Text className="text-base font-bold text-gray-900">{crop.health}%</Text>
            </View>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Hydration</Text>
            <Text className="text-base font-bold text-blue-600">{crop.hydration}%</Text>
          </Card>
        </View>

        <View className="flex-row gap-3 mb-4">
          <Card className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Nutrients</Text>
            <Text className="text-base font-bold text-earth-600">{crop.nutrientLevel}%</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Planted</Text>
            <Text className="text-base font-bold text-gray-900">{formatRelativeTime(crop.plantedAt)}</Text>
          </Card>
        </View>

        {/* Health Tip */}
        <Card className="mb-4">
          <Text className="text-sm font-semibold text-gray-900 mb-1">💡 Health Tip</Text>
          <Text className="text-xs text-gray-500">{getHealthTip(crop.health)}</Text>
        </Card>

        {/* Dates */}
        <Card className="mb-4">
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-gray-500">Planted</Text>
              <Text className="text-sm font-medium text-gray-900">{formatDate(crop.plantedAt)}</Text>
            </View>
            {crop.estimatedHarvest && (
              <View className="items-end">
                <Text className="text-xs text-gray-500">Est. Harvest</Text>
                <Text className="text-sm font-medium text-gray-900">{formatDate(crop.estimatedHarvest)}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Weather Impact */}
        <Card className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">☀️</Text>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-900 mb-0.5">Weather Impact</Text>
              <Text className="text-xs text-gray-500">
                {isVirtual ? "Virtual gardens are not affected by weather" : "Current conditions are favorable for growth"}
              </Text>
            </View>
          </View>
        </Card>

        {/* AI Analysis Button */}
        <TouchableOpacity className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl px-4 py-3 mb-4 flex-row items-center justify-center">
          <Text className="text-lg mr-2">🤖</Text>
          <Text className="text-white font-semibold">AI Health Analysis</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        {!isHarvested && (
          <View className="flex-row gap-3 mb-6">
            <WaterButton onPress={() => waterCrop(crop.id)} className="flex-1" />
            <FertilizeButton onPress={() => fertilizeCrop(crop.id)} className="flex-1" />
            {isMature && <HarvestButton onPress={() => harvestCrop(crop.id)} className="flex-1" />}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
