import React from 'react';
import { View, Text, ViewProps } from 'react-native';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'premium'
  | 'danger';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> =
  {
    success: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    error: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    info: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    primary: { bg: 'bg-primary-100', text: 'text-primary-800', dot: 'bg-primary-500' },
    secondary: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
    danger: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    neutral: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
    premium: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  };

const sizeStyles = {
  sm: { container: 'px-1.5 py-0.5', text: 'text-xs' },
  md: { container: 'px-2 py-1', text: 'text-xs' },
  lg: { container: 'px-3 py-1.5', text: 'text-sm' },
};

export function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <View
      className={`flex-row items-center rounded-full ${v.bg} ${s.container} ${className}`}
    >
      {dot && (
        <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${v.dot}`} />
      )}
      <Text className={`font-medium ${v.text} ${s.text}`}>{label}</Text>
    </View>
  );
}
