'use client'

import { useState } from 'react'
import { Flag, Plus, History, Globe, Users } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Toggle } from '@/components/Toggle'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { DataTable } from '@/components/DataTable'
import { formatRelativeTime } from '@/lib/utils'

const initialFlags = [
  { id: 'f1', key: 'seasonal-events', name: 'Seasonal Events', description: 'Enable seasonal gardening events worldwide', enabled: true, rolloutPercentage: 100, regions: ['all'], userOverrides: [], createdBy: 'admin_alex', updatedAt: '2026-05-27T10:00:00Z' },
  { id: 'f2', key: 'pvp-arena-v2', name: 'PvP Arena v2', description: 'New PvP battle system with rankings', enabled: true, rolloutPercentage: 50, regions: ['na', 'eu'], userOverrides: [{ userId: 'user_preview_01', enabled: true }], createdBy: 'admin_alex', updatedAt: '2026-05-26T14:30:00Z' },
  { id: 'f3', key: 'iot-sensor-upgrade', name: 'IoT Sensor Upgrade', description: 'Enhanced IoT sensor data collection', enabled: false, rolloutPercentage: 0, regions: [], userOverrides: [], createdBy: 'dev_sarah', updatedAt: '2026-05-25T09:00:00Z' },
  { id: 'f4', key: 'marketplace-auctions', name: 'Marketplace Auctions', description: 'Bidding system for rare items', enabled: true, rolloutPercentage: 25, regions: ['na'], userOverrides: [], createdBy: 'admin_alex', updatedAt: '2026-05-24T16:45:00Z' },
  { id: 'f5', key: 'ai-garden-advisor', name: 'AI Garden Advisor', description: 'AI-powered gardening recommendations', enabled: true, rolloutPercentage: 100, regions: ['all'], userOverrides: [], createdBy: 'dev_sarah', updatedAt: '2026-05-23T11:20:00Z' },
  { id: 'f6', key: 'cross-server-trading', name: 'Cross-Server Trading', description: 'Trade items across different server regions', enabled: false, rolloutPercentage: 0, regions: [], userOverrides: [{ userId: 'beta_tester_42', enabled: true }], createdBy: 'admin_alex', updatedAt: '2026-05-22T08:00:00Z' },
  { id: 'f7', key: 'premium-quests-v2', name: 'Premium Quests v2', description: 'New quest line for premium subscribers', enabled: true, rolloutPercentage: 80, regions: ['na', 'eu', 'ap'], userOverrides: [], createdBy: 'dev_sarah', updatedAt: '2026-05-21T13:15:00Z' },
]

const flagHistory = [
  { flag: 'pvp-arena-v2', action: 'Rollout increased', from: '25%', to: '50%', by: 'admin_alex', time: '2d ago' },
  { flag: 'pvp-arena-v2', action: 'Rollout started', from: '0%', to: '25%', by: 'admin_alex', time: '5d ago' },
  { flag: 'marketplace-auctions', action: 'Enabled', from: 'Disabled', to: '25% NA', by: 'admin_alex', time: '1w ago' },
  { flag: 'ai-garden-advisor', action: 'Full rollout', from: '50%', to: '100%', by: 'dev_sarah', time: '2w ago' },
]

export default function FeaturesPage() {
  const [flags, setFlags] = useState(initialFlags)
  const [showCreate, setShowCreate] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '' })

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
  }

  const updateRollout = (id: string, value: number) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, rolloutPercentage: value } : f))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flag className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Feature Flags</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setShowHistory(true)}>
            <History className="w-4 h-4" /> History
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Flag
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {flags.map(flag => (
          <div key={flag.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Toggle
                    pressed={flag.enabled}
                    onPressedChange={() => toggleFlag(flag.id)}
                  />
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{flag.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{flag.key}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-2 ml-11">{flag.description}</p>
              </div>
              <Badge variant={flag.enabled ? 'success' : 'default'} dot>
                {flag.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
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
                  onChange={e => updateRollout(flag.id, parseInt(e.target.value))}
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
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { setShowCreate(false); setNewFlag({ key: '', name: '', description: '' }) }}>
              Create Flag
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      <Modal open={showHistory} onOpenChange={setShowHistory} title="Flag Change History" className="max-w-2xl">
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
          keyExtractor={item => String(item.id ?? item.time ?? '')}
          pageSize={5}
        />
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowHistory(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
