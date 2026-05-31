'use client'

import {
  Shield,
  Users,
  Sprout,
  ShoppingCart,
  Server,
  HardDrive,
  Wifi,
  Activity,
  Database,
  Bot,
  Globe,
  Monitor,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { cn } from '@/lib/utils'

// ─── Mock Data ──────────────────────────────────────────────────────

const statCards = [
  {
    title: 'Total Users',
    value: 142890,
    change: 8.2,
    changeLabel: 'this month',
    trend: 'up' as const,
    icon: <Users className="w-6 h-6" />,
  },
  {
    title: 'Total Gardens',
    value: 45230,
    change: -3.1,
    changeLabel: 'vs last week',
    trend: 'down' as const,
    icon: <Sprout className="w-6 h-6" />,
  },
  {
    title: 'Total Transactions',
    value: 89210,
    change: 15.6,
    changeLabel: 'this month',
    trend: 'up' as const,
    icon: <ShoppingCart className="w-6 h-6" />,
  },
  {
    title: 'System Uptime',
    value: '99.97%',
    change: 0.02,
    changeLabel: 'improvement',
    trend: 'up' as const,
    icon: <Activity className="w-6 h-6" />,
  },
]

const systemHealthServices = [
  { label: 'API Server', status: 'healthy', detail: 'Response time 42ms', icon: Server },
  { label: 'Database', status: 'healthy', detail: 'PostgreSQL 16 — 45 connections', icon: Database },
  { label: 'Redis Cache', status: 'healthy', detail: 'Hit rate 94.3%', icon: HardDrive },
  { label: 'AI Service', status: 'degraded', detail: 'P95 latency 1.8s', icon: Bot },
  { label: 'WebSocket Server', status: 'healthy', detail: '1,240 active connections', icon: Wifi },
] as const

type HealthStatus = 'healthy' | 'degraded' | 'down'

const statusBadgeVariant: Record<HealthStatus, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
}

const statusDotColor: Record<HealthStatus, string> = {
  healthy: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  down: 'bg-red-400',
}

const recentActivityData = [
  { id: '1', action: 'Deleted user account', admin: 'super_admin_1', target: 'green_thumb', timestamp: '2026-05-29 14:23 UTC' },
  { id: '2', action: 'Approved moderation report', admin: 'super_admin_1', target: 'Report #892', timestamp: '2026-05-29 13:45 UTC' },
  { id: '3', action: 'Updated system config', admin: 'super_admin_2', target: 'Rate limits', timestamp: '2026-05-29 12:10 UTC' },
  { id: '4', action: 'Suspended marketplace listing', admin: 'super_admin_1', target: 'Listing #4512', timestamp: '2026-05-29 11:32 UTC' },
  { id: '5', action: 'Granted moderator role', admin: 'super_admin_2', target: 'botany_king', timestamp: '2026-05-29 10:05 UTC' },
  { id: '6', action: 'Rolled back seed data', admin: 'super_admin_1', target: 'OpenFarm sync', timestamp: '2026-05-28 22:18 UTC' },
  { id: '7', action: 'Triggered AI retraining', admin: 'super_admin_2', target: 'Plant classifier', timestamp: '2026-05-28 16:40 UTC' },
  { id: '8', action: 'Exported audit logs', admin: 'super_admin_3', target: 'Q1 2026 archive', timestamp: '2026-05-28 09:15 UTC' },
]

const serverMetrics = [
  { label: 'CPU Usage', usage: 34, color: 'bg-emerald-500', detail: '8 vCPUs — idle' },
  { label: 'Memory Usage', usage: 62, color: 'bg-amber-500', detail: '12.4 GB / 20 GB' },
  { label: 'Disk Usage', usage: 78, color: 'bg-admin-500', detail: '234 GB / 300 GB' },
]

// ─── Page ───────────────────────────────────────────────────────────

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-admin-500/10 ring-1 ring-admin-500/20">
          <Shield className="w-5 h-5 text-admin-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Full system oversight and management</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            change={card.change}
            changeLabel={card.changeLabel}
            trend={card.trend}
            icon={card.icon}
          />
        ))}
      </div>

      {/* ── System Health + Server Metrics ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="xl:col-span-2 card">
          <div className="card-header">
            <h3 className="card-title">System Health</h3>
            <Globe className="w-4 h-4 text-slate-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {systemHealthServices.map(service => {
              const Icon = service.icon
              return (
                <div
                  key={service.label}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg',
                        service.status === 'healthy'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : service.status === 'degraded'
                            ? 'bg-amber-400/10 text-amber-400'
                            : 'bg-red-400/10 text-red-400',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{service.label}</p>
                      <p className="text-xs text-slate-500">{service.detail}</p>
                    </div>
                  </div>
                  <Badge variant={statusBadgeVariant[service.status]} dot>
                    {service.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>

        {/* Server Metrics */}
        <div className="card space-y-5">
          <div className="card-header">
            <h3 className="card-title">Server Metrics</h3>
            <Monitor className="w-4 h-5 text-slate-500" />
          </div>
          {serverMetrics.map(metric => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{metric.label}</span>
                <span className="text-slate-400">{metric.usage}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', metric.color)}
                  style={{ width: `${metric.usage}%` }}
                />
              </div>
              <p className="text-xs text-slate-600">{metric.detail}</p>
            </div>
          ))}

          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Overall System Load</span>
              <span className="text-xs font-medium text-emerald-400">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '35%' }} />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">35%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
          <Badge variant="info">Live feed</Badge>
        </div>
        <DataTable
          columns={[
            {
              key: 'action',
              header: 'Action',
              sortable: true,
              render: item => (
                <span className="text-slate-200 font-medium">{item.action as string}</span>
              ),
            },
            {
              key: 'admin',
              header: 'Admin User',
              sortable: true,
              width: '150px',
              render: item => (
                <span className="text-sky-400 font-mono text-sm">{item.admin as string}</span>
              ),
            },
            {
              key: 'target',
              header: 'Target',
              sortable: true,
              width: '180px',
              render: item => (
                <span className="text-slate-400">{item.target as string}</span>
              ),
            },
            {
              key: 'timestamp',
              header: 'Timestamp',
              sortable: true,
              width: '180px',
              render: item => (
                <span className="text-slate-500 text-sm">{item.timestamp as string}</span>
              ),
            },
          ]}
          data={recentActivityData as unknown as Record<string, unknown>[]}
          keyExtractor={item => String(item.id)}
          searchable
          searchPlaceholder="Search activity..."
          pageSize={6}
        />
      </div>
    </div>
  )
}
