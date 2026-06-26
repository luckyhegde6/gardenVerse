import React, { useMemo } from 'react'
import { View, Text } from 'react-native'
import { AnimatedActionButton } from './AnimatedActionButton'
import { Crop, CropStatus } from '../../types'
import { HapticFeedback } from '../../utils/haptics'

interface HarvestButtonProps {
  onPress: () => void
  crop?: Crop
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function HarvestButton({ onPress, crop, isLoading = false, disabled = false, className = '' }: HarvestButtonProps) {
  const growthStage = crop?.growthStage ?? 0
  const isMature = (crop?.status === CropStatus.MATURE) || growthStage >= 100
  const isWilted = crop?.status === CropStatus.WILTED
  const isHarvested = crop?.status === CropStatus.HARVESTED
  const canHarvest = !isHarvested && !disabled && (isMature || isWilted)

  const label = useMemo(() => {
    if (isHarvested) return 'Done'
    if (isMature) return 'Harvest'
    if (growthStage >= 75) return `${Math.round((100 - growthStage) / 1.39)} ticks`
    return `${Math.round(growthStage)}%`
  }, [isHarvested, isMature, growthStage])

  const icon = useMemo(() => {
    if (isHarvested) return '✅'
    if (isMature) return '🌾'
    if (isWilted) return '⚠️'
    return '⏳'
  }, [isHarvested, isMature, isWilted])

  const bgColor = useMemo(() => {
    if (isHarvested) return '#6b7280'
    if (isMature) return '#eab308'
    return '#9ca3af'
  }, [isHarvested, isMature])

  const handlePress = () => {
    if (canHarvest) {
      HapticFeedback.harvest()
      onPress()
    }
  }

  return (
    <View>
      <AnimatedActionButton
        onPress={handlePress}
        isLoading={isLoading}
        disabled={!canHarvest}
        icon={icon}
        label={label}
        bgColor={bgColor}
        className={className}
      />
      {!isMature && !isHarvested && growthStage > 0 && (
        <Text className="text-[10px] text-gray-400 text-center mt-1">growing...</Text>
      )}
    </View>
  )
}
