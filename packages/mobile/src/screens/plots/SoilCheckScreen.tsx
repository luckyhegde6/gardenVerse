import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlotsStore } from "../../stores/plotsStore";
import { useGardenStore } from "../../stores/gardenStore";
import { SoilCheckResult } from "../../types";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { Divider } from "../../components/ui/Divider";

function getQualityColor(quality: number): string {
  if (quality >= 70) return "#22c55e";
  if (quality >= 40) return "#eab308";
  return "#ef4444";
}

function getQualityLabel(quality: number): string {
  if (quality >= 70) return "Excellent";
  if (quality >= 40) return "Moderate";
  return "Poor";
}

function getPhLabel(ph: number): string {
  if (ph < 6.0) return "Acidic";
  if (ph > 7.5) return "Alkaline";
  return "Neutral";
}

function getPhColor(ph: number): string {
  if (ph < 6.0) return "#ef4444";
  if (ph > 7.5) return "#3b82f6";
  return "#22c55e";
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

// Custom slider component using TouchableOpacity + View
function SliderInput({
  label,
  value,
  onChange,
  min = 0,
  max = 14,
  step = 0.1,
  unit = "",
  color = "#3b82f6",
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  color?: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  const handlePress = (direction: "up" | "down") => {
    const newVal =
      direction === "up"
        ? Math.min(value + step, max)
        : Math.max(value - step, min);
    onChange(Math.round(newVal * 10) / 10);
  };

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        <Text className="text-sm font-semibold" style={{ color }}>
          {value}
          {unit}
        </Text>
      </View>
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => handlePress("down")}
          activeOpacity={0.6}
        >
          <Text className="text-lg text-gray-600 font-bold">−</Text>
        </TouchableOpacity>
        <View className="flex-1 h-7 bg-gray-200 rounded-full overflow-hidden justify-center">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(Math.max(percentage, 0), 100)}%`,
              backgroundColor: color,
            }}
          />
        </View>
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => handlePress("up")}
          activeOpacity={0.6}
        >
          <Text className="text-lg text-gray-600 font-bold">+</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between mt-0.5">
        <Text className="text-xs text-gray-400">{min}</Text>
        <Text className="text-xs text-gray-400">{max}</Text>
      </View>
    </View>
  );
}

export function SoilCheckScreen() {
  const router = useRouter();
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const { gardens } = useGardenStore();
  const { soilCheck, isCheckingSoil, error: storeError, clearError } = usePlotsStore();

  const [phLevel, setPhLevel] = useState(7);
  const [moisture, setMoisture] = useState(50);
  const [nitrogen, setNitrogen] = useState(30);
  const [phosphorus, setPhosphorus] = useState(30);
  const [potassium, setPotassium] = useState(30);

  const [result, setResult] = useState<SoilCheckResult | null>(null);
  const [previousResults, setPreviousResults] = useState<SoilCheckResult[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  // Find the plot
  const plot = gardens.find((g) => g.id === plotId);

  const handleRunCheck = useCallback(async () => {
    if (!plotId) return;

    setLocalError(null);
    try {
      const response = await soilCheck(plotId, {
        phLevel,
        moisture,
        nitrogen,
        phosphorus,
        potassium,
      });

      // The response could be the result directly or wrapped in a result property
      const checkResult: SoilCheckResult =
        response?.result ?? response ?? null;

      if (checkResult) {
        setResult(checkResult);
        setPreviousResults((prev) => [checkResult, ...prev]);
      }
      setHasChecked(true);
    } catch (err: any) {
      setLocalError(err?.message || "Soil check failed. Please try again.");
    }
  }, [plotId, phLevel, moisture, nitrogen, phosphorus, potassium, soilCheck]);

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
          <Text className="text-lg font-bold text-gray-900">Soil Check</Text>
        </View>
        <View className="p-4">
          <SkeletonLoader width={200} height={22} borderRadius={4} />
          <View className="mt-6 space-y-4">
            <SkeletonLoader width="100%" height={60} borderRadius={8} />
            <SkeletonLoader width="100%" height={60} borderRadius={8} />
            <SkeletonLoader width="100%" height={60} borderRadius={8} />
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
          <Text className="text-lg font-bold text-gray-900">Soil Check</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-3xl mb-3">🔍</Text>
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            Plot Not Found
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            The plot could not be found.
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

  const error = localError || storeError;

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
          <Text className="text-lg font-bold text-gray-900">Soil Check</Text>
          <Text className="text-xs text-gray-500">
            Plot #{plot.plotNumber ?? "-"} · {plot.name}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Error Banner */}
        {error ? (
          <View className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center">
            <Text className="text-red-500 mr-2">⚠️</Text>
            <Text className="flex-1 text-red-700 text-sm">{error}</Text>
            <TouchableOpacity
              onPress={() => {
                clearError();
                setLocalError(null);
              }}
            >
              <Text className="text-red-500 font-medium">✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Input Section */}
        <View className="mx-4 mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Text className="text-sm font-semibold text-gray-800 mb-4">
            Input Values
          </Text>

          <SliderInput
            label="pH Level"
            value={phLevel}
            onChange={setPhLevel}
            min={0}
            max={14}
            step={0.1}
            color={getPhColor(phLevel)}
          />

          <SliderInput
            label="Moisture"
            value={moisture}
            onChange={setMoisture}
            min={0}
            max={100}
            step={1}
            unit="%"
            color="#3b82f6"
          />

          <SliderInput
            label="Nitrogen (N)"
            value={nitrogen}
            onChange={setNitrogen}
            min={0}
            max={100}
            step={1}
            unit="%"
            color="#22c55e"
          />

          <SliderInput
            label="Phosphorus (P)"
            value={phosphorus}
            onChange={setPhosphorus}
            min={0}
            max={100}
            step={1}
            unit="%"
            color="#eab308"
          />

          <SliderInput
            label="Potassium (K)"
            value={potassium}
            onChange={setPotassium}
            min={0}
            max={100}
            step={1}
            unit="%"
            color="#a855f7"
          />

          <TouchableOpacity
            className={`rounded-xl py-3.5 items-center ${
              isCheckingSoil ? "bg-green-400" : "bg-green-500"
            }`}
            onPress={handleRunCheck}
            disabled={isCheckingSoil}
            activeOpacity={0.7}
          >
            {isCheckingSoil ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                🔬 Run Soil Check
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {result ? (
          <View className="mx-4 mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">
              Results
            </Text>

            {/* Quality Score */}
            <View className="items-center mb-4">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-2"
                style={{
                  backgroundColor: getQualityColor(result.quality) + "20",
                }}
              >
                <Text
                  className="text-2xl font-bold"
                  style={{ color: getQualityColor(result.quality) }}
                >
                  {Math.round(result.quality)}
                </Text>
              </View>
              <Text
                className="text-base font-semibold"
                style={{ color: getQualityColor(result.quality) }}
              >
                {getQualityLabel(result.quality)}
              </Text>
            </View>

            <Divider />

            {/* Detailed Results */}
            <View className="space-y-2 mt-3">
              {result.phLevel !== undefined ? (
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-gray-600">pH Level</Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm font-semibold text-gray-800 mr-2">
                      {result.phLevel.toFixed(1)}
                    </Text>
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: getPhColor(result.phLevel) + "20",
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: getPhColor(result.phLevel) }}
                      >
                        {getPhLabel(result.phLevel)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {result.moisture !== undefined ? (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Moisture</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {result.moisture}%
                  </Text>
                </View>
              ) : null}

              {result.nitrogen !== undefined ? (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Nitrogen (N)</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {result.nitrogen}%
                  </Text>
                </View>
              ) : null}

              {result.phosphorus !== undefined ? (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">
                    Phosphorus (P)
                  </Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {result.phosphorus}%
                  </Text>
                </View>
              ) : null}

              {result.potassium !== undefined ? (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">
                    Potassium (K)
                  </Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {result.potassium}%
                  </Text>
                </View>
              ) : null}

              {result.notes ? (
                <View className="bg-gray-50 rounded-lg p-3 mt-2">
                  <Text className="text-xs text-gray-600">{result.notes}</Text>
                </View>
              ) : null}

              <Text className="text-xs text-gray-400 text-right mt-1">
                Checked at {formatDate(result.checkedAt)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Previous Results */}
        {previousResults.length > 1 ? (
          <View className="mx-4 mt-3 mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">
              Previous Checks
            </Text>
            {previousResults.slice(1).map((check) => (
              <View
                key={check.id}
                className="bg-gray-50 rounded-lg p-3 mb-2"
              >
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-row items-center">
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{
                        backgroundColor: getQualityColor(check.quality),
                      }}
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: getQualityColor(check.quality) }}
                    >
                      Score: {Math.round(check.quality)}%
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {formatDate(check.checkedAt)}
                  </Text>
                </View>
                {check.phLevel !== undefined ? (
                  <Text className="text-xs text-gray-600 ml-4">
                    pH: {check.phLevel.toFixed(1)} ·{" "}
                    {check.moisture !== undefined
                      ? `Moisture: ${check.moisture}%`
                      : ""}
                  </Text>
                ) : null}
                {check.notes ? (
                  <Text className="text-xs text-gray-500 mt-1 italic ml-4">
                    {check.notes}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : hasChecked ? (
          <View className="mx-4 mt-3 mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Text className="text-sm font-semibold text-gray-800 mb-1">
              Previous Checks
            </Text>
            <Text className="text-xs text-gray-400">
              No previous checks recorded.
            </Text>
          </View>
        ) : (
          <View className="h-8" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default SoilCheckScreen;
