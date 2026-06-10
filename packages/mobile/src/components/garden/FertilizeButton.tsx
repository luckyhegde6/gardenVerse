import React from 'react'
import { AnimatedActionButton } from './AnimatedActionButton'
import { HapticFeedback } from '../../utils/haptics'

interface FertilizeButtonProps {
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function FertilizeButton({ onPress, isLoading = false, disabled = false, className = '' }: FertilizeButtonProps) {
  const handlePress = () => {
    HapticFeedback.action()
    onPress()
  }

  return (
    <AnimatedActionButton
      onPress={handlePress}
      isLoading={isLoading}
      disabled={disabled}
      icon="🌿"
      label="Fertilize"
      bgColor="#65a30d"
      className={className}
    />
  )
}
