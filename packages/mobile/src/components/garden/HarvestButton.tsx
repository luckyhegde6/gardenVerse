import React from 'react'
import { AnimatedActionButton } from './AnimatedActionButton'
import { HapticFeedback } from '../../utils/haptics'

interface HarvestButtonProps {
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function HarvestButton({ onPress, isLoading = false, disabled = false, className = '' }: HarvestButtonProps) {
  const handlePress = () => {
    HapticFeedback.harvest()
    onPress()
  }

  return (
    <AnimatedActionButton
      onPress={handlePress}
      isLoading={isLoading}
      disabled={disabled}
      icon="🌾"
      label="Harvest"
      bgColor="#eab308"
      className={className}
    />
  )
}
