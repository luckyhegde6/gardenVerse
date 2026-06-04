'use client'

import { useState, useEffect, useCallback } from 'react'
import { Scan, AlertTriangle, ThumbsUp, Activity, Loader2, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────

interface AiScan {
  id: string
  plantName: string
  disease: string
  confidence: number
  date: string
  user: string
}

interface DiseasePrevalence {
  disease: string
  count: number
  percentage: number
  severity: string
}

interface HealthScore {
  plant: string
  avgHealthScore: number
  scanCount: number
  lastScanned: string
}

// ── Helpers ────────────────────────────────────────────────

function getConfidenceVariant(confidence: number) {
  if (confidence >= 90) return 'success'
  if (confidence >= 75) return 'info'
  if (confidence >= 60) return 'warning'
  return 'error'
}

function getSeverityVariant(severity: string) {
  switch (severity) {
    case 'critical': return 'error'
    case 'high': return 'warning'
    case 'medium': return 'info'
    default: return 'default'
  }
}

function getHealthScoreVariant(score: number) {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  if (score >= 40) return 'info'
  return 'error'
}

// ── Page Component ────────────────────────────────────────

export default function AiScannerPage() {
  const [recentScans, setRecentScans] = useState<AiScan[]>([])
  const [diseasePrevalence] = useState<DiseasePrevalence[]>([])
  const [healthScores] = useState<HealthScore[]>([])
  const [totalScans, setTotalScans] = useState(0)
  const [diseasesDetected, setDiseasesDetected] = useState(0)
  const [healthyPlants, setHealthyPlants] = useState(0)
  const [accuracyRate, setAccuracyRate] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const scansRes = await api.get('/ai', { params: { limit: 50 } })

      // Parse scans
      const scansBody = scansRes.data as Record<string, unknown>
      const rawScans = ((scansBody.data as unknown[]) ?? (Array.isArray(scansBody) ? scansBody : [])) as Record<string, unknown>[]

      if (rawScans.length > 0) {
        const parsedScans: AiScan[] = rawScans.map(s => {
          const diseases = s.diseases ? (Array.isArray(s.diseases) ? s.diseases : [s.diseases]) : []
          const diseaseName = diseases.length > 0 ? String(diseases[0]?.name ?? diseases[0] ?? '') : ''
          return {
            id: String(s.id ?? ''),
            plantName: String(s.plantName ?? s.plant_name ?? 'Unknown'),
            disease: diseaseName,
            confidence: Number(s.healthScore ?? 0),
            date: String(s.createdAt ?? s.date ?? '').slice(0, 10),
            user: String((s.user as { username?: string })?.username ?? s.userName ?? ''),
          }
        })
        setRecentScans(parsedScans)

        // Derive stats from scan data
        const healthy = parsedScans.filter(s => s.disease === 'None' || s.disease === '').length
        const diseased = parsedScans.filter(s => s.disease !== 'None' && s.disease !== '').length
        setTotalScans(parsedScans.length)
        setDiseasesDetected(diseased)
        setHealthyPlants(healthy)
        if (parsedScans.length > 0) {
          const validScores = parsedScans.filter(s => s.confidence > 0).map(s => s.confidence)
          const avgConfidence = validScores.length > 0
            ? validScores.reduce((sum, c) => sum + c, 0) / validScores.length
            : 0
          setAccuracyRate(Math.round(avgConfidence * 10) / 10)
        }
      }
    } catch {
      setError('Could not load AI scanner data from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading AI scanner data...</p>
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
          <Button variant="ghost" size="sm" onClick={fetchAll}>Retry</Button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Scans"
          value={totalScans}
          change={12.5}
          trend="up"
          icon={<Scan className="w-6 h-6" />}
          changeLabel="this month"
        />
        <StatCard
          title="Diseases Detected"
          value={diseasesDetected}
          change={-4.1}
          trend="down"
          icon={<AlertTriangle className="w-6 h-6" />}
          changeLabel="vs last month"
        />
        <StatCard
          title="Healthy Plants"
          value={healthyPlants}
          change={8.2}
          trend="up"
          icon={<ThumbsUp className="w-6 h-6" />}
          changeLabel="vs last month"
        />
        <StatCard
          title="Accuracy Rate"
          value={`${accuracyRate}%`}
          change={1.5}
          trend="up"
          icon={<Activity className="w-6 h-6" />}
          changeLabel="this month"
        />
      </div>

      {/* Recent Scans */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Scans</h3>
        </div>
        <DataTable
          columns={[
            { key: 'plantName', header: 'Plant Name', sortable: true },
            {
              key: 'disease',
              header: 'Disease Diagnosis',
              sortable: true,
              render: r => {
                const d = r.disease as string
                return d === 'None'
                  ? <span className="text-emerald-400 font-medium">Healthy</span>
                  : <span className="text-red-400">{d}</span>
              },
            },
            {
              key: 'confidence',
              header: 'Confidence',
              sortable: true,
              width: '110px',
              render: r => {
                const c = r.confidence as number
                return (
                  <Badge variant={getConfidenceVariant(c)}>
                    {c}%
                  </Badge>
                )
              },
            },
            { key: 'date', header: 'Date', sortable: true },
            { key: 'user', header: 'User', sortable: true },
          ]}
          data={recentScans as unknown as Record<string, unknown>[]}
          keyExtractor={s => String(s.id)}
          searchable
          searchPlaceholder="Search scans..."
          pageSize={8}
        />
      </div>

      {/* Disease Prevalence */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Disease Prevalence</h3>
        </div>
        {diseasePrevalence.length > 0 ? (
          <DataTable
            columns={[
              { key: 'disease', header: 'Disease', sortable: true },
              { key: 'count', header: 'Count', sortable: true, width: '90px' },
              {
                key: 'percentage',
                header: '% of Total',
                sortable: true,
                width: '110px',
                render: r => <span>{(r.percentage as number).toFixed(1)}%</span>,
              },
              {
                key: 'severity',
                header: 'Severity',
                sortable: true,
                width: '110px',
                render: r => {
                  const s = r.severity as string
                  return (
                    <Badge variant={getSeverityVariant(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Badge>
                  )
                },
              },
            ]}
            data={diseasePrevalence as unknown as Record<string, unknown>[]}
            keyExtractor={d => String(d.disease)}
            searchable
            searchPlaceholder="Search diseases..."
            pageSize={8}
          />
        ) : (
          <p className="text-sm text-slate-500 p-4">No disease prevalence data available.</p>
        )}
      </div>

      {/* AI Health Scores */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">AI Health Scores</h3>
        </div>
        {healthScores.length > 0 ? (
          <DataTable
            columns={[
              { key: 'plant', header: 'Plant', sortable: true },
              {
                key: 'avgHealthScore',
                header: 'Avg Health Score',
                sortable: true,
                width: '160px',
                render: r => {
                  const s = r.avgHealthScore as number
                  return (
                    <Badge variant={getHealthScoreVariant(s)}>
                      {s}/100
                    </Badge>
                  )
                },
              },
              { key: 'scanCount', header: 'Scan Count', sortable: true, width: '110px' },
              { key: 'lastScanned', header: 'Last Scanned', sortable: true },
            ]}
            data={healthScores as unknown as Record<string, unknown>[]}
            keyExtractor={h => String(h.plant)}
            searchable
            searchPlaceholder="Search plants..."
            pageSize={8}
          />
        ) : (
          <p className="text-sm text-slate-500 p-4">No health score data available.</p>
        )}
      </div>
    </div>
  )
}
