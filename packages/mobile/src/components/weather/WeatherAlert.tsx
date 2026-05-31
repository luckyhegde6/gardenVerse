import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface WeatherAlertProps {
  type: string;
  message: string;
  onDismiss?: () => void;
}

export function WeatherAlert({ type, message, onDismiss }: WeatherAlertProps) {
  const isSevere = type === "severe" || type === "warning";

  return (
    <TouchableOpacity
      onPress={onDismiss}
      activeOpacity={0.8}
      className={`
        flex-row items-center rounded-xl px-4 py-3 mb-3
        ${isSevere ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}
      `}
    >
      <Text className="text-2xl mr-3">{isSevere ? "⚠️" : "ℹ️"}</Text>
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${isSevere ? "text-red-800" : "text-yellow-800"}`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
        <Text
          className={`text-xs ${isSevere ? "text-red-600" : "text-yellow-600"}`}
        >
          {message}
        </Text>
      </View>
      {onDismiss && (
        <Text
          className={`text-lg ml-2 ${isSevere ? "text-red-400" : "text-yellow-400"}`}
        >
          ✕
        </Text>
      )}
    </TouchableOpacity>
  );
}
