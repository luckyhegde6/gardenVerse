'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default' | 'success' | 'warning' | 'error' | 'info'
  | 'active' | 'inactive' | 'suspended' | 'banned' | 'pending'
  | 'resolved' | 'dismissed' | 'flagged'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-800 text-slate-300',
  success: 'bg-emerald-400/10 text-emerald-400',
  warning: 'bg-amber-400/10 text-amber-400',
  error: 'bg-red-400/10 text-red-400',
  info: 'bg-sky-400/10 text-sky-400',
  active: 'bg-emerald-400/10 text-emerald-400',
  inactive: 'bg-slate-400/10 text-slate-400',
  suspended: 'bg-amber-400/10 text-amber-400',
  banned: 'bg-red-400/10 text-red-400',
  pending: 'bg-sky-400/10 text-sky-400',
  resolved: 'bg-emerald-400/10 text-emerald-400',
  dismissed: 'bg-slate-400/10 text-slate-400',
  flagged: 'bg-red-400/10 text-red-400',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-sky-400',
  active: 'bg-emerald-400',
  inactive: 'bg-slate-400',
  suspended: 'bg-amber-400',
  banned: 'bg-red-400',
  pending: 'bg-sky-400',
  resolved: 'bg-emerald-400',
  dismissed: 'bg-slate-400',
  flagged: 'bg-red-400',
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', dotColors[variant])} />}
      {children}
    </span>
  )
}
