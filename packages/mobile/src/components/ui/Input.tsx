import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  helperText?: string;
  className?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  helperText,
  className = '',
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`
          flex-row items-center bg-white border rounded-xl px-4 py-3
          ${error ? 'border-red-500' : isFocused ? 'border-primary-500' : 'border-gray-300'}
          ${props.editable === false ? 'bg-gray-50' : ''}
        `}
      >
        {leftIcon && <Text className="mr-2 text-gray-400">{leftIcon}</Text>}
        <TextInput
          className="flex-1 text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text className="text-gray-400 text-sm">
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Text className="ml-2 text-gray-400">{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text className="text-gray-400 text-xs mt-1">{helperText}</Text>
      )}
    </View>
  );
}
