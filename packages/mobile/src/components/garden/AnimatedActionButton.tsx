import React, { useRef } from 'react'
import { Text, ActivityIndicator, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated'
import { HapticFeedback } from '../../utils/haptics'
import { useParticleSystem } from './ParticleSystem'

interface AnimatedActionButtonProps {
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  icon: string
  label: string
  bgColor: string
  className?: string
  /** Action type for haptic/particle/sound feedback */
  actionType?: 'water' | 'fertilize' | 'harvest' | 'plant' | 'confetti'
  /** Screen position for particle emission */
  particlePosition?: { x: number; y: number }
}

export function AnimatedActionButton({
  onPress,
  isLoading = false,
  disabled = false,
  icon,
  label,
  bgColor,
  className = '',
  actionType,
  particlePosition,
}: AnimatedActionButtonProps) {
  const scale = useSharedValue(1)
  const { emit } = useParticleSystem()
  const pressCountRef = useRef(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    if (disabled || isLoading) return

    // Haptic feedback based on action type
    const hapticMap: Record<string, () => Promise<void>> = {
      water: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
      fertilize: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
      harvest: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      plant: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
      levelUp: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    }

    const hapticFn = hapticMap[actionType || '']
    if (hapticFn) {
      hapticFn().catch(() => {})
    }

    // Emit particles
    if (actionType && particlePosition) {
      emit(actionType, particlePosition)
    }

    onPress()
  }

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
      onPress={handlePress}
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

// Need to import Haptics
import * as Haptics from 'expo-haptics'