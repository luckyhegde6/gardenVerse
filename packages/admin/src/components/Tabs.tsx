'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export function TabsRoot({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      {children}
    </TabsPrimitive.Root>
  )
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-slate-800/50 p-1',
        className
      )}
    >
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-all',
        'hover:text-slate-200',
        'data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 data-[state=active]:shadow-sm',
        className
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsPrimitive.Content value={value} className={cn('mt-4', className)}>
      {children}
    </TabsPrimitive.Content>
  )
}
