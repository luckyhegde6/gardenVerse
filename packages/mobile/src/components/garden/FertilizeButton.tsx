import React, { useMemo } from 'react'
import { View, Text } from 'react-native'
import { AnimatedActionButton } from './AnimatedActionButton'
import { Crop } from '../../types'
import { HapticFeedback } from '../../utils/haptics'

function getTimeSince(timestamp: string | undefined): string {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface FertilizeButtonProps {
  onPress: () => void
  crop?: Crop
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function FertilizeButton({ onPress, crop, isLoading = false, disabled = false, className = '' }: FertilizeButtonProps) {
  const timeSince = useMemo(() => getTimeSince(crop?.lastFertilizedAt), [crop?.lastFertilizedAt])
  const needsNutrients = (crop?.nutrientLevel ?? 100) < 40
  const isFed = (crop?.nutrientLevel ?? 0) >= 80

  const handlePress = () => {
    HapticFeedback.action()
    onPress()
  }

  return (
    <View>
      <AnimatedActionButton
        onPress={handlePress}
        isLoading={isLoading}
        disabled={disabled || isFed}
        icon={needsNutrients ? "🌿" : "✅"}
        label={needsNutrients ? "Fertilize" : "Fed"}
        bgColor={isFed ? "#6b7280" : "#65a30d"}
        className={className}
      />
      {timeSince ? (
        <Text className="text-[10px] text-gray-400 text-center mt-1">{timeSince}</Text>
      ) : null}
    </View>
  )
}
