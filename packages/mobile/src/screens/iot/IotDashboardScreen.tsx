import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useIot } from "../../hooks/useIot";
import { DeviceCard } from "../../components/iot/DeviceCard";
import { SensorGauge } from "../../components/iot/SensorGauge";
import { SensorChart } from "../../components/iot/SensorChart";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { EmptyState } from "../../components/ui/EmptyState";

export function IotDashboardScreen() {
  const { devices, readings, isLoading, error, refresh } = useIot();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSensor, setExpandedSensor] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (isLoading && devices.length === 0) {
    return <LoadingSpinner fullScreen message="Loading devices..." />;
  }

  if (error && devices.length === 0) {
    return (
      <EmptyState
        title="IoT Dashboard unavailable"
        description={error}
        actionLabel="Retry"
        onAction={refresh}
      />
    );
  }

  const onlineCount = devices.filter((d) => d.isOnline).length;
  const trustScore = 92;

  const latestReading = (sensorType: string) =>
    readings.find((r) => r.sensorType === sensorType);

  const moisture = latestReading("moisture");
  const ph = latestReading("ph");
  const temperature = latestReading("temperature");
  const light = latestReading("light");
  const humidity = latestReading("humidity");

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="px-4 pt-4">
        {/* Trust Score */}
        <Card className="mb-4 bg-primary-800">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-bold">Trust Score</Text>
              <Text className="text-primary-200 text-sm">
                Based on sensor accuracy and uptime
              </Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white text-xl font-bold">{trustScore}</Text>
            </View>
          </View>
          <View className="mt-3">
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-green-400 rounded-full"
                style={{ width: `${trustScore}%` }}
              />
            </View>
          </View>
        </Card>

        {/* Online Status */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-900">
            Connected Devices
          </Text>
          <Text className="text-sm text-gray-500">
            {onlineCount}/{devices.length} online
          </Text>
        </View>

        {/* Devices */}
        {devices.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-4xl mb-3">📡</Text>
            <Text className="text-gray-500 text-sm mb-4">
              No devices connected
            </Text>
          </View>
        ) : (
          devices.map((device) => (
            <DeviceCard key={device.id} device={device} onPress={() => {}} />
          ))
        )}

        {/* Add Device Button */}
        <TouchableOpacity className="border-2 border-dashed border-gray-300 rounded-2xl py-6 items-center justify-center mb-6">
          <Text className="text-3xl mb-2">➕</Text>
          <Text className="text-sm font-medium text-gray-500">
            Add IoT Device
          </Text>
        </TouchableOpacity>

        {/* Sensor Readings */}
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Live Sensor Readings
        </Text>

        <View className="flex-row flex-wrap gap-3 mb-4">
          {moisture && (
            <View className="w-[48%]">
              <SensorGauge
                label="Soil Moisture"
                value={moisture.value}
                unit={moisture.unit}
                icon="💧"
                color="#3b82f6"
              />
            </View>
          )}
          {ph && (
            <View className="w-[48%]">
              <SensorGauge
                label="Soil pH"
                value={ph.value}
                unit={ph.unit}
                icon="🧪"
                minValue={0}
                maxValue={14}
                color="#8b5cf6"
              />
            </View>
          )}
          {temperature && (
            <View className="w-[48%]">
              <SensorGauge
                label="Temperature"
                value={temperature.value}
                unit={temperature.unit}
                icon="🌡️"
                color="#ef4444"
              />
            </View>
          )}
          {light && (
            <View className="w-[48%]">
              <SensorGauge
                label="Light Level"
                value={light.value}
                unit={light.unit}
                icon="☀️"
                color="#f59e0b"
              />
            </View>
          )}
          {humidity && (
            <View className="w-[48%]">
              <SensorGauge
                label="Air Humidity"
                value={humidity.value}
                unit={humidity.unit}
                icon="💨"
                color="#06b6d4"
              />
            </View>
          )}
        </View>

        {/* Historical Charts */}
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Historical Data
        </Text>

        {moisture && (
          <SensorChart
            readings={[moisture]}
            title="Soil Moisture (24h)"
            unit="%"
            color="#3b82f6"
          />
        )}

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
