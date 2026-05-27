import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = 'large',
  color = '#16a34a',
  message,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const content = (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-gray-500 text-sm mt-3">{message}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        {content}
      </View>
    );
  }

  return content;
}
