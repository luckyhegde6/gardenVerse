import React from 'react'
import { AnimatedActionButton } from './AnimatedActionButton'

interface WaterButtonProps {
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function WaterButton({ onPress, isLoading = false, disabled = false, className = '' }: WaterButtonProps) {
  return (
    <AnimatedActionButton
      onPress={onPress}
      isLoading={isLoading}
      disabled={disabled}
      icon="💧"
      label="Water"
      bgColor="#3b82f6"
      className={className}
    />
  )
}
