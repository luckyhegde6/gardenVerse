import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'filled' | 'outlined';
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  className?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  variant = 'filled',
  size = 'md',
  leftIcon,
  className = '',
}: ChipProps) {
  const isFilled = variant === 'filled';

  const containerStyle = selected
    ? isFilled
      ? 'bg-primary-600 border-primary-600'
      : 'bg-primary-50 border-primary-600'
    : isFilled
    ? 'bg-gray-100 border-gray-200'
    : 'bg-transparent border-gray-300';

  const textStyle = selected
    ? isFilled
      ? 'text-white'
      : 'text-primary-700'
    : 'text-gray-600';

  const sizeStyle = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`
        flex-row items-center rounded-full border ${containerStyle} ${className}
      `}
      activeOpacity={0.7}
    >
      {leftIcon && <View className="mr-1">{leftIcon}</View>}
      <Text className={`font-medium ${textStyle} ${sizeStyle}`}>{label}</Text>
    </TouchableOpacity>
  );
}
