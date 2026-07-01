import React from "react";
import { View, Text } from "react-native";
import { WeatherData } from "@/types";
import { Card } from "@components/ui/Card";

interface WeatherCardProps {
  weather: WeatherData;
}

const conditionIcons: Record<string, string> = {
  sunny: "☀️",
  clear: "🌙",
  cloudy: "☁️",
  partly_cloudy: "⛅",
  rainy: "🌧️",
  heavy_rain: "🌧️",
  storm: "⛈️",
  snowy: "❄️",
  foggy: "🌫️",
  windy: "💨",
  drizzle: "🌦️",
};

export function WeatherCard({ weather }: WeatherCardProps) {
  const icon = conditionIcons[weather.condition?.toLowerCase()] || "🌤️";

  return (
    <Card className="mb-4 bg-gradient-to-br from-blue-500 to-blue-600">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-white text-4xl font-bold">
            {Math.round(weather.temperature)}°C
          </Text>
          <Text className="text-white/80 text-sm mt-1 capitalize">
            {weather.condition.replace(/_/g, " ")}
          </Text>
        </View>
        <Text className="text-5xl">{icon}</Text>
      </View>
      <View className="flex-row justify-between mt-4 pt-4 border-t border-white/20">
        <View className="items-center">
          <Text className="text-white/60 text-xs">Humidity</Text>
          <Text className="text-white font-semibold">{weather.humidity}%</Text>
        </View>
        <View className="items-center">
          <Text className="text-white/60 text-xs">Rainfall</Text>
          <Text className="text-white font-semibold">{weather.rainfall}mm</Text>
        </View>
      </View>
    </Card>
  );
}
