import React from 'react'
import { Text, ActivityIndicator, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated'

interface AnimatedActionButtonProps {
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  icon: string
  label: string
  bgColor: string
  className?: string
}

export function AnimatedActionButton({
  onPress,
  isLoading = false,
  disabled = false,
  icon,
  label,
  bgColor,
  className = '',
}: AnimatedActionButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 12, stiffness: 300 })
      }}
      onPressOut={() => {
        scale.value = withSequence(
          withSpring(0.95, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 250 }),
        )
      }}
      onPress={() => {
        if (!disabled && !isLoading) onPress()
      }}
      disabled={disabled || isLoading}
    >
      <Animated.View
        className={`flex-row items-center justify-center px-4 py-2.5 rounded-xl ${disabled || isLoading ? 'opacity-50' : ''} ${className}`}
        style={[{ backgroundColor: bgColor }, animatedStyle]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text className="text-white text-lg mr-1">{icon}</Text>
            <Text className="text-white font-semibold text-sm">{label}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  )
}
