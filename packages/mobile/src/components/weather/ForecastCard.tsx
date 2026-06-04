import React from "react";
import { View, Text, ScrollView } from "react-native";
import { WeatherForecast } from "../../types";
import dayjs from "dayjs";

interface ForecastCardProps {
  forecast: WeatherForecast[];
}

const conditionIcons: Record<string, string> = {
  sunny: "☀️",
  clear: "🌙",
  cloudy: "☁️",
  partly_cloudy: "⛅",
  rainy: "🌧️",
  storm: "⛈️",
  snowy: "❄️",
  foggy: "🌫️",
  windy: "💨",
  drizzle: "🌦️",
};

function getDisplayTemp(temp: number | { min: number; max: number }): number {
  if (typeof temp === "number") return Math.round(temp);
  return Math.round((temp.min + temp.max) / 2);
}

export function ForecastCard({ forecast }: ForecastCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
      <Text className="text-base font-semibold text-gray-900 mb-3">
        7-Day Forecast
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {forecast.map((day, index) => {
          const icon = conditionIcons[day.condition?.toLowerCase()] || "🌤️";
          const dayName = index === 0 ? "Today" : dayjs(day.date).format("ddd");
          return (
            <View key={day.date} className="items-center mr-5 min-w-[60px]">
              <Text className="text-xs text-gray-500 mb-1">{dayName}</Text>
              <Text className="text-2xl mb-1">{icon}</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {getDisplayTemp(day.temperature)}°
              </Text>
              <Text className="text-xs text-gray-400">{day.humidity}%</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
