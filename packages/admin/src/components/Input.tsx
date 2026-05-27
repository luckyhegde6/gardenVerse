'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm text-slate-100 placeholder-slate-500',
          'bg-slate-800/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500',
          error ? 'border-red-500' : 'border-slate-700',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
