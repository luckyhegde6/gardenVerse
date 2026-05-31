'use client'

import { useState, useEffect, useCallback } from 'react'
import { Flag, Plus, History, Globe, Users, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Toggle } from '@/components/Toggle'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { DataTable } from '@/components/DataTable'
import { formatRelativeTime } from '@/lib/utils'
import api from '@/lib/api'
import type { FeatureFlag } from '@/lib/api'

interface HistoryEntry {
  id: string
  flag: string
  action: string
  from: string
  to: string
  by: string
  time: string
}

const regionOptions = [
  { value: 'all', label: 'All Regions' },
  { value: 'na', label: 'North America' },
  { value: 'eu', label: 'Europe' },
  { value: 'ap', label: 'Asia Pacific' },
  { value: 'latam', label: 'Latin America' },
  { value: 'me', label: 'Middle East' },
  { value: 'af', label: 'Africa' },
]

export default function FeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [flagHistory, setFlagHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '', region: 'all', rollout: 0 })
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  interface BackendFlag {
    id: string
    name: string
    enabled: boolean
    description: string
    rules: { percentage?: number; regions?: string[]; userIds?: string[] } | null
    createdAt: string
    updatedAt: string
  }

  function mapBackendFlag(f: BackendFlag): FeatureFlag {
    const rules = f.rules || {}
    const regions = rules.regions || []
    const userOverrides = rules.userIds
      ? rules.userIds.map(uid => ({ userId: uid, enabled: true }))
      : []
    return {
      id: f.id,
      key: f.name,
      name: f.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: f.description,
      enabled: f.enabled,
      rolloutPercentage: rules.percentage ?? 0,
      regions,
      userOverrides,
      createdBy: 'system',
      updatedAt: f.updatedAt,
    }
  }

  const fetchFlags = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await api.get('/feature-flags')
      const data = res.data
      const list: BackendFlag[] = Array.isArray(data) ? data : data.data ?? []
      setFlags(list.map(mapBackendFlag))
    } catch {
      setError('Failed to load feature flags from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/feature-flags/history')
      const data = res.data
      const list: HistoryEntry[] = Array.isArray(data) ? data : data.data ?? []
      setFlagHistory(list)
    } catch {
      setFlagHistory([])
    }
  }, [])

  useEffect(() => { fetchFlags() }, [fetchFlags])

  const toggleFlag = useCallback(async (id: string, currentEnabled: boolean) => {
    const flag = flags.find(f => f.id === id)
    if (!flag) return

    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))

    try {
      await api.put(`/feature-flags/${flag.key}`, { enabled: !currentEnabled })
    } catch {
      setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: currentEnabled } : f))
      setError('Failed to update flag. Changes reverted.')
    }
  }, [flags])

  const updateRollout = useCallback(async (id: string, value: number, previousValue: number) => {
    const flag = flags.find(f => f.id === id)
    if (!flag) return

    setFlags(prev => prev.map(f => f.id === id ? { ...f, rolloutPercentage: value } : f))

    try {
      const rules = { percentage: value, regions: flag.regions }
      await api.put(`/feature-flags/${flag.key}`, { rules })
    } catch {
      setFlags(prev => prev.map(f => f.id === id ? { ...f, rolloutPercentage: previousValue } : f))
      setError('Failed to update rollout percentage. Changes reverted.')
    }
  }, [flags])

  const deleteFlag = useCallback(async (id: string) => {
    const flag = flags.find(f => f.id === id)
    if (!flag) return

    // Optimistic removal
    setFlags(prev => prev.filter(f => f.id !== id))

    try {
      await api.delete(`/feature-flags/${flag.key}`)
    } catch {
      setError('Failed to delete flag.')
      fetchFlags() // Re-fetch to restore
    }
  }, [flags, fetchFlags])

  const handleCreateFlag = useCallback(async () => {
    if (!newFlag.key || !newFlag.name) {
      setCreateError('Flag key and name are required.')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const res = await api.post('/feature-flags', {
        name: newFlag.key,
        description: newFlag.description,
        enabled: true,
        rules: {
          percentage: newFlag.rollout,
          regions: newFlag.region === 'all' ? ['all'] : [newFlag.region],
        },
      })

      const createdFlag = res.data?.data ?? res.data
      setFlags(prev => [...prev, mapBackendFlag(createdFlag as BackendFlag)])
      setShowCreate(false)
      setNewFlag({ key: '', name: '', description: '', region: 'all', rollout: 0 })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        setCreateError(axiosErr.response?.data?.message ?? 'Failed to create flag.')
      } else {
        setCreateError('Failed to create flag.')
      }
    } finally {
      setIsCreating(false)
    }
  }, [newFlag])

  if (isLoading && flags.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading feature flags...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flag className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Feature Flags</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => { setShowHistory(true); fetchHistory() }}>
            <History className="w-4 h-4" /> History
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Flag
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchFlags}>
            Retry
          </Button>
        </div>
      )}

      {flags.length === 0 && !error && !isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Flag className="w-12 h-12 text-slate-600" />
          <p className="text-slate-400 text-sm">No feature flags found.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Create Your First Flag
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {flags.map(flag => (
          <div key={flag.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Toggle
                    pressed={flag.enabled}
                    onPressedChange={() => toggleFlag(flag.id, flag.enabled)}
                  />
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{flag.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{flag.key}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-2 ml-11">{flag.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={flag.enabled ? 'success' : 'default'} dot>
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <button
                  onClick={() => deleteFlag(flag.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete flag"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 ml-11 flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Rollout</span>
                  <span className="text-xs font-medium text-slate-300">{flag.rolloutPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={flag.rolloutPercentage}
                  onChange={e => updateRollout(flag.id, parseInt(e.target.value), flag.rolloutPercentage)}
                  className="w-full h-1.5 rounded-full appearance-none bg-slate-800 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-admin-500
                    [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Globe className="w-3.5 h-3.5" />
                <span>{flag.regions.length ? flag.regions.join(', ').toUpperCase() : 'None'}</span>
              </div>
              {flag.userOverrides.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{flag.userOverrides.length} override{flag.userOverrides.length > 1 ? 's' : ''}</span>
                </div>
              )}
              <span className="text-xs text-slate-600">{formatRelativeTime(flag.updatedAt)}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCreate} onOpenChange={setShowCreate} title="Create Feature Flag">
        <div className="space-y-4">
          {createError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{createError}</p>
            </div>
          )}
          <Input
            id="flag-key"
            label="Flag Key"
            value={newFlag.key}
            onChange={e => setNewFlag(prev => ({ ...prev, key: e.target.value }))}
            placeholder="e.g., new-feature-name"
          />
          <Input
            id="flag-name"
            label="Display Name"
            value={newFlag.name}
            onChange={e => setNewFlag(prev => ({ ...prev, name: e.target.value }))}
            placeholder="New Feature Name"
          />
          <Input
            id="flag-desc"
            label="Description"
            value={newFlag.description}
            onChange={e => setNewFlag(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this flag controls..."
          />
          <Select
            id="flag-region"
            label="Region"
            value={newFlag.region}
            onChange={e => setNewFlag(prev => ({ ...prev, region: e.target.value }))}
            options={regionOptions}
          />
          <div>
            <label htmlFor="flag-rollout" className="block text-sm font-medium text-slate-300 mb-1.5">
              Initial Rollout: {newFlag.rollout}%
            </label>
            <input
              id="flag-rollout"
              type="range"
              min="0"
              max="100"
              value={newFlag.rollout}
              onChange={e => setNewFlag(prev => ({ ...prev, rollout: parseInt(e.target.value) }))}
              className="w-full h-1.5 rounded-full appearance-none bg-slate-800 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-admin-500
                [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => { setShowCreate(false); setCreateError(null) }}>
              Cancel
            </Button>
            <Button onClick={handleCreateFlag} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                'Create Flag'
              )}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      <Modal open={showHistory} onOpenChange={setShowHistory} title="Flag Change History" className="max-w-2xl">
        {flagHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No history available.</p>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'flag', header: 'Flag', sortable: true },
              { key: 'action', header: 'Action', sortable: true },
              { key: 'from', header: 'From', sortable: true },
              { key: 'to', header: 'To', sortable: true },
              { key: 'by', header: 'Changed By', sortable: true },
              { key: 'time', header: 'When', sortable: true },
            ]}
            data={flagHistory as unknown as Record<string, unknown>[]}
            keyExtractor={item => String(item.id ?? '')}
            pageSize={5}
          />
        )}
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowHistory(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
