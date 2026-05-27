'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm text-slate-100',
          'bg-slate-800/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500',
          error ? 'border-red-500' : 'border-slate-700',
          className
        )}
        {...props}
      >
        {placeholder && <option value="" className="bg-slate-900">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
