import React from "react";
import { View, Text } from "react-native";
import { ProgressBar } from "../ui/ProgressBar";

interface SensorGaugeProps {
  label: string;
  value: number;
  unit: string;
  minValue?: number;
  maxValue?: number;
  icon?: string;
  color?: string;
}

export function SensorGauge({
  label,
  value,
  unit,
  minValue = 0,
  maxValue = 100,
  icon,
  color = "#22c55e",
}: SensorGaugeProps) {
  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          {icon && <Text className="text-lg mr-2">{icon}</Text>}
          <Text className="text-sm text-gray-600">{label}</Text>
        </View>
        <Text className="text-base font-bold text-gray-900">
          {value.toFixed(1)}
          <Text className="text-xs text-gray-400 font-normal">{unit}</Text>
        </Text>
      </View>
      <ProgressBar value={clampedPercentage} color={color} height={6} />
    </View>
  );
}
