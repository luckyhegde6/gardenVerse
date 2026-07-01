import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlotsStore } from "@stores/plotsStore";
import { useGardenStore } from "@stores/gardenStore";
import { useAuthStore } from "@stores/authStore";
import { GardenType, Crop, SoilCheckResult } from "@/types";
import { SkeletonLoader } from "@components/ui/SkeletonLoader";
import { Badge } from "@components/ui/Badge";

function getSoilColor(quality: number): string {
  if (quality >= 70) return "#22c55e";
  if (quality >= 40) return "#eab308";
  return "#ef4444";
}

function getSoilLabel(quality: number): string {
  if (quality >= 70) return "Excellent";
  if (quality >= 40) return "Moderate";
  return "Poor";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PlotDetailScreen() {
  const router = useRouter();
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const user = useAuthStore((s) => s.user);
  const { gardens, crops: storeCrops } = useGardenStore();
  const {
    moveCrop,
    error: storeError,
    clearError,
  } = usePlotsStore();

  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [targetPlotX, setTargetPlotX] = useState("");
  const [targetPlotY, setTargetPlotY] = useState("");
  const [targetGardenId, setTargetGardenId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);

  // Find the plot from gardens
  const plot = gardens.find((g) => g.id === plotId);

  // Get crops for this plot — use plot's own crops or filter store crops
  const plotCrops: Crop[] = plot?.crops ?? storeCrops ?? [];

  // Get other gardens for cross-garden move (level 5+)
  const otherGardens = gardens.filter((g) => g.id !== plotId);
  const userLevel = user?.level ?? 1;
  const canCrossGardenMove = userLevel >= 5;
  const canMoveWithinGarden = userLevel >= 3;

  // Previous soil checks from the plot
  const soilChecks: SoilCheckResult[] = plot?.lastSoilCheck
    ? [plot.lastSoilCheck]
    : [];
  // If plot has soilQualityHistory, we might show it too, but the type only has lastSoilCheck
  // We'll rely on what the backend returns

  const handleMoveCrop = useCallback(async () => {
    if (!selectedCropId) {
      setMoveError("Please select a crop to move.");
      return;
    }

    const x = parseInt(targetPlotX, 10);
    const y = parseInt(targetPlotY, 10);

    if (isNaN(x) || isNaN(y)) {
      setMoveError("Please enter valid target coordinates.");
      return;
    }

    if (targetGardenId && !canCrossGardenMove) {
      setMoveError("Level 5+ required for cross-garden moves.");
      return;
    }

    setMoveLoading(true);
    setMoveError(null);

    try {
      await moveCrop(
        plotId,
        selectedCropId,
        x,
        y,
        targetGardenId ?? undefined,
      );
      setSelectedCropId(null);
      setTargetPlotX("");
      setTargetPlotY("");
      setTargetGardenId(null);
    } catch (err: any) {
      setMoveError(err?.message || "Failed to move crop.");
    } finally {
      setMoveLoading(false);
    }
  }, [
    selectedCropId,
    targetPlotX,
    targetPlotY,
    targetGardenId,
    plotId,
    moveCrop,
    canCrossGardenMove,
  ]);

  // Loading skeleton
  if (!plot && gardens.length > 0) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
          >
            <Text className="text-2xl text-gray-700">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Plot Detail</Text>
        </View>
        <View className="p-4">
          <View className="bg-white rounded-xl p-4 mb-4">
            <SkeletonLoader width={160} height={20} borderRadius={4} />
            <View className="mt-3">
              <SkeletonLoader width="100%" height={14} borderRadius={4} />
            </View>
            <View className="mt-2">
              <SkeletonLoader width="60%" height={14} borderRadius={4} />
            </View>
          </View>
          <View className="bg-white rounded-xl p-4 mb-4">
            <SkeletonLoader width={120} height={18} borderRadius={4} />
            <View className="mt-3 space-y-2">
              <SkeletonLoader width="100%" height={14} borderRadius={4} />
              <SkeletonLoader width="100%" height={14} borderRadius={4} />
              <SkeletonLoader width="100%" height={14} borderRadius={4} />
            </View>
          </View>
          <View className="bg-white rounded-xl p-4">
            <SkeletonLoader width={140} height={18} borderRadius={4} />
            <View className="mt-3">
              <SkeletonLoader width="100%" height={14} borderRadius={4} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!plot) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
          >
            <Text className="text-2xl text-gray-700">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Plot Detail</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-3xl mb-3">🔍</Text>
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            Plot Not Found
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            This plot could not be found. It may have been removed or you may
            not have access to it.
          </Text>
          <TouchableOpacity
            className="mt-6 bg-blue-500 rounded-xl py-3 px-6"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeVariant =
    plot.type === GardenType.VIRTUAL
      ? "info"
      : plot.type === GardenType.REAL
        ? "success"
        : "secondary";

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
        >
          <Text className="text-2xl text-gray-700">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
            Plot #{plot.plotNumber ?? "-"}
          </Text>
          <Text className="text-xs text-gray-500">{plot.name}</Text>
        </View>
        <Badge label={plot.type} variant={typeVariant} size="sm" />
      </View>

      <ScrollView className="flex-1">
        {/* Error Banner */}
        {storeError || moveError ? (
          <View className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center">
            <Text className="text-red-500 mr-2">⚠️</Text>
            <Text className="flex-1 text-red-700 text-sm">
              {moveError || storeError}
            </Text>
            <TouchableOpacity
              onPress={() => {
                clearError();
                setMoveError(null);
              }}
            >
              <Text className="text-red-500 font-medium">✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Info Card */}
        <View className="mx-4 mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">
            Plot Information
          </Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Garden</Text>
              <Text className="text-sm font-medium text-gray-800">
                {plot.name}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Type</Text>
              <Badge label={plot.type} variant={typeVariant} size="sm" />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Plot Number</Text>
              <Text className="text-sm font-medium text-gray-800">
                #{plot.plotNumber ?? "N/A"}
              </Text>
            </View>
            {plot.purchasePrice ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Purchase Price</Text>
                <Text className="text-sm font-medium text-blue-600">
                  {plot.purchasePrice} GC
                </Text>
              </View>
            ) : null}
            {plot.purchasedAt ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Purchased</Text>
                <Text className="text-sm text-gray-700">
                  {formatDate(plot.purchasedAt)}
                </Text>
              </View>
            ) : null}
            {plot.plantMoveCount !== undefined ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Moves Made</Text>
                <Text className="text-sm text-gray-700">
                  {plot.plantMoveCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Soil Card */}
        <View className="mx-4 mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">
            Soil Quality
          </Text>
          <View className="flex-row items-center mb-3">
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-gray-500">Quality Score</Text>
                <Text
                  className="text-xs font-bold"
                  style={{ color: getSoilColor(plot.soilQuality) }}
                >
                  {Math.round(plot.soilQuality)}% -{" "}
                  {getSoilLabel(plot.soilQuality)}
                </Text>
              </View>
              <View className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(plot.soilQuality, 100)}%`,
                    backgroundColor: getSoilColor(plot.soilQuality),
                  }}
                />
              </View>
            </View>
          </View>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Irrigation Level</Text>
              <Text className="text-sm font-medium text-gray-800">
                {plot.irrigationLevel ?? "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Sunlight Exposure</Text>
              <Text className="text-sm font-medium text-gray-800">
                {plot.sunlightExposure ?? "N/A"}
              </Text>
            </View>
            {plot.soilLastCheckedAt ? (
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Last Checked</Text>
                <Text className="text-sm text-gray-700">
                  {formatDate(plot.soilLastCheckedAt)}
                </Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            className="mt-4 bg-green-50 border border-green-200 rounded-xl py-2.5 items-center flex-row justify-center"
            onPress={() =>
              router.push({
                pathname: "/soil-check/[plotId]",
                params: { plotId: plot.id },
              })
            }
            activeOpacity={0.7}
          >
            <Text className="text-green-700 font-medium text-sm">
              🔬 Run Soil Check
            </Text>
          </TouchableOpacity>
        </View>

        {/* Move Crop Section */}
        {plotCrops.length > 0 ? (
          <View className="mx-4 mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">
              Move Crop
            </Text>

            {/* Level Requirements Badges */}
            <View className="flex-row mb-3 space-x-2">
              <Badge
                label={
                  canMoveWithinGarden
                    ? "✅ Move Within Garden"
                    : "🔒 Lvl 3+ Move"
                }
                variant={canMoveWithinGarden ? "success" : "neutral"}
                size="sm"
              />
              <Badge
                label={
                  canCrossGardenMove
                    ? "✅ Cross-Garden"
                    : "🔒 Lvl 5+ Cross-Garden"
                }
                variant={canCrossGardenMove ? "success" : "neutral"}
                size="sm"
              />
            </View>

            {/* Select Crop */}
            <Text className="text-xs text-gray-500 mb-1.5 font-medium">
              Select Crop
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3"
            >
              {plotCrops.map((crop) => (
                <TouchableOpacity
                  key={crop.id}
                  className={`mr-2 px-3 py-2 rounded-lg border ${
                    selectedCropId === crop.id
                      ? "bg-blue-50 border-blue-400"
                      : "bg-gray-50 border-gray-200"
                  }`}
                  onPress={() => setSelectedCropId(crop.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCropId === crop.id
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    {crop.name}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    ({crop.plotX ?? "?"}, {crop.plotY ?? "?"})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Target Position */}
            <Text className="text-xs text-gray-500 mb-1.5 font-medium">
              Target Position
            </Text>
            <View className="flex-row mb-3 space-x-2">
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-1">Plot X</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                  placeholder="X"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  value={targetPlotX}
                  onChangeText={setTargetPlotX}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-1">Plot Y</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                  placeholder="Y"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  value={targetPlotY}
                  onChangeText={setTargetPlotY}
                />
              </View>
            </View>

            {/* Target Garden (cross-garden, level 5+) */}
            {canCrossGardenMove && otherGardens.length > 0 ? (
              <>
                <Text className="text-xs text-gray-500 mb-1.5 font-medium">
                  Target Garden
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-3"
                >
                  {otherGardens.map((garden) => (
                    <TouchableOpacity
                      key={garden.id}
                      className={`mr-2 px-3 py-2 rounded-lg border ${
                        targetGardenId === garden.id
                          ? "bg-purple-50 border-purple-400"
                          : "bg-gray-50 border-gray-200"
                      }`}
                      onPress={() =>
                        setTargetGardenId(
                          targetGardenId === garden.id ? null : garden.id,
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          targetGardenId === garden.id
                            ? "text-purple-700"
                            : "text-gray-700"
                        }`}
                      >
                        {garden.name}
                      </Text>
                      {garden.plotNumber ? (
                        <Text className="text-xs text-gray-400 mt-0.5">
                          Plot #{garden.plotNumber}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}

            {/* Move Button */}
            <TouchableOpacity
              className={`rounded-xl py-3 items-center ${
                !selectedCropId || moveLoading
                  ? "bg-gray-300"
                  : "bg-blue-500"
              }`}
              onPress={handleMoveCrop}
              disabled={!selectedCropId || moveLoading}
              activeOpacity={0.7}
            >
              {moveLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className={`font-semibold text-base ${
                    selectedCropId ? "text-white" : "text-gray-500"
                  }`}
                >
                  {!selectedCropId
                    ? "Select a crop to move"
                    : "Move Crop"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Previous Soil Checks */}
        {soilChecks.length > 0 ? (
          <View className="mx-4 mt-3 mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">
              Recent Soil Checks
            </Text>
            {soilChecks.map((check) => (
              <View
                key={check.id}
                className="bg-gray-50 rounded-lg p-3 mb-2"
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: getSoilColor(check.quality) }}
                  >
                    Score: {Math.round(check.quality)}%
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {formatDate(check.checkedAt)}
                  </Text>
                </View>
                {check.phLevel !== undefined ? (
                  <Text className="text-xs text-gray-600">
                    pH: {check.phLevel.toFixed(1)}
                  </Text>
                ) : null}
                {check.moisture !== undefined ? (
                  <Text className="text-xs text-gray-600">
                    Moisture: {check.moisture}%
                  </Text>
                ) : null}
                {check.notes ? (
                  <Text className="text-xs text-gray-500 mt-1 italic">
                    {check.notes}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View className="mx-4 mt-3 mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Text className="text-sm font-semibold text-gray-800 mb-1">
              Soil Check History
            </Text>
            <Text className="text-xs text-gray-400">
              No soil checks recorded yet. Run your first soil check to see
              results here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default PlotDetailScreen;
