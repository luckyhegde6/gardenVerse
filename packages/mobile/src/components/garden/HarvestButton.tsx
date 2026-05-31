import React from 'react'
import { AnimatedActionButton } from './AnimatedActionButton'

interface HarvestButtonProps {
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function HarvestButton({ onPress, isLoading = false, disabled = false, className = '' }: HarvestButtonProps) {
  return (
    <AnimatedActionButton
      onPress={onPress}
      isLoading={isLoading}
      disabled={disabled}
      icon="🌾"
      label="Harvest"
      bgColor="#eab308"
      className={className}
    />
  )
}
