import React, { useEffect } from 'react'
import { TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated'
import { Crop, CropStatus } from "@/types"
import { CropSprite } from '@components/garden/CropSprite'

interface AnimatedCropTileProps {
  crop: Crop
  isSelected: boolean
  isNew?: boolean
  wasWatered?: boolean
  wasFertilized?: boolean
  isHarvested?: boolean
  onPress: () => void
  onLongPress?: () => void
  size?: number
}

export function AnimatedCropTile({
  crop,
  isSelected,
  isNew = false,
  wasWatered = false,
  wasFertilized = false,
  isHarvested = false,
  onPress,
  onLongPress,
  size = 80,
}: AnimatedCropTileProps) {
  const scale = useSharedValue(isNew ? 0 : 1)
  const opacity = useSharedValue(isNew ? 0 : 1)
  const rotateZ = useSharedValue(0)
  const glowOpacity = useSharedValue(0)
  const selectedScale = useSharedValue(1)

  useEffect(() => {
    if (isNew) {
      scale.value = withSequence(
        withDelay(100, withSpring(1.3, { damping: 8, stiffness: 150 })),
        withSpring(1, { damping: 12, stiffness: 200 }),
      )
      opacity.value = withSpring(1, { damping: 15 })
    }
  }, [isNew])

  useEffect(() => {
    if (wasWatered) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 6, stiffness: 120 }),
        withSpring(1, { damping: 10, stiffness: 180 }),
      )
      glowOpacity.value = withSequence(
        withSpring(0.5, { damping: 10 }),
        withDelay(800, withSpring(0, { damping: 15 })),
      )
    }
  }, [wasWatered])

  useEffect(() => {
    if (wasFertilized) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 5, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 180 }),
      )
      glowOpacity.value = withSequence(
        withSpring(0.6, { damping: 8 }),
        withDelay(1000, withSpring(0, { damping: 12 })),
      )
    }
  }, [wasFertilized])

  useEffect(() => {
    if (isHarvested) {
      scale.value = withSpring(0, { damping: 12, stiffness: 200 })
      opacity.value = withDelay(300, withSpring(0, { damping: 15 }))
    }
  }, [isHarvested])

  useEffect(() => {
    if (crop.status === CropStatus.WILTED || crop.status === CropStatus.DISEASED) {
      rotateZ.value = withSequence(
        withSpring(-3, { damping: 3, stiffness: 50 }),
        withSpring(3, { damping: 3, stiffness: 50 }),
        withSpring(0, { damping: 5, stiffness: 80 }),
      )
    }
  }, [crop.status])

  useEffect(() => {
    if (isSelected) {
      selectedScale.value = withSpring(1.08, { damping: 8, stiffness: 180 })
    } else {
      selectedScale.value = withSpring(1, { damping: 12, stiffness: 200 })
    }
  }, [isSelected])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * selectedScale.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
    opacity: opacity.value,
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 0.5, 0.6], [1, 1.15, 1.2]) }],
  }))

  const borderColor = isSelected
    ? 'border-primary-500'
    : crop.status === 'WILTED' || crop.status === 'DISEASED'
      ? 'border-red-400'
      : crop.status === 'MATURE'
        ? 'border-emerald-400'
        : 'border-gray-200'

  const bgColor = crop.status === 'WILTED' || crop.status === 'DISEASED'
    ? 'bg-red-50'
    : crop.status === 'MATURE'
      ? 'bg-emerald-50'
      : 'bg-white'

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      className={`items-center justify-center rounded-xl border-2 ${borderColor} ${bgColor}`}
      style={{ width: size, height: size }}
    >
      <Animated.View className="items-center justify-center" style={animatedStyle}>
        {/* Glow effect for actions */}
        <Animated.View
          className="absolute inset-0 rounded-xl bg-blue-400"
          style={[{ zIndex: -1 }, glowStyle]}
        />
        <CropSprite crop={crop} />
      </Animated.View>
    </TouchableOpacity>
  )
}
