'use client'

import { useState, useEffect, useCallback } from 'react'
import { Megaphone, Plus, Gift, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { DataTable } from '@/components/DataTable'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  startDate: string
  endDate: string
  participants: number
  rewards: string
  schedule: string
}

interface RewardConfig {
  id: string
  name: string
  type: string
  value: string
  rarity: string
  cost: number
}

// ── Page Component ────────────────────────────────────────

export default function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [rewardsConfig, setRewardsConfig] = useState<RewardConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await api.get('/campaigns')
      const body = res.data as Record<string, unknown>
      const rawData = (body.data as unknown[]) ||
        (body.campaigns as unknown[]) ||
        (Array.isArray(body) ? body : [])

      if (Array.isArray(rawData) && rawData.length > 0) {
        setCampaigns(rawData.map(c => {
          const entry = c as Record<string, unknown>
          return {
            id: String(entry.id ?? ''),
            name: String(entry.name ?? ''),
            type: String(entry.type ?? ''),
            status: String(entry.status ?? 'draft'),
            startDate: String(entry.startDate ?? entry.start_date ?? ''),
            endDate: String(entry.endDate ?? entry.end_date ?? ''),
            participants: typeof entry.participants === 'number' ? entry.participants : Number(entry.participants ?? 0),
            rewards: String(entry.rewards ?? ''),
            schedule: String(entry.schedule ?? ''),
          }
        }))
      }

      // Try fetching rewards config too (separate endpoint)
      try {
        const rewardsRes = await api.get('/campaigns/rewards')
        const rewardsBody = rewardsRes.data as Record<string, unknown>
        const rawRewards = (rewardsBody.data as unknown[]) ||
          (rewardsBody.rewards as unknown[]) ||
          (Array.isArray(rewardsBody) ? rewardsBody : [])
        if (Array.isArray(rawRewards) && rawRewards.length > 0) {
          setRewardsConfig(rawRewards.map(r => {
            const entry = r as Record<string, unknown>
            return {
              id: String(entry.id ?? ''),
              name: String(entry.name ?? ''),
              type: String(entry.type ?? 'item'),
              value: String(entry.value ?? ''),
              rarity: String(entry.rarity ?? 'common'),
              cost: typeof entry.cost === 'number' ? entry.cost : Number(entry.cost ?? 0),
            }
          }))
        }
      } catch {
        // Rewards endpoint is optional, leave rewardsConfig as []
      }
    } catch {
      setError('Campaigns module not available. Backend API not implemented.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const activeCampaignCount = campaigns.filter(c => c.status === 'active').length
  const totalParticipants = campaigns.reduce((sum, c) => sum + c.participants, 0)
  const scheduledCount = campaigns.filter(c => c.status === 'scheduled').length
  const draftCount = campaigns.filter(c => c.status === 'draft').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading campaigns...</p>
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
          <Button variant="ghost" size="sm" onClick={fetchCampaigns}>Retry</Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Campaigns</h2>
        </div>
        {campaigns.length > 0 && (
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setShowRewards(true)}>
              <Gift className="w-4 h-4" /> Rewards
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Campaign
            </Button>
          </div>
        )}
      </div>

      {campaigns.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm text-slate-400">Active Campaigns</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{activeCampaignCount}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-400">Total Participants</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{totalParticipants.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-400">Scheduled</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{scheduledCount}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-400">Drafts</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{draftCount}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">All Campaigns</h3>
            </div>
            <DataTable
              columns={[
                { key: 'name', header: 'Campaign', sortable: true, render: r => <span className="font-medium text-slate-200">{r.name as string}</span> },
                { key: 'type', header: 'Type', sortable: true, width: '100px', render: r => <Badge variant="info">{r.type as string}</Badge> },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  width: '110px',
                  render: r => (
                    <Badge
                      variant={r.status === 'active' ? 'success' : r.status === 'scheduled' ? 'info' : r.status === 'draft' ? 'default' : 'warning'}
                      dot
                    >
                      {r.status as string}
                    </Badge>
                  ),
                },
                { key: 'startDate', header: 'Start', sortable: true, render: r => formatDate(r.startDate as string) },
                { key: 'endDate', header: 'End', sortable: true, render: r => formatDate(r.endDate as string) },
                { key: 'participants', header: 'Participants', sortable: true },
                { key: 'rewards', header: 'Rewards', sortable: true },
                { key: 'schedule', header: 'Schedule', sortable: true, width: '100px', render: r => <Badge variant="default">{r.schedule as string}</Badge> },
              ]}
              data={campaigns as unknown as Record<string, unknown>[]}
              keyExtractor={c => String(c.id)}
              searchable
              searchPlaceholder="Search campaigns..."
              onRowClick={r => setSelectedCampaign(r as unknown as Campaign)}
              pageSize={10}
            />
          </div>

          <Modal open={showCreate} onOpenChange={setShowCreate} title="Create Campaign">
            <div className="space-y-4">
              <Input id="campaign-name" label="Campaign Name" placeholder="e.g., Winter Wonderland" />
              <Select
                label="Type"
                options={[
                  { value: 'seasonal', label: 'Seasonal Event' },
                  { value: 'quest', label: 'Quest Line' },
                  { value: 'competition', label: 'Competition' },
                  { value: 'event', label: 'One-time Event' },
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input id="campaign-start" label="Start Date" type="date" />
                <Input id="campaign-end" label="End Date" type="date" />
              </div>
              <Select
                label="Schedule"
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'weekends', label: 'Weekends Only' },
                  { value: 'one-time', label: 'One Time' },
                  { value: 'onboarding', label: 'Onboarding' },
                ]}
              />
              <ModalFooter>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={() => setShowCreate(false)}>Create Campaign</Button>
              </ModalFooter>
            </div>
          </Modal>

          <Modal open={showRewards} onOpenChange={setShowRewards} title="Reward Configuration" className="max-w-2xl">
            {rewardsConfig.length > 0 ? (
              <div className="space-y-3">
                {rewardsConfig.map(reward => (
                  <div key={reward.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-admin-500/10">
                        <Gift className="w-4 h-4 text-admin-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{reward.name}</p>
                        <p className="text-xs text-slate-500">{reward.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={reward.rarity === 'legendary' ? 'warning' : reward.rarity === 'epic' ? 'info' : reward.rarity === 'rare' ? 'success' : 'default'}>
                        {reward.rarity}
                      </Badge>
                      <span className="text-sm text-slate-300">{reward.cost} ¤</span>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 p-4">No rewards configured yet.</p>
            )}
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowRewards(false)}>Close</Button>
              <Button><Plus className="w-4 h-4" /> Add Reward</Button>
            </ModalFooter>
          </Modal>
        </>
      ) : (
        !error && (
          <div className="card p-8 text-center">
            <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No Campaigns Available</h3>
            <p className="text-sm text-slate-500">Campaigns module is not available yet. When the backend API is implemented, campaigns will appear here.</p>
          </div>
        )
      )}
    </div>
  )
}
