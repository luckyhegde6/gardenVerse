import React from "react";
import { View, Text } from "react-native";

interface CameraOverlayProps {
  isScanning: boolean;
}

export function CameraOverlay({ isScanning }: CameraOverlayProps) {
  return (
    <View className="absolute inset-0">
      <View className="flex-1 bg-black/40" />
      <View className="flex-row">
        <View className="flex-1 bg-black/40" />
        <View className="w-64 h-64 relative">
          <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
          <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
          <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
          <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />
          {isScanning && (
            <View className="absolute top-0 left-0 right-0 h-0.5 bg-primary-400 animate-pulse" />
          )}
        </View>
        <View className="flex-1 bg-black/40" />
      </View>
      <View className="flex-1 bg-black/40 items-center pt-6">
        <Text className="text-white text-sm font-medium">
          {isScanning ? "Analyzing plant..." : "Align plant in frame"}
        </Text>
      </View>
    </View>
  );
}
