import React, { useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';

interface ProgressBarProps {
  value: number;
  maxValue?: number;
  showLabel?: boolean;
  labelPosition?: 'top' | 'right' | 'none';
  height?: number;
  color?: string;
  trackColor?: string;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  maxValue = 100,
  showLabel = false,
  labelPosition = 'right',
  height = 8,
  color = '#22c55e',
  trackColor = '#e5e7eb',
  animated = true,
  className = '',
}: ProgressBarProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(percentage);
    }
  }, [percentage, animated, animatedValue]);

  const width = animated
    ? animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
      })
    : `${percentage}%`;

  return (
    <View className={`flex-row items-center ${className}`}>
      {showLabel && labelPosition === 'top' && (
        <Text className="text-xs text-gray-500 mb-1">
          {Math.round(percentage)}%
        </Text>
      )}
      <View
        className="flex-1 rounded-full overflow-hidden"
        style={{ backgroundColor: trackColor, height }}
      >
        <Animated.View
          className="rounded-full absolute left-0 top-0 bottom-0"
          style={{ backgroundColor: color, width: width as any }}
        />
      </View>
      {showLabel && labelPosition === 'right' && (
        <Text className="text-xs text-gray-500 ml-2 min-w-[32px]">
          {Math.round(percentage)}%
        </Text>
      )}
    </View>
  );
}
