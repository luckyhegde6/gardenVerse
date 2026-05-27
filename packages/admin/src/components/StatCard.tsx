'use client'

import { type ReactNode } from 'react'
import { cn, formatNumber } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  icon: ReactNode
  trend?: 'up' | 'down'
  className?: string
}

export function StatCard({ title, value, change, changeLabel, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('card group hover:border-slate-700/80 transition-colors', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-100">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center text-xs font-medium',
                  trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              {changeLabel && <span className="text-xs text-slate-500">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className="rounded-xl bg-admin-500/10 p-3 text-admin-400 group-hover:bg-admin-500/20 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  )
}
