import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal as RNModal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Crop, CropStatus } from "../../types";
import { ProgressBar } from "../ui/ProgressBar";
import { Badge } from "../ui/Badge";
import {
  formatDate,
  formatGrowthStage,
} from "../../utils/formatting";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CropDetailModalProps {
  visible: boolean;
  crop: Crop | null;
  onClose: () => void;
  onWater?: (cropId: string) => void;
  onFertilize?: (cropId: string) => void;
  onHarvest?: (cropId: string) => void;
}

function getHealthColor(health: number): string {
  if (health >= 70) return "#22c55e";
  if (health >= 40) return "#f59e0b";
  return "#ef4444";
}

function getHealthTip(health: number): string {
  if (health >= 80) return "Excellent condition! Keep up the good work.";
  if (health >= 60) return "Healthy. Regular watering will help.";
  if (health >= 40) return "Needs attention. Check water and nutrients.";
  return "Critical! Water and fertilize immediately.";
}

function getStreakLabel(streak: number): { label: string; emoji: string; color: string } {
  if (streak >= 30) return { label: "Legendary", emoji: "🔥", color: "#dc2626" };
  if (streak >= 14) return { label: "Dedicated", emoji: "⭐", color: "#d97706" };
  if (streak >= 7) return { label: "Consistent", emoji: "💪", color: "#16a34a" };
  if (streak >= 3) return { label: "Getting started", emoji: "👍", color: "#6366f1" };
  return { label: "New", emoji: "🌱", color: "#9ca3af" };
}

function computeGrowthTimeline(plantedAt: string, growthStage: number): { daysSincePlanting: number; daysToMature: number } {
  const planted = new Date(plantedAt).getTime();
  const now = Date.now();
  const msSincePlanting = Math.max(0, now - planted);
  const daysSincePlanting = Math.round(msSincePlanting / (1000 * 60 * 60 * 24) * 10) / 10;
  const remaining = Math.max(0, 100 - growthStage);
  const daysToMature = Math.round(remaining * daysSincePlanting / Math.max(1, growthStage) * 10) / 10;
  return { daysSincePlanting: isNaN(daysSincePlanting) ? 0 : daysSincePlanting, daysToMature: isNaN(daysToMature) ? 0 : daysToMature };
}

export function CropDetailModal({
  visible,
  crop,
  onClose,
}: CropDetailModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!crop) return null;

  const healthColor = getHealthColor(crop.health);
  const stageColor = crop.growthStage >= 100 ? "#22c55e" : "#3b82f6";
  const isMature = crop.status === CropStatus.MATURE;
  const isHarvested = crop.status === CropStatus.HARVESTED;
  const isUnhealthy = crop.status === CropStatus.WILTED || crop.status === CropStatus.DISEASED;
  const streak = getStreakLabel(crop.careStreak || 0);
  const timeline = computeGrowthTimeline(crop.plantedAt, crop.growthStage);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback>
            <Animated.View
              className="bg-white rounded-t-3xl"
              style={[
                { transform: [{ translateY }], maxHeight: SCREEN_HEIGHT * 0.85 },
              ]}
            >
              <View className="w-10 h-1 bg-gray-300 rounded-full self-center mt-3 mb-2" />
              <ScrollView showsVerticalScrollIndicator={false} className="px-6 pb-8">
                <View className="items-center py-4">
                  <Text className="text-3xl mb-1">
                    {crop.status === CropStatus.SEED ? "🌱" :
                     crop.status === CropStatus.SPROUTING ? "🌿" :
                     crop.status === CropStatus.GROWING ? "🌳" :
                     crop.status === CropStatus.MATURE ? "🌾" :
                     crop.status === CropStatus.HARVESTED ? "🧺" :
                     crop.status === CropStatus.WILTED ? "🍂" : "🍃"}
                  </Text>
                  <Text className="text-xl font-bold text-gray-900">{crop.name}</Text>
                  {crop.species && <Text className="text-sm text-gray-500 italic">{crop.species}</Text>}
                  <View className="flex-row mt-2 gap-2">
                    <Badge
                      label={crop.status}
                      variant={isHarvested ? "neutral" : isUnhealthy ? "error" : isMature ? "success" : "primary"}
                      size="sm"
                    />
                    <Badge label={`Plot (${crop.plotX ?? "?"}, ${crop.plotY ?? "?"})`} variant="neutral" size="sm" />
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl p-4 mb-3">
                  <Text className="text-sm font-semibold text-gray-900 mb-2">Growth Progress</Text>
                  <ProgressBar value={crop.growthStage} color={stageColor} height={12} showLabel labelPosition="right" />
                  <Text className="text-sm text-gray-500 mt-1">{formatGrowthStage(crop.growthStage)}</Text>
                </View>

                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1 bg-gray-50 rounded-xl p-3">
                    <Text className="text-xs text-gray-500 mb-1">Health</Text>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: healthColor }} />
                      <Text className="text-base font-bold text-gray-900">{crop.health}%</Text>
                    </View>
                  </View>
                  <View className="flex-1 bg-gray-50 rounded-xl p-3">
                    <Text className="text-xs text-gray-500 mb-1">Hydration</Text>
                    <Text className="text-base font-bold text-blue-600">{crop.hydration}%</Text>
                  </View>
                </View>

                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1 bg-gray-50 rounded-xl p-3">
                    <Text className="text-xs text-gray-500 mb-1">Nutrients</Text>
                    <Text className="text-base font-bold text-earth-600">{crop.nutrientLevel}%</Text>
                  </View>
                  <View className="flex-1 bg-gray-50 rounded-xl p-3">
                    <Text className="text-xs text-gray-500 mb-1">Care Streak</Text>
                    <Text className="text-base font-bold text-gray-900">{crop.careStreak || 0} days</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-semibold text-gray-900">Care Streak</Text>
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
                </View>

                <View className="bg-gray-50 rounded-xl p-4 mb-3">
                  <Text className="text-sm font-semibold text-gray-900 mb-2">Growth Timeline</Text>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-xs text-gray-500">Days since planting</Text>
                    <Text className="text-xs font-semibold text-gray-700">{timeline.daysSincePlanting}d</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-xs text-gray-500">Estimated to mature</Text>
                    <Text className="text-xs font-semibold text-gray-700">{timeline.daysToMature}d</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-500">Planted on</Text>
                    <Text className="text-xs font-semibold text-gray-700">{formatDate(crop.plantedAt)}</Text>
                  </View>
                  {crop.estimatedHarvest && (
                    <View className="flex-row justify-between mt-2">
                      <Text className="text-xs text-gray-500">Est. harvest</Text>
                      <Text className="text-xs font-semibold text-gray-700">{formatDate(crop.estimatedHarvest)}</Text>
                    </View>
                  )}
                </View>

                <View className="bg-amber-50 rounded-xl p-4 mb-2">
                  <Text className="text-xs font-semibold text-amber-800 mb-1">Health Tip</Text>
                  <Text className="text-xs text-amber-700">{getHealthTip(crop.health)}</Text>
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
