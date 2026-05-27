'use client'

import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cn } from '@/lib/utils'

interface ToggleProps {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ pressed, onPressedChange, label, disabled, size = 'md' }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <TogglePrimitive.Root
        pressed={pressed}
        onPressedChange={onPressedChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
          'disabled:cursor-not-allowed disabled:opacity-50',
          pressed ? 'bg-admin-500' : 'bg-slate-700',
          size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
            size === 'sm' ? 'h-4 w-4 translate-x-0.5' : 'h-5 w-5 translate-x-0.5',
            pressed && (size === 'sm' ? 'translate-x-[18px]' : 'translate-x-[22px]')
          )}
        />
      </TogglePrimitive.Root>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  )
}
