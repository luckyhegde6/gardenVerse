import React from 'react'
import { AnimatedActionButton } from './AnimatedActionButton'

interface FertilizeButtonProps {
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function FertilizeButton({ onPress, isLoading = false, disabled = false, className = '' }: FertilizeButtonProps) {
  return (
    <AnimatedActionButton
      onPress={onPress}
      isLoading={isLoading}
      disabled={disabled}
      icon="🌿"
      label="Fertilize"
      bgColor="#65a30d"
      className={className}
    />
  )
}
