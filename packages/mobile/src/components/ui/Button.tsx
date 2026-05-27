import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  title: string;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> =
  {
    primary: {
      container: 'bg-primary-600 active:bg-primary-700',
      text: 'text-white font-semibold',
    },
    secondary: {
      container: 'bg-earth-500 active:bg-earth-600',
      text: 'text-white font-semibold',
    },
    outline: {
      container: 'border-2 border-primary-600 bg-transparent active:bg-primary-50',
      text: 'text-primary-600 font-semibold',
    },
    ghost: {
      container: 'bg-transparent active:bg-gray-100',
      text: 'text-primary-600 font-semibold',
    },
  };

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'px-3 py-2 rounded-lg',
    text: 'text-sm',
  },
  md: {
    container: 'px-5 py-3 rounded-xl',
    text: 'text-base',
  },
  lg: {
    container: 'px-6 py-4 rounded-xl',
    text: 'text-lg',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  title,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const vStyles = variantStyles[variant];
  const sStyles = sizeStyles[size];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center
        ${vStyles.container}
        ${sStyles.container}
        ${isDisabled ? 'opacity-50' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#16a34a' : '#fff'}
        />
      ) : (
        <>
          {leftIcon && <Text className="mr-2">{leftIcon}</Text>}
          <Text
            className={`
              ${vStyles.text}
              ${sStyles.text}
              ${isLoading ? 'hidden' : ''}
            `}
          >
            {title}
          </Text>
          {rightIcon && <Text className="ml-2">{rightIcon}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}
