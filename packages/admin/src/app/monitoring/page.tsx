'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  HardDrive,
  Cpu,
  BrainCircuit,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wifi,
  Loader2,
  Layers,
  Radio,
  BarChart3,
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Select } from '@/components/Select'
import { Toggle } from '@/components/Toggle'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────

type ServiceStatus = 'online' | 'degraded' | 'offline'

interface HealthService {
  status: ServiceStatus
  responseTime: number
  lastCheck: string
}

interface HealthData {
  api: HealthService
  database: HealthService
  redis: HealthService
  ai: HealthService
}

interface PerformanceMetrics {
  cpu: number
  memory: number
  activeUsers: number
  requestRate: number
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  source: string
  message: string
}

interface QueueStatus {
  id: string
  name: string
  pending: number
  active: number
  completed: number
  failed: number
}

interface SidecarService {
  id: string
  name: string
  description: string
  status: ServiceStatus
  uptime: string
}

// ── Helpers ──────────────────────────────────────────────────────

function statusIcon(status: ServiceStatus) {
  switch (status) {
    case 'online':
      return <CheckCircle2 className="w-5 h-5" />
    case 'degraded':
      return <AlertTriangle className="w-5 h-5" />
    case 'offline':
      return <XCircle className="w-5 h-5" />
  }
}

function statusBadgeVariant(status: ServiceStatus): 'success' | 'warning' | 'error' {
  switch (status) {
    case 'online':
      return 'success'
    case 'degraded':
      return 'warning'
    case 'offline':
      return 'error'
  }
}

function statusLabel(status: ServiceStatus): string {
  switch (status) {
    case 'online':
      return 'Online'
    case 'degraded':
      return 'Degraded'
    case 'offline':
      return 'Offline'
  }
}

function statusColorClasses(status: ServiceStatus): string {
  switch (status) {
    case 'online':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20'
    case 'degraded':
      return 'text-amber-400 bg-amber-400/10 border-amber-500/20'
    case 'offline':
      return 'text-red-400 bg-red-400/10 border-red-500/20'
  }
}

function logLevelBadgeVariant(level: LogEntry['level']): 'info' | 'warning' | 'error' {
  switch (level) {
    case 'info':
      return 'info'
    case 'warn':
      return 'warning'
    case 'error':
      return 'error'
  }
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatTimestampFull(ts: string): string {
  const date = new Date(ts)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function cpuColor(percent: number): string {
  if (percent < 50) return 'bg-emerald-500'
  if (percent < 80) return 'bg-amber-500'
  return 'bg-red-500'
}

function memoryColor(percent: number): string {
  if (percent < 50) return 'bg-emerald-500'
  if (percent < 80) return 'bg-amber-500'
  return 'bg-red-500'
}

// ── Page Component ───────────────────────────────────────────────

export default function MonitoringPage() {
  // ── State ──
  const [health, setHealth] = useState<HealthData | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [queues, setQueues] = useState<QueueStatus[]>([])
  const [sidecars, setSidecars] = useState<SidecarService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all')
  const [logSourceFilter, setLogSourceFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Data Fetching ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [healthRes, perfRes, logsRes, queuesRes, sidecarsRes] = await Promise.allSettled([
        api.get('/admin/health'),
        api.get('/admin/performance'),
        api.get('/admin/logs'),
        api.get('/admin/queues'),
        api.get('/admin/sidecars'),
      ])

      if (healthRes.status === 'fulfilled') {
        const h = healthRes.value.data as Record<string, unknown>
        if (h && typeof h === 'object' && 'api' in h) {
          setHealth(h as unknown as HealthData)
        }
      } else {
        console.error('Health API failed:', healthRes.reason)
        if (!health) setError(prev => prev ?? 'Failed to load health data.')
      }

      if (perfRes.status === 'fulfilled') {
        const p = perfRes.value.data as Record<string, unknown>
        if (p && typeof p === 'object' && 'cpu' in p) {
          setPerformance(p as unknown as PerformanceMetrics)
        }
      } else {
        console.error('Performance API failed:', perfRes.reason)
        if (!performance) setError(prev => prev ?? 'Failed to load performance metrics.')
      }

      if (logsRes.status === 'fulfilled') {
        const logsData = logsRes.value.data as { logs: LogEntry[] } | LogEntry[]
        setLogs(Array.isArray(logsData) ? logsData : (logsData.logs ?? []))
      } else {
        console.error('Logs API failed:', logsRes.reason)
      }

      if (queuesRes.status === 'fulfilled') {
        const qData = queuesRes.value.data as QueueStatus[]
        setQueues(Array.isArray(qData) ? qData : [])
      }

      if (sidecarsRes.status === 'fulfilled') {
        const sData = sidecarsRes.value.data as SidecarService[]
        setSidecars(Array.isArray(sData) ? sData : [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch monitoring data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchData()
      }, 30000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoRefresh, fetchData])

  // ── Derived ──
  const uniqueSources = Array.from(new Set(logs.map(l => l.source))).sort()

  const filteredLogs = logs.filter(log => {
    if (logLevelFilter !== 'all' && log.level !== logLevelFilter) return false
    if (logSourceFilter !== 'all' && log.source !== logSourceFilter) return false
    return true
  })

  // ── Loading State ──
  if (loading && !health && !performance && logs.length === 0 && queues.length === 0 && sidecars.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  // ── Error State (no data at all) ──
  if (error && !health && !performance && logs.length === 0 && queues.length === 0 && sidecars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-4 rounded-full bg-red-400/10">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Failed to Load Monitoring Data</h3>
          <p className="text-sm text-slate-400">{error}</p>
          <Button variant="primary" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">System Monitoring</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Auto-refresh</span>
            <Toggle
              pressed={autoRefresh}
              onPressedChange={setAutoRefresh}
              size="sm"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── SECTION 1: System Health Cards ── */}
      {health && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-admin-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">System Health</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <HealthServiceCard
              name="API Gateway"
              icon={<Server className="w-5 h-5" />}
              service={health.api}
            />
            <HealthServiceCard
              name="Database"
              icon={<Database className="w-5 h-5" />}
              service={health.database}
            />
            <HealthServiceCard
              name="Redis Cache"
              icon={<HardDrive className="w-5 h-5" />}
              service={health.redis}
            />
            <HealthServiceCard
              name="AI Service"
              icon={<BrainCircuit className="w-5 h-5" />}
              service={health.ai}
            />
          </div>
        </div>
      )}

      {/* ── SECTION 2: Performance Metrics ── */}
      {performance && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-admin-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Performance Metrics</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              title="CPU Usage"
              value={`${performance.cpu}%`}
              percent={performance.cpu}
              icon={<Cpu className="w-5 h-5" />}
              colorFn={cpuColor}
            />
            <MetricCard
              title="Memory Usage"
              value={`${performance.memory}%`}
              percent={performance.memory}
              icon={<HardDrive className="w-5 h-5" />}
              colorFn={memoryColor}
            />
            <MetricCard
              title="Active Users"
              value={performance.activeUsers.toLocaleString()}
              icon={<Activity className="w-5 h-5" />}
              colorFn={() => 'bg-admin-500'}
            />
            <MetricCard
              title="Request Rate"
              value={`${performance.requestRate}/s`}
              icon={<Wifi className="w-5 h-5" />}
              colorFn={() => 'bg-admin-500'}
            />
          </div>
        </div>
      )}

      {/* ── SECTION 3: System Logs ── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-5 text-admin-400" />
            <h3 className="card-title">System Logs</h3>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: 'all', label: 'All Levels' },
                { value: 'info', label: 'Info' },
                { value: 'warn', label: 'Warning' },
                { value: 'error', label: 'Error' },
              ]}
              value={logLevelFilter}
              onChange={e => setLogLevelFilter(e.target.value)}
              className="w-32"
            />
            <Select
              options={[
                { value: 'all', label: 'All Sources' },
                ...uniqueSources.map(s => ({ value: s, label: s })),
              ]}
              value={logSourceFilter}
              onChange={e => setLogSourceFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No logs available.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No logs match the current filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => { setLogLevelFilter('all'); setLogSourceFilter('all') }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="table-header w-24">Timestamp</th>
                  <th className="table-header w-20">Level</th>
                  <th className="table-header w-36">Source</th>
                  <th className="table-header">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="table-row">
                    <td className="table-cell text-xs text-slate-500 whitespace-nowrap font-mono">
                      <span title={formatTimestampFull(log.timestamp)}>
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Badge variant={logLevelBadgeVariant(log.level)} dot>
                        {log.level}
                      </Badge>
                    </td>
                    <td className="table-cell text-xs text-slate-400 font-mono">{log.source}</td>
                    <td className="table-cell text-sm text-slate-300 max-w-lg truncate" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 4: Queue Status (BullMQ) ── */}
      {queues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-admin-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Queue Status (BullMQ)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {queues.map(queue => (
              <QueueCard key={queue.id} queue={queue} />
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 5: Sidecar Services ── */}
      {sidecars.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-admin-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Sidecar Services</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {sidecars.map(svc => (
              <SidecarCard key={svc.id} service={svc} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-Components ──────────────────────────────────────────────

interface HealthServiceCardProps {
  name: string
  icon: React.ReactNode
  service: HealthService
}

function HealthServiceCard({ name, icon, service }: HealthServiceCardProps) {
  return (
    <div className={cn('card border transition-colors', statusColorClasses(service.status))}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('p-2 rounded-lg', statusColorClasses(service.status).split(' ').slice(0, 2).join(' '))}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{name}</p>
            <Badge variant={statusBadgeVariant(service.status)} dot>
              {statusLabel(service.status)}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Response</p>
          <p className="text-sm font-mono text-slate-300">{service.responseTime}ms</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Clock className="w-3 h-3" />
        <span>Last check: {formatTimestamp(service.lastCheck)}</span>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  percent?: number
  icon: React.ReactNode
  colorFn: (v: number) => string
}

function MetricCard({ title, value, percent, icon, colorFn }: MetricCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-admin-500/10 text-admin-400">
          {icon}
        </div>
      </div>
      {percent !== undefined && (
        <div className="space-y-1.5">
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colorFn(percent))}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface QueueCardProps {
  queue: QueueStatus
}

function QueueCard({ queue }: QueueCardProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-sky-400/10">
          <Layers className="w-4 h-4 text-sky-400" />
        </div>
        <p className="text-sm font-semibold text-slate-200">{queue.name}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-lg bg-slate-800/50">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-lg font-bold text-amber-400">{queue.pending}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-800/50">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-lg font-bold text-sky-400">{queue.active}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-800/50">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-lg font-bold text-emerald-400">{queue.completed.toLocaleString()}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-800/50">
          <p className="text-xs text-slate-500">Failed</p>
          <p className="text-lg font-bold text-red-400">{queue.failed}</p>
        </div>
      </div>
    </div>
  )
}

interface SidecarCardProps {
  service: SidecarService
}

function SidecarCard({ service }: SidecarCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'p-2 rounded-lg',
            service.status === 'online' ? 'bg-emerald-400/10' :
            service.status === 'degraded' ? 'bg-amber-400/10' : 'bg-red-400/10'
          )}>
            {service.status === 'online' ? <Wifi className="w-4 h-4 text-emerald-400" /> :
             service.status === 'degraded' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
             <XCircle className="w-4 h-4 text-red-400" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{service.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
          </div>
        </div>
        {statusIcon(service.status)}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <Badge variant={statusBadgeVariant(service.status)} dot>
          {statusLabel(service.status)}
        </Badge>
        <span className="text-xs text-slate-500">Uptime: {service.uptime}</span>
      </div>
    </div>
  )
}
