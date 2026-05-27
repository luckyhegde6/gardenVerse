import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface WaterButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function WaterButton({
  onPress,
  isLoading = false,
  disabled = false,
  className = '',
}: WaterButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`flex-row items-center justify-center bg-blue-500 px-4 py-2.5 rounded-xl ${disabled || isLoading ? 'opacity-50' : ''} ${className}`}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Text className="text-white text-lg mr-1">💧</Text>
          <Text className="text-white font-semibold text-sm">Water</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
