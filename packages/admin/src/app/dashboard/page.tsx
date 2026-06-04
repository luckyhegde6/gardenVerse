'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Sprout, ShoppingCart, Activity, TrendingUp, Globe, CreditCard, Server, Wifi, Clock, HardDrive, Loader2, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { Chart } from '@/components/Chart'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface DashboardStats {
  totalUsers: number
  verifiedUsers: number
  verificationRate: string
  totalGardens: number
  totalCrops: number
  activeListings: number
  completedTransactions: number
  totalRevenue: number
  reportsPending: number
  activeSessions: number
}

interface PerformanceMetrics {
  uptime: number
  activeSessions: number
  dau: number
  mau: number
  errorsLastHour: number
  warningsLastHour: number
  avgResponseTimeMs: number
}

interface HealthStatus {
  status: string
  database: string
  timestamp: string
  metrics: {
    totalUsers: number
    activeSessions: number
    errorsLastHour: number
  }
}

interface BackendUser {
  id: string
  username: string
  email: string
  displayName: string | null
  role: string
  level: number
  createdAt: string
  _count: { crops: number }
}

interface RecentUser {
  id: string
  username: string
  email: string
  level: number
  role: string
  status: 'active' | 'suspended'
  joined: string
  gardens: number
}

const EMPTY_CHART_HEIGHT = 300

function NoChartData() {
  return (
    <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
      No data available
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [perf, setPerf] = useState<PerformanceMetrics | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [adminRes, healthRes, usersRes] = await Promise.all([
        api.get('/admin'),
        api.get('/health/detailed'),
        api.get('/users', { params: { limit: 5 } }),
      ])

      setError(null) // ensure error is cleared on successful fetch

      const adminData = adminRes.data as Record<string, unknown>
      setStats({
        totalUsers: (adminData.totalUsers as number) ?? 0,
        verifiedUsers: (adminData.verifiedUsers as number) ?? 0,
        verificationRate: (adminData.verificationRate as string) ?? '0%',
        totalGardens: (adminData.activeGardens as number) ?? 0,
        totalCrops: (adminData.totalCrops as number) ?? 0,
        activeListings: (adminData.marketplaceVolume as number) ?? 0,
        completedTransactions: (adminData.marketplaceTransactions as number) ?? 0,
        totalRevenue: (adminData.revenue as number) ?? 0,
        reportsPending: (adminData.pendingReports as number) ?? 0,
        activeSessions: (adminData.activeSessions as number) ?? 0,
      } as DashboardStats)
      setPerf({
        uptime: (adminData.systemUptime as number) ?? 0,
        activeSessions: (adminData.activeSessions as number) ?? 0,
        dau: (adminData.dau as number) ?? 0,
        mau: (adminData.mau as number) ?? 0,
        errorsLastHour: (adminData.errorsLastHour as number) ?? 0,
        warningsLastHour: 0,
        avgResponseTimeMs: (adminData.apiLatency as number) ?? 0,
      } as PerformanceMetrics)
      setHealth({
        status: (healthRes.data as Record<string, unknown>).status as string ?? 'unknown',
        database: ((healthRes.data as Record<string, unknown>).services as Record<string, string>)?.database ?? 'unknown',
        timestamp: (healthRes.data as Record<string, unknown>).timestamp as string ?? new Date().toISOString(),
        metrics: {
          totalUsers: (adminData.totalUsers as number) ?? 0,
          activeSessions: (adminData.activeSessions as number) ?? 0,
          errorsLastHour: (adminData.errorsLastHour as number) ?? 0,
        },
      } as HealthStatus)

      const usersResData = usersRes.data as Record<string, unknown>
      const userList = (usersResData.data ?? usersResData.users ?? []) as BackendUser[]
      if (userList.length > 0) {
        setRecentUsers(
          userList.map((u: BackendUser) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            level: u.level,
            role:
              u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'
                ? 'admin'
                : u.role === 'MODERATOR'
                  ? 'moderator'
                  : 'user',
            status: 'active' as const,
            joined: u.createdAt.slice(0, 10),
            gardens: u._count.crops,
          }))
        )
      } else {
        setRecentUsers([])
      }
    } catch (err) {
      setError('Could not load from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const perfIndicator = (
    label: string,
    value: string,
    status: string,
    icon: React.ComponentType<{ className?: string }>
  ) => {
    const Icon = icon
    const statusColor =
      status === 'healthy'
        ? 'text-emerald-400 bg-emerald-400/10'
        : 'text-amber-400 bg-amber-400/10'
    return (
      <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', statusColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm text-slate-300">{label}</p>
            <p className="text-xs text-slate-500">{value}</p>
          </div>
        </div>
        <Badge variant={status as 'success' | 'warning'} dot>
          {status}
        </Badge>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const dauMauChartData =
    perf && perf.dau != null && perf.mau != null
      ? [{ month: 'Current', users: perf.mau, active: perf.dau }]
      : null

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchAll}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Daily Active Users"
          value={perf?.dau ?? 0}
          change={0}
          changeLabel="last 24h"
          trend="up"
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          change={0}
          changeLabel={`${stats?.verifiedUsers ?? 0} verified`}
          trend="up"
          icon={<Sprout className="w-6 h-6" />}
        />
        <StatCard
          title="Active Gardens"
          value={stats?.totalGardens ?? 0}
          change={0}
          changeLabel={`${stats?.totalCrops ?? 0} crops planted`}
          trend="up"
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="Marketplace Volume"
          value={stats?.totalRevenue ?? 0}
          change={0}
          changeLabel={`${stats?.activeListings ?? 0} active listings`}
          trend="up"
          icon={<ShoppingCart className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Growth</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{perf?.mau ?? 0} monthly active</span>
            </div>
          </div>
          {dauMauChartData && dauMauChartData.length > 0 ? (
            <Chart
              data={dauMauChartData as unknown as Record<string, unknown>[]}
              series={[
                { key: 'users', name: 'Total Users', color: '#22c55e' },
                { key: 'active', name: 'Active Users', color: '#3b82f6' },
              ]}
              kind="area"
              height={EMPTY_CHART_HEIGHT}
            />
          ) : (
            <NoChartData />
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue & Credits Flow</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Revenue: ¤{(stats?.totalRevenue ?? 0).toLocaleString()}</span>
            </div>
          </div>
          <NoChartData />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="card-header">
            <h3 className="card-title">Regional Activity</h3>
            <Globe className="w-4 h-4 text-slate-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="table-header">Region</th>
                  <th className="table-header">Users</th>
                  <th className="table-header">Gardens</th>
                  <th className="table-header">IoT Devices</th>
                  <th className="table-header">Engagement</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell text-slate-500 text-sm text-center" colSpan={5}>
                    No regional data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="card-header">
            <h3 className="card-title">System Health</h3>
            <Activity className="w-4 h-5 text-emerald-400" />
          </div>
          {health && (
            <>
              {perfIndicator(
                'API Latency',
                `${perf?.avgResponseTimeMs ?? 0}ms`,
                health.status === 'healthy' ? 'healthy' : 'warning',
                Clock
              )}
              {perfIndicator(
                'Server Load',
                `${Math.round(perf?.uptime ?? 0)}s uptime`,
                'healthy',
                Server
              )}
              {perfIndicator(
                'Database',
                health.database === 'connected' ? 'Connected' : 'Disconnected',
                health.database === 'connected' ? 'healthy' : 'warning',
                HardDrive
              )}
              {perfIndicator('WebSocket', 'Active', 'healthy', Wifi)}
            </>
          )}
          {perf && (
            <div className="mt-2 p-3 rounded-lg bg-slate-800/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Overall Uptime</span>
                <span className="text-xs font-medium text-emerald-400">
                  {Math.round(perf.uptime / 3600)}h
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Users</h3>
          <Badge variant="info">{stats?.verifiedUsers ?? 0} verified</Badge>
        </div>
        <DataTable
          columns={[
            { key: 'username', header: 'Username', sortable: true },
            { key: 'email', header: 'Email', sortable: true },
            { key: 'level', header: 'Level', sortable: true, width: '80px' },
            {
              key: 'role',
              header: 'Role',
              sortable: true,
              width: '100px',
              render: (u) => (
                <Badge
                  variant={
                    u.role === 'premium'
                      ? 'success'
                      : u.role === 'moderator'
                        ? 'info'
                        : 'default'
                  }
                >
                  {u.role as string}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              width: '100px',
              render: (u) => (
                <Badge variant={(u.status as 'active' | 'suspended')} dot>
                  {u.status as string}
                </Badge>
              ),
            },
            { key: 'joined', header: 'Joined', sortable: true },
            { key: 'gardens', header: 'Gardens', sortable: true, width: '90px' },
          ]}
          data={recentUsers as unknown as Record<string, unknown>[]}
          keyExtractor={(u) => String(u.id)}
          searchable
          pageSize={5}
        />
      </div>
    </div>
  )
}
