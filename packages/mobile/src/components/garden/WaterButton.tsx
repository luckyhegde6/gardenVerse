import React, { useMemo } from 'react'
import { View, Text } from 'react-native'
import { AnimatedActionButton } from '@components/garden/AnimatedActionButton'
import { Crop } from "@/types"

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

interface WaterButtonProps {
  onPress: () => void
  crop?: Crop
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function WaterButton({ onPress, crop, isLoading = false, disabled = false, className = '' }: WaterButtonProps) {
  const timeSince = useMemo(() => getTimeSince(crop?.lastWateredAt), [crop?.lastWateredAt])
  const needsWater = (crop?.hydration ?? 100) < 40
  const isHydrated = (crop?.hydration ?? 0) >= 80

  const handlePress = () => {
    onPress()
  }

  return (
    <View>
      <AnimatedActionButton
        onPress={handlePress}
        isLoading={isLoading}
        disabled={disabled || isHydrated}
        icon={needsWater ? "💧" : "✅"}
        label={needsWater ? "Water" : "Hydrated"}
        bgColor={isHydrated ? "#6b7280" : "#3b82f6"}
        actionType="water"
        className={className}
      />
      {timeSince ? (
        <Text className="text-[10px] text-gray-400 text-center mt-1">{timeSince}</Text>
      ) : null}
    </View>
  )
}
