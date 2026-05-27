import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useWeather } from '../../hooks/useWeather';
import { WeatherCard } from '../../components/weather/WeatherCard';
import { ForecastCard } from '../../components/weather/ForecastCard';
import { WeatherAlert } from '../../components/weather/WeatherAlert';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';

export function WeatherScreen() {
  const { weather, isLoading, error, refresh } = useWeather();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (isLoading && !weather) {
    return <LoadingSpinner fullScreen message="Fetching weather data..." />;
  }

  if (error && !weather) {
    return (
      <EmptyState
        title="Weather unavailable"
        description={error}
        actionLabel="Retry"
        onAction={refresh}
      />
    );
  }

  if (!weather) return null;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="px-4 pt-4">
        {/* Current Weather */}
        <WeatherCard weather={weather} />

        {/* Alerts */}
        <WeatherAlert
          type="info"
          message="Low rainfall expected this week. Consider adjusting irrigation."
        />

        {/* Forecast */}
        <ForecastCard forecast={weather.forecast} />

        {/* Garden Impact */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Impact on Your Garden
          </Text>
          <View className="bg-green-50 rounded-xl p-4">
            <Text className="text-sm font-medium text-gray-900 mb-2">
              Watering Recommendation
            </Text>
            <Text className="text-sm text-gray-600 leading-5">
              With {weather.humidity}% humidity and {weather.rainfall}mm
              rainfall, your garden needs moderate watering today. Consider
              watering in the early morning to reduce evaporation.
            </Text>
          </View>
        </Card>

        {/* Weather Stats */}
        <View className="flex-row gap-3 mb-6">
          <Card className="flex-1 items-center">
            <Text className="text-2xl mb-1">💧</Text>
            <Text className="text-lg font-bold text-gray-900">
              {weather.humidity}%
            </Text>
            <Text className="text-xs text-gray-500">Humidity</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-2xl mb-1">🌧️</Text>
            <Text className="text-lg font-bold text-gray-900">
              {weather.rainfall}mm
            </Text>
            <Text className="text-xs text-gray-500">Rainfall</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-2xl mb-1">🌡️</Text>
            <Text className="text-lg font-bold text-gray-900">
              {Math.round(weather.temperature)}°
            </Text>
            <Text className="text-xs text-gray-500">Temp</Text>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
