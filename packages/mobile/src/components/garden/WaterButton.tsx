import React from 'react'
import { AnimatedActionButton } from './AnimatedActionButton'
import { HapticFeedback } from '../../utils/haptics'

interface WaterButtonProps {
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function WaterButton({ onPress, isLoading = false, disabled = false, className = '' }: WaterButtonProps) {
  const handlePress = () => {
    HapticFeedback.action()
    onPress()
  }

  return (
    <AnimatedActionButton
      onPress={handlePress}
      isLoading={isLoading}
      disabled={disabled}
      icon="💧"
      label="Water"
      bgColor="#3b82f6"
      className={className}
    />
  )
}
