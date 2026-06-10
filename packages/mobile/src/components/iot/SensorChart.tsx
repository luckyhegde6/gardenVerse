import React from "react";
import { View, Text, Dimensions } from "react-native";
import { SensorReading } from "../../types";
import { Card } from "../ui/Card";
import dayjs from "dayjs";

interface SensorChartProps {
  readings: SensorReading[];
  title: string;
  unit: string;
  color?: string;
}

export function SensorChart({
  readings,
  title,
  unit,
  color = "#22c55e",
}: SensorChartProps) {
  if (readings.length === 0) {
    return (
      <Card className="mb-4">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          {title}
        </Text>
        <View className="h-40 items-center justify-center">
          <Text className="text-sm text-gray-400">No data available</Text>
        </View>
      </Card>
    );
  }

  const recentReadings = readings.slice(-24);
  const maxVal = Math.max(...recentReadings.map((r) => r.value));
  const minVal = Math.min(...recentReadings.map((r) => r.value));
  const range = maxVal - minVal || 1;
  const _barWidth = Math.max(
    4,
    Math.floor((Dimensions.get("window").width - 80) / recentReadings.length),
  );

  return (
    <Card className="mb-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        <Text className="text-xs text-gray-400">{unit}</Text>
      </View>

      <View className="h-32 flex-row items-end justify-between">
        {recentReadings.map((reading, index) => {
          const heightPercent = ((reading.value - minVal) / range) * 100;
          const height = Math.max(4, (heightPercent / 100) * 120);

          return (
            <View
              key={reading.id || index}
              className="flex-1 items-center justify-end mx-px"
              style={{ height: 128 }}
            >
              <View
                className="rounded-t-sm w-full"
                style={{
                  height,
                  backgroundColor: color,
                  opacity: 0.7 + (heightPercent / 100) * 0.3,
                }}
              />
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between mt-2">
        <Text className="text-xs text-gray-400">
          {dayjs(recentReadings[0]?.timestamp).format("h:mm A")}
        </Text>
        <Text className="text-xs text-gray-400">
          {dayjs(recentReadings[recentReadings.length - 1]?.timestamp).format(
            "h:mm A",
          )}
        </Text>
      </View>
    </Card>
  );
}
