import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IotDevice } from '../../types';
import { formatRelativeTime } from '../../utils/formatting';

interface DeviceCardProps {
  device: IotDevice;
  onPress?: () => void;
}

const deviceIcons: Record<string, string> = {
  moisture_sensor: '💧',
  ph_sensor: '🧪',
  temperature_sensor: '🌡️',
  light_sensor: '☀️',
  humidity_sensor: '💨',
  weather_station: '🌤️',
  irrigation_controller: '🚿',
  default: '📡',
};

export function DeviceCard({ device, onPress }: DeviceCardProps) {
  const icon = deviceIcons[device.deviceType] || deviceIcons.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center ${
            device.isOnline ? 'bg-green-50' : 'bg-gray-100'
          }`}
        >
          <Text className="text-2xl">{icon}</Text>
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">
              {device.name}
            </Text>
            <View
              className={`w-2.5 h-2.5 rounded-full ${
                device.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </View>
          <View className="flex-row items-center mt-0.5">
            <Text className="text-xs text-gray-500 capitalize">
              {device.deviceType.replace(/_/g, ' ')}
            </Text>
            {device.lastSeenAt && (
              <Text className="text-xs text-gray-400 ml-2">
                · {formatRelativeTime(device.lastSeenAt)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
