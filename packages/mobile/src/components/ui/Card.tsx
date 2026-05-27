import React from 'react';
import { View, TouchableOpacity, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  onPress?: () => void;
  elevated?: boolean;
  padded?: boolean;
  className?: string;
}

export function Card({
  children,
  onPress,
  elevated = true,
  padded = true,
  className = '',
  style,
  ...props
}: CardProps) {
  const baseStyles = `
    bg-white rounded-2xl
    ${elevated ? 'shadow-sm' : ''}
    ${padded ? 'p-4' : ''}
    ${className}
  `;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className={baseStyles}
        activeOpacity={0.7}
        {...(props as any)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseStyles} style={style} {...props}>
      {children}
    </View>
  );
}
