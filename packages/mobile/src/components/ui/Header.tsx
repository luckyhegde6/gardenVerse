import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onRightActionPress?: () => void;
  subtitle?: string;
  className?: string;
}

export function Header({
  title,
  showBack = false,
  rightAction,
  onRightActionPress,
  subtitle,
  className = '',
}: HeaderProps) {
  const navigation = useNavigation();

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 ${className}`}
    >
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
          >
            <Text className="text-gray-700 text-xl">←</Text>
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
          )}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity onPress={onRightActionPress} className="ml-2 p-1">
          {rightAction}
        </TouchableOpacity>
      )}
    </View>
  );
}
