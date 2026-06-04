'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bug, Search, FlaskRoundIcon as Flask, AlertTriangle, Leaf, Loader2, AlertCircle, Filter } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import api from '@/lib/api'

interface DiseaseStats {
  total: number
  byType: Record<string, number>
  byCrop: Record<string, number>
  severityCounts: Record<string, number>
}

interface DiseaseRow {
  id: string
  name: string
  aliases: string[]
  crops: string[]
  type: string
  severity: string
  symptoms: string[]
  chemical_control: string[]
  biological_control: string[]
  prevention: string[]
  regions: string[]
  season: string[]
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

const TYPE_COLORS: Record<string, string> = {
  fungus: 'bg-emerald-400/10 text-emerald-400',
  virus: 'bg-purple-400/10 text-purple-400',
  bacteria: 'bg-red-400/10 text-red-400',
  insect: 'bg-amber-400/10 text-amber-400',
  mite: 'bg-yellow-400/10 text-yellow-400',
  nematode: 'bg-slate-400/10 text-slate-400',
  deficiency: 'bg-sky-400/10 text-sky-400',
  physiological: 'bg-pink-400/10 text-pink-400',
  weed: 'bg-lime-400/10 text-lime-400',
}

const CROPS = ['Tomato', 'Rice', 'Wheat', 'Potato', 'Onion', 'Garlic', 'Eggplant', 'Chili', 'Capsicum', 'Okra', 'Mango', 'Banana', 'Citrus', 'Orange', 'Lemon', 'Lime', 'Grapefruit', 'Grape', 'Turmeric', 'Ginger', 'Sugarcane', 'Cotton', 'Groundnut', 'Maize', 'Sorghum', 'Cucumber', 'Pumpkin', 'Melon', 'Watermelon', 'Bottle Gourd', 'Bitter Gourd', 'Coffee', 'Pomegranate', 'Pea', 'Beans', 'Lentil', 'Chickpea', 'Pigeon Pea', 'Cabbage', 'Cauliflower', 'Broccoli', 'Kale', 'Mustard', 'Radish']

const TYPES = ['fungus', 'virus', 'bacteria', 'insect', 'mite', 'nematode', 'deficiency', 'physiological', 'weed']
const SEVERITIES = ['low', 'medium', 'high', 'critical']

export default function DiseasesPage() {
  const [diseases, setDiseases] = useState<DiseaseRow[]>([])
  const [stats, setStats] = useState<DiseaseStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [selectedDisease, setSelectedDisease] = useState<DiseaseRow | null>(null)

  const fetchData = useCallback(async (q?: string, crop?: string, type?: string, severity?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = { stats: 'true' }
      if (q) params.q = q
      if (crop) params.crop = crop
      if (type) params.type = type
      if (severity) params.severity = severity

      const res = await api.get('/diseases', { params })
      const body = res.data as { diseases: DiseaseRow[]; total: number; stats?: DiseaseStats }
      setDiseases(body.diseases ?? [])
      if (body.stats) setStats(body.stats)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? `Failed to load disease data: ${(err as { response: { status: number } }).response?.status ?? 'Unknown error'}`
        : 'Failed to load disease data. The server may be unavailable.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    fetchData(searchQuery || undefined, cropFilter || undefined, typeFilter || undefined, severityFilter || undefined)
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading disease database...</p>
        </div>
      </div>
    )
  }

  const severityCount = (s: string) => stats?.severityCounts?.[s] ?? 0

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchData()}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Diseases" value={stats?.total ?? 0} icon={<Bug className="w-6 h-6" />} />
        <StatCard title="Critical" value={severityCount('critical')} icon={<AlertTriangle className="w-6 h-6" />} trend={severityCount('critical') > 0 ? 'up' : undefined} />
        <StatCard title="Fungal" value={stats?.byType?.fungus ?? 0} icon={<Flask className="w-6 h-6" />} />
        <StatCard title="Insect Pests" value={stats?.byType?.insect ?? 0} icon={<Bug className="w-6 h-6" />} />
      </div>

      <div className="card">
        <div className="card-header flex flex-wrap gap-3">
          <h3 className="card-title">Disease Library</h3>
          <div className="flex-1" />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search diseases..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-48 bg-slate-800/50 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-admin-500/50"
              />
            </div>
            <select
              value={cropFilter}
              onChange={e => setCropFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-admin-500/50"
            >
              <option value="">All Crops</option>
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-admin-500/50"
            >
              <option value="">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-admin-500/50"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <Button variant="ghost" size="sm" onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-1" /> Filter
            </Button>
          </div>
        </div>

        {diseases.length > 0 ? (
          <DataTable
            columns={[
              { key: 'name', header: 'Disease', sortable: true, render: r => {
                const d = r as unknown as DiseaseRow
                return (
                  <button onClick={() => setSelectedDisease(d)} className="text-left hover:text-admin-400 transition-colors">
                    <div className="font-medium text-slate-200">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.aliases.slice(0, 2).join(', ')}{d.aliases.length > 2 ? '...' : ''}</div>
                  </button>
                )
              }},
              { key: 'crops', header: 'Affected Crops', sortable: true, render: r => {
                const c = (r as unknown as DiseaseRow).crops
                return (
                  <div className="flex flex-wrap gap-1">
                    {c.slice(0, 2).map((cr, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{cr}</span>
                    ))}
                    {c.length > 2 && <span className="text-xs text-slate-500">+{c.length - 2}</span>}
                  </div>
                )
              }},
              { key: 'type', header: 'Type', sortable: true, width: '100px', render: r => {
                const t = r.type as string
                return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[t] || 'bg-slate-800 text-slate-300'}`}>{t}</span>
              }},
              { key: 'severity', header: 'Severity', sortable: true, width: '90px', render: r => (
                <span className={`font-medium text-sm ${SEVERITY_COLORS[r.severity as string] || ''}`}>{(r.severity as string).toUpperCase()}</span>
              )},
              { key: 'symptoms', header: 'Symptoms', render: r => {
                const s = (r as unknown as DiseaseRow).symptoms
                return <span className="text-xs text-slate-400 line-clamp-2">{s.slice(0, 2).join(' | ')}</span>
              }},
            ]}
            data={diseases as unknown as Record<string, unknown>[]}
            keyExtractor={(r) => (r as unknown as DiseaseRow).id}
            searchable={false}
            pageSize={15}
            onRowClick={r => setSelectedDisease(r as unknown as DiseaseRow)}
          />
        ) : (
          <div className="p-8 text-center">
            <Leaf className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No diseases found matching your criteria.</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSearchQuery(''); setCropFilter(''); setTypeFilter(''); setSeverityFilter(''); fetchData() }}>Clear Filters</Button>
          </div>
        )}
      </div>

      {selectedDisease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedDisease(null)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700/60 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{selectedDisease.name}</h2>
                <p className="text-sm text-slate-500">{selectedDisease.id}</p>
              </div>
              <button onClick={() => setSelectedDisease(null)} className="text-slate-400 hover:text-slate-200 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-5">
              {selectedDisease.aliases.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Also Known As</h4>
                  <div className="flex flex-wrap gap-1.5">{selectedDisease.aliases.map((a, i) => <Badge key={i} variant="info">{a}</Badge>)}</div>
                </div>
              )}
              <div className="flex gap-3">
                <Badge variant={selectedDisease.severity === 'critical' ? 'error' : selectedDisease.severity === 'high' ? 'warning' : selectedDisease.severity === 'medium' ? 'info' : 'default'}>
                  {(selectedDisease.severity as string).toUpperCase()}
                </Badge>
                <Badge variant="default">{selectedDisease.type}</Badge>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Affected Crops</h4>
                <div className="flex flex-wrap gap-1.5">{selectedDisease.crops.map((c, i) => <Badge key={i}>{c}</Badge>)}</div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Symptoms</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedDisease.symptoms.map((s, i) => <li key={i} className="text-sm text-slate-300">{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Spread</h4>
                <p className="text-sm text-slate-300">{selectedDisease.symptoms[0]}</p>
              </div>
              {selectedDisease.chemical_control.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Chemical Control</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedDisease.chemical_control.map((c, i) => <li key={i} className="text-sm text-slate-300">{c}</li>)}
                  </ul>
                </div>
              )}
              {selectedDisease.biological_control.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Biological / Organic Control</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedDisease.biological_control.map((b, i) => <li key={i} className="text-sm text-slate-300">{b}</li>)}
                  </ul>
                </div>
              )}
              {selectedDisease.prevention.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Prevention</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedDisease.prevention.map((p, i) => <li key={i} className="text-sm text-slate-300">{p}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Regions</h4>
                <p className="text-sm text-slate-300">{selectedDisease.regions?.join(', ') || 'Various'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
