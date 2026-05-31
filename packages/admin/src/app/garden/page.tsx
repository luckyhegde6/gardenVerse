'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sprout, Trees, Bug, Droplets, Loader2, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import api from '@/lib/api'

interface DashboardStats {
  totalGardens: number
  totalCrops: number
  totalUsers: number
  verifiedUsers: number
  verificationRate: string
  activeListings: number
  completedTransactions: number
  totalRevenue: number
  reportsPending: number
  activeSessions: number
}

export default function GardenPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await api.get('/admin/dashboard')
      const data = res.data as DashboardStats
      setStats(data)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Failed to load garden data: ${(err as { response: { status: number } }).response?.status ?? 'Unknown error'}`
          : 'Failed to load garden data. The server may be unavailable.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading garden data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchStats}>Retry</Button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Gardens" value={stats?.totalGardens ?? 0} change={6.8} trend="up" icon={<Trees className="w-6 h-6" />} changeLabel="this month" />
            <StatCard title="Active Crops" value={stats?.totalCrops ?? 0} change={3.2} trend="up" icon={<Sprout className="w-6 h-6" />} changeLabel="vs last week" />
            <StatCard title="Diseased Crops" value={0} change={0} trend="up" icon={<Bug className="w-6 h-6" />} changeLabel="N/A" />
            <StatCard title="Avg Soil Quality" value="N/A" icon={<Droplets className="w-6 h-6" />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Gardens Overview</h3>
                <Badge variant="info">API</Badge>
              </div>
              <DataTable
                columns={[
                  { key: 'name', header: 'Name', sortable: true },
                  { key: 'owner', header: 'Owner', sortable: true },
                  { key: 'type', header: 'Type', sortable: true, width: '90px', render: r => {
                    const colors: Record<string, string> = { VIRTUAL: 'text-sky-400', REAL: 'text-emerald-400', HYBRID: 'text-purple-400' }
                    return <span className={colors[r.type as string] || ''}>{r.type as string}</span>
                  }},
                  { key: 'size', header: 'Plots', sortable: true, width: '70px' },
                  { key: 'crops', header: 'Crops', sortable: true, width: '70px' },
                  { key: 'soilQuality', header: 'Soil', sortable: true, width: '80px', render: r => {
                    const v = r.soilQuality as number
                    return <span className={v >= 70 ? 'text-emerald-400' : v >= 40 ? 'text-amber-400' : 'text-red-400'}>{v}%</span>
                  }},
                  { key: 'irrigation', header: 'Water', sortable: true, width: '80px', render: r => {
                    const v = r.irrigation as number
                    return <span className={v >= 70 ? 'text-emerald-400' : v >= 40 ? 'text-amber-400' : 'text-red-400'}>{v}%</span>
                  }},
                  { key: 'status', header: 'Status', sortable: true, width: '90px', render: r => (
                    <Badge variant={(r.status as string) === 'active' ? 'active' : (r.status as string) === 'suspended' ? 'suspended' : 'inactive'} dot>{r.status as string}</Badge>
                  )},
                ]}
                data={[] as Record<string, unknown>[]}
                keyExtractor={() => ''}
                pageSize={8}
                emptyMessage="No admin garden listing API available."
              />
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Crop Health Monitor</h3>
                <Badge variant="info">API</Badge>
              </div>
              <DataTable
                columns={[
                  { key: 'name', header: 'Crop', sortable: true },
                  { key: 'garden', header: 'Garden', sortable: true },
                  { key: 'stage', header: 'Stage', sortable: true, width: '100px', render: r => {
                    const colors: Record<string, string> = { SEED: 'text-slate-400', SPROUTING: 'text-sky-400', GROWING: 'text-emerald-400', MATURE: 'text-amber-400', HARVESTED: 'text-green-600', WILTED: 'text-red-400', DISEASED: 'text-red-600' }
                    return <span className={colors[r.stage as string] || ''}>{(r.stage as string).charAt(0) + (r.stage as string).slice(1).toLowerCase()}</span>
                  }},
                  { key: 'health', header: 'Health', sortable: true, width: '80px', render: r => {
                    const v = r.health as number
                    return (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full ${v >= 70 ? 'bg-emerald-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{v}%</span>
                      </div>
                    )
                  }},
                  { key: 'status', header: 'Status', sortable: true, width: '90px', render: r => {
                    const map: Record<string, 'success' | 'warning' | 'error'> = { healthy: 'success', warning: 'warning', error: 'error' }
                    return <Badge variant={map[r.status as string] || 'default'} dot>{r.status as string}</Badge>
                  }},
                ]}
                data={[] as Record<string, unknown>[]}
                keyExtractor={() => ''}
                pageSize={6}
                emptyMessage="No admin crop listing API available."
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
