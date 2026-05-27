import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center px-8 py-12 ${className}`}>
      {icon ? (
        <View className="mb-4">{icon}</View>
      ) : (
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Text className="text-3xl text-gray-400">🪴</Text>
        </View>
      )}
      <Text className="text-lg font-semibold text-gray-900 text-center mb-1">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-gray-500 text-center mb-6 leading-5">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" />
      )}
    </View>
  );
}
