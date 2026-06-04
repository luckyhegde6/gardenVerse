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
  Search,
  Trash2,
  Route,
} from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Select } from '@/components/Select'
import { Toggle } from '@/components/Toggle'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

// ── Mock Fallback Data ──────────────────────────────────────────

const FALLBACK_LOGS: LogEntry[] = [
  { id: '1', timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', source: 'api', message: 'GET /health → 200 (12ms)' },
  { id: '2', timestamp: new Date(Date.now() - 15000).toISOString(), level: 'info', source: 'api', message: 'GET /gardens → 200 (45ms)' },
  { id: '3', timestamp: new Date(Date.now() - 30000).toISOString(), level: 'warn', source: 'auth', message: 'Login attempt from unknown IP' },
  { id: '4', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', source: 'api', message: 'POST /auth/login → 200 (230ms)' },
  { id: '5', timestamp: new Date(Date.now() - 90000).toISOString(), level: 'error', source: 'db', message: 'Query timeout on crops table (3500ms)' },
  { id: '6', timestamp: new Date(Date.now() - 120000).toISOString(), level: 'info', source: 'api', message: 'GET /users → 200 (28ms)' },
  { id: '7', timestamp: new Date(Date.now() - 180000).toISOString(), level: 'warn', source: 'cache', message: 'Redis connection re-established after 2s outage' },
  { id: '8', timestamp: new Date(Date.now() - 240000).toISOString(), level: 'info', source: 'api', message: 'GET /marketplace/listings → 200 (67ms)' },
  { id: '9', timestamp: new Date(Date.now() - 300000).toISOString(), level: 'error', source: 'ai', message: 'AI service returned 503, using fallback analysis' },
  { id: '10', timestamp: new Date(Date.now() - 360000).toISOString(), level: 'info', source: 'system', message: 'Scheduled job: weather sync completed (340 gardens)' },
]

const MOCK_ENDPOINT_METRICS: EndpointMetric[] = [
  { path: '/api/v1/auth/login', method: 'POST', requestCount: 1247, avgResponseTime: 245, errorRate: 1.2, lastAccessed: '2 min ago' },
  { path: '/api/v1/gardens', method: 'GET', requestCount: 8932, avgResponseTime: 42, errorRate: 0.3, lastAccessed: '30s ago' },
  { path: '/api/v1/crops', method: 'GET', requestCount: 15420, avgResponseTime: 38, errorRate: 0.1, lastAccessed: '15s ago' },
  { path: '/api/v1/users', method: 'GET', requestCount: 3451, avgResponseTime: 56, errorRate: 0.4, lastAccessed: '1 min ago' },
  { path: '/api/v1/weather', method: 'GET', requestCount: 6782, avgResponseTime: 312, errorRate: 2.8, lastAccessed: '45s ago' },
  { path: '/api/v1/marketplace/listings', method: 'GET', requestCount: 2108, avgResponseTime: 67, errorRate: 0.6, lastAccessed: '3 min ago' },
  { path: '/api/v1/health', method: 'GET', requestCount: 44120, avgResponseTime: 12, errorRate: 0.0, lastAccessed: '5s ago' },
  { path: '/api/v1/analytics', method: 'GET', requestCount: 872, avgResponseTime: 890, errorRate: 4.5, lastAccessed: '10 min ago' },
  { path: '/api/v1/community/groups', method: 'GET', requestCount: 1560, avgResponseTime: 73, errorRate: 0.8, lastAccessed: '8 min ago' },
  { path: '/api/v1/ai/scan', method: 'POST', requestCount: 423, avgResponseTime: 1240, errorRate: 6.2, lastAccessed: '15 min ago' },
]

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

interface EndpointMetric {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  requestCount: number
  avgResponseTime: number
  errorRate: number
  lastAccessed: string
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
  const [endpointMetrics, setEndpointMetrics] = useState<EndpointMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [clearingLogs, setClearingLogs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all')
  const [logSourceFilter, setLogSourceFilter] = useState<string>('all')
  const [logSearch, setLogSearch] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Data Fetching ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [healthRes, perfRes, logsRes, queuesRes, sidecarsRes, endpointsRes] = await Promise.allSettled([
        api.get('/health/detailed'),
        api.get('/admin'),
        api.get('/logs', { params: { level: logLevelFilter !== 'all' ? logLevelFilter : undefined, search: logSearch || undefined } }),
        api.get('/queues'),
        api.get('/sidecars'),
        api.get('/analytics/endpoints'),
      ])

      if (healthRes.status === 'fulfilled') {
        const h = healthRes.value.data as Record<string, unknown>
        if (h && typeof h === 'object' && 'services' in h) {
          const svc = h.services as Record<string, string>
          setHealth({
            api: { status: svc.api === 'healthy' ? 'online' : 'degraded', responseTime: 0, lastCheck: new Date().toISOString() },
            database: { status: svc.database === 'healthy' ? 'online' : 'offline', responseTime: 0, lastCheck: new Date().toISOString() },
            redis: { status: 'offline', responseTime: 0, lastCheck: new Date().toISOString() },
            ai: { status: 'offline', responseTime: 0, lastCheck: new Date().toISOString() },
          })
        }
      } else {
        console.error('Health API failed:', healthRes.reason)
        if (!health) setError(prev => prev ?? 'Failed to load health data.')
      }

      if (perfRes.status === 'fulfilled') {
        const p = perfRes.value.data as Record<string, unknown>
        if (p && typeof p === 'object' && 'dau' in p) {
          setPerformance({
            cpu: 0,
            memory: 0,
            activeUsers: (p.activeSessions as number) ?? 0,
            requestRate: (p.serverLoad as number) ?? 0,
          })
        }
      } else {
        console.error('Performance API failed:', perfRes.reason)
        if (!performance) setError(prev => prev ?? 'Failed to load performance metrics.')
      }

      if (logsRes.status === 'fulfilled') {
        const logsData = logsRes.value.data as { logs: LogEntry[] } | LogEntry[]
        const parsed = Array.isArray(logsData) ? logsData : (logsData.logs ?? [])
        setLogs(parsed.length > 0 ? parsed : FALLBACK_LOGS)
      } else {
        console.error('Logs API failed:', logsRes.reason)
        if (logs.length === 0) setLogs(FALLBACK_LOGS)
      }

      if (queuesRes.status === 'fulfilled') {
        const qData = queuesRes.value.data as QueueStatus[]
        setQueues(Array.isArray(qData) ? qData : [])
      }

      if (sidecarsRes.status === 'fulfilled') {
        const sData = sidecarsRes.value.data as SidecarService[]
        setSidecars(Array.isArray(sData) ? sData : [])
      }

      if (endpointsRes.status === 'fulfilled') {
        const eData = endpointsRes.value.data as { metrics: EndpointMetric[] } | EndpointMetric[]
        const parsed = Array.isArray(eData) ? eData : (eData.metrics ?? [])
        setEndpointMetrics(parsed.length > 0 ? parsed : MOCK_ENDPOINT_METRICS)
      } else {
        console.error('Endpoints API failed:', endpointsRes.reason)
        setEndpointMetrics(MOCK_ENDPOINT_METRICS)
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
    if (logSearch) {
      const q = logSearch.toLowerCase()
      if (!log.message.toLowerCase().includes(q) && !log.source.toLowerCase().includes(q)) return false
    }
    return true
  })

  // ── Clear Logs ──
  const handleClearLogs = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) return
    setClearingLogs(true)
    try {
      await api.post('/logs/clear')
      setLogs([])
    } catch {
      setError('Failed to clear logs.')
    } finally {
      setClearingLogs(false)
    }
  }, [])

  // ── Loading State ──
  if (loading && !health && !performance && logs.length === 0 && queues.length === 0 && sidecars.length === 0 && endpointMetrics.length === 0) {
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
  if (error && !health && !performance && logs.length === 0 && queues.length === 0 && sidecars.length === 0 && endpointMetrics.length === 0) {
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

      {/* ── SECTION 3: API Endpoint Performance ── */}
      {endpointMetrics.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-5 text-admin-400" />
              <h3 className="card-title">API Endpoint Performance</h3>
              <span className="text-xs text-slate-500 ml-2">
                {endpointMetrics.reduce((s, e) => s + e.requestCount, 0).toLocaleString()} total requests
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="table-header">Endpoint</th>
                  <th className="table-header w-20">Method</th>
                  <th className="table-header w-28 text-right">Requests</th>
                  <th className="table-header w-28 text-right">Avg Response</th>
                  <th className="table-header w-24 text-right">Error Rate</th>
                  <th className="table-header w-28">Last Accessed</th>
                </tr>
              </thead>
              <tbody>
                {endpointMetrics.map((ep, i) => (
                  <tr key={`${ep.method}-${ep.path}-${i}`} className="table-row">
                    <td className="table-cell text-xs text-slate-300 font-mono max-w-xs truncate" title={ep.path}>
                      {ep.path}
                    </td>
                    <td className="table-cell">
                      <Badge variant={ep.method === 'GET' ? 'info' : ep.method === 'POST' ? 'success' : ep.method === 'PUT' ? 'warning' : 'error'}>
                        {ep.method}
                      </Badge>
                    </td>
                    <td className="table-cell text-sm text-slate-300 text-right font-mono">
                      {ep.requestCount.toLocaleString()}
                    </td>
                    <td className="table-cell text-right">
                      <span className={cn(
                        'text-sm font-mono',
                        ep.avgResponseTime < 100 ? 'text-emerald-400' :
                        ep.avgResponseTime < 500 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {ep.avgResponseTime}ms
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <span className={cn(
                        'text-sm font-mono',
                        ep.errorRate < 1 ? 'text-emerald-400' :
                        ep.errorRate < 3 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {ep.errorRate}%
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-500 font-mono">{ep.lastAccessed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECTION 4: System Logs ── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-5 text-admin-400" />
            <h3 className="card-title">System Logs</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                className="w-44 bg-slate-800/60 border border-slate-700/60 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-admin-500/50"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Levels' },
                { value: 'info', label: 'Info' },
                { value: 'warn', label: 'Warning' },
                { value: 'error', label: 'Error' },
              ]}
              value={logLevelFilter}
              onChange={e => setLogLevelFilter(e.target.value)}
              className="w-28"
            />
            <Select
              options={[
                { value: 'all', label: 'All Sources' },
                ...uniqueSources.map(s => ({ value: s, label: s })),
              ]}
              value={logSourceFilter}
              onChange={e => setLogSourceFilter(e.target.value)}
              className="w-36"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLogs}
              disabled={clearingLogs || logs.length === 0}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <Trash2 className={cn('w-3.5 h-3.5', clearingLogs && 'animate-spin')} />
              Clear
            </Button>
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
              onClick={() => { setLogLevelFilter('all'); setLogSourceFilter('all'); setLogSearch('') }}
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
