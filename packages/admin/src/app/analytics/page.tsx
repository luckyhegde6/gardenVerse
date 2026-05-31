'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, Download, TrendingUp, Users, Gamepad2, Wifi, Loader2, AlertCircle } from 'lucide-react'
import { Chart } from '@/components/Chart'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/Button'
import { Select } from '@/components/Select'
import api from '@/lib/api'

// ----------------------------------------------------------------
// API response types
// ----------------------------------------------------------------
interface DauMauEntry {
  month: string
  dau: number
  mau: number
}

interface DauMauResponse {
  dauMau: DauMauEntry[]
}

interface RegionalEntry {
  region: string
  users: number
  gardens: number
  iotDevices: number
  engagementRate: number
}

interface RegionalResponse {
  regions: RegionalEntry[]
}

interface RegionalBreakdownEntry {
  region: string
  dau: number
  mau: number
  revenue: number
  gardens: number
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Map a backend regional entry to the component's expected shape. */
function mapRegionalEntry(r: RegionalEntry): RegionalBreakdownEntry {
  return {
    region: r.region,
    dau: Math.round(r.users * (r.engagementRate / 100)),
    mau: r.users,
    revenue: 0,
    gardens: r.gardens,
  }
}

/** Derive a total DAU/MAU ratio from the dauMau array (last month). */
function computeDauMauRatio(data: DauMauEntry[]): { ratio: string; change: number } {
  if (data.length < 2) return { ratio: '—', change: 0 }
  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  const ratio = latest.mau > 0 ? (latest.dau / latest.mau) * 100 : 0
  const prevRatio = prev.mau > 0 ? (prev.dau / prev.mau) * 100 : 0
  return {
    ratio: `${ratio.toFixed(1)}%`,
    change: prevRatio > 0 ? Number(((ratio - prevRatio) / prevRatio * 100).toFixed(1)) : 0,
  }
}

function NoChartData() {
  return (
    <div className="flex items-center justify-center h-[280px] text-slate-500 text-sm">
      No data available
    </div>
  )
}

// ----------------------------------------------------------------
// Page component
// ----------------------------------------------------------------
export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6m')

  // State for API-fetched data (initialised as empty)
  const [dauMauData, setDauMauData] = useState<DauMauEntry[]>([])
  const [regionalBreakdown, setRegionalBreakdown] = useState<RegionalBreakdownEntry[]>([])

  // Loading / error state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [dauMauRes, regionalRes] = await Promise.all([
        api.get<DauMauResponse>('/analytics/dau-mau'),
        api.get<RegionalResponse>('/analytics/regional'),
      ])

      const dauMauBody = dauMauRes.data
      if (dauMauBody?.dauMau?.length) {
        setDauMauData(dauMauBody.dauMau)
      } else {
        setDauMauData([])
      }

      const regionalBody = regionalRes.data
      if (regionalBody?.regions?.length) {
        setRegionalBreakdown(regionalBody.regions.map(mapRegionalEntry))
      } else {
        setRegionalBreakdown([])
      }
    } catch {
      setError('Could not load from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Derive stat card values from live API data
  const dauMauRatio = computeDauMauRatio(dauMauData)

  // ----------------------------------------------------------
  // Loading state
  // ----------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchAnalytics()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '6m', label: 'Last 6 months' },
              { value: '1y', label: 'Last year' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-36"
          />
          <Button variant="secondary">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="DAU / MAU Ratio"
          value={dauMauRatio.ratio}
          change={dauMauRatio.change}
          trend={dauMauRatio.change >= 0 ? 'up' : 'down'}
          changeLabel="vs last month"
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Avg Session"
          value="—"
          change={0}
          trend="up"
          changeLabel="vs last month"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="Retention (D7)"
          value="—"
          change={0}
          trend="up"
          changeLabel="improving"
          icon={<Gamepad2 className="w-6 h-6" />}
        />
        <StatCard
          title="IoT Participation"
          value="—"
          change={0}
          trend="up"
          changeLabel="growing"
          icon={<Wifi className="w-6 h-6" />}
        />
      </div>

      {/* DAU/MAU trend + Retention cohorts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">DAU / MAU Trend</h3>
          </div>
          {dauMauData.length > 0 ? (
            <Chart
              data={dauMauData as unknown as Record<string, unknown>[]}
              series={[
                { key: 'dau', name: 'Daily Active Users', color: '#22c55e' },
                { key: 'mau', name: 'Monthly Active Users', color: '#3b82f6' },
              ]}
              kind="line"
              height={280}
            />
          ) : (
            <NoChartData />
          )}
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Retention Cohorts</h3>
          </div>
          <NoChartData />
        </div>
      </div>

      {/* Gameplay metrics + Marketplace volume */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gameplay Metrics</h3>
          </div>
          <NoChartData />
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Marketplace Volume & Transactions</h3>
          </div>
          <NoChartData />
        </div>
      </div>

      {/* IoT participation + Regional breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">IoT Participation</h3>
          </div>
          <NoChartData />
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Regional Breakdown</h3>
          </div>
          {regionalBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="table-header">Region</th>
                    <th className="table-header">DAU</th>
                    <th className="table-header">MAU</th>
                    <th className="table-header">Revenue</th>
                    <th className="table-header">Gardens</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalBreakdown.map((row) => (
                    <tr key={row.region} className="table-row">
                      <td className="table-cell font-medium text-slate-200">{row.region}</td>
                      <td className="table-cell">{row.dau.toLocaleString()}</td>
                      <td className="table-cell">{row.mau.toLocaleString()}</td>
                      <td className="table-cell">¤{row.revenue.toLocaleString()}</td>
                      <td className="table-cell">{row.gardens.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-sm p-4">No regional data available</p>
          )}
        </div>
      </div>
    </div>
  )
}
