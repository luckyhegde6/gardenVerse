import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        const str = val == null ? '' : String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-400/10',
    inactive: 'text-slate-400 bg-slate-400/10',
    suspended: 'text-amber-400 bg-amber-400/10',
    banned: 'text-red-400 bg-red-400/10',
    pending: 'text-sky-400 bg-sky-400/10',
    resolved: 'text-emerald-400 bg-emerald-400/10',
    dismissed: 'text-slate-400 bg-slate-400/10',
    warning: 'text-amber-400 bg-amber-400/10',
    error: 'text-red-400 bg-red-400/10',
    healthy: 'text-emerald-400 bg-emerald-400/10',
    degraded: 'text-amber-400 bg-amber-400/10',
    down: 'text-red-400 bg-red-400/10',
  }
  return colors[status.toLowerCase()] || 'text-slate-400 bg-slate-400/10'
}

export function generatePlantThumbnail(name: string, difficulty?: string, edible?: boolean): string {
  const colors: Record<string, string> = {
    EASY: '22c55e',
    MEDIUM: 'eab308',
    HARD: 'ef4444',
  }
  const bgColor = difficulty ? (colors[difficulty] ?? '22c55e') : '22c55e'
  const accentColor = edible ? '86efac' : 'fde047'
  const initial = (name || '?').charAt(0).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="16" fill="#${bgColor}" opacity="0.15"/>
    <text x="40" y="44" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="32" font-weight="700" fill="#${bgColor}">${initial}</text>
    <path d="M40 18c-4 0-8 3-8 8v12l-6-4c-3-2-7-1-9 2-2 3-1 7 2 9l12 8v5h10v-5l12-8c3-2 4-6 2-9-2-3-6-4-9-2l-6 4V26c0-5-4-8-8-8z" fill="#${accentColor}" opacity="0.8" transform="translate(0, 6) scale(0.5) translate(20, 0)"/>
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'text-purple-400 bg-purple-400/10',
    moderator: 'text-sky-400 bg-sky-400/10',
    user: 'text-slate-400 bg-slate-400/10',
    premium: 'text-amber-400 bg-amber-400/10',
  }
  return colors[role.toLowerCase()] || 'text-slate-400 bg-slate-400/10'
}
