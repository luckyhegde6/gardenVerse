'use client'

import { useState } from 'react'
import { Megaphone, Plus, CalendarDays, Trophy, Gift, Settings } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Toggle } from '@/components/Toggle'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { DataTable } from '@/components/DataTable'
import { formatDate } from '@/lib/utils'

const campaigns = [
  { id: 'c1', name: 'Spring Harvest Festival', type: 'seasonal', status: 'active', startDate: '2026-04-01', endDate: '2026-06-15', participants: 12450, rewards: 'Golden Seeds, XP Boost', schedule: 'daily' },
  { id: 'c2', name: 'Summer Solstice Event', type: 'seasonal', status: 'scheduled', startDate: '2026-06-21', endDate: '2026-07-05', participants: 0, rewards: 'Solar Tools, Rare Plants', schedule: 'daily' },
  { id: 'c3', name: 'New Player Welcome Quests', type: 'quest', status: 'active', startDate: '2026-01-01', endDate: '2026-12-31', participants: 3450, rewards: 'Starter Pack, Credits', schedule: 'onboarding' },
  { id: 'c4', name: 'Weekend Warrior', type: 'quest', status: 'active', startDate: '2026-01-01', endDate: '2026-12-31', participants: 8900, rewards: 'Double XP, Rare Drops', schedule: 'weekends' },
  { id: 'c5', name: 'IoT Device Challenge', type: 'event', status: 'draft', startDate: '2026-08-01', endDate: '2026-08-31', participants: 0, rewards: 'Hardware Discount, Badge', schedule: 'weekly' },
  { id: 'c6', name: 'Community Garden Contest', type: 'competition', status: 'ended', startDate: '2026-03-01', endDate: '2026-04-30', participants: 2450, rewards: '¤50,000, Trophy', schedule: 'one-time' },
  { id: 'c7', name: 'Autumn Harvest Festival', type: 'seasonal', status: 'scheduled', startDate: '2026-09-22', endDate: '2026-10-31', participants: 0, rewards: 'Harvest Tools, Rare Seeds', schedule: 'daily' },
]

const rewardsConfig = [
  { id: 'r1', name: 'Golden Seeds Pack', type: 'item', value: '5x Golden Seeds', rarity: 'rare', cost: 500 },
  { id: 'r2', name: 'XP Boost (24h)', type: 'boost', value: '2x XP for 24 hours', rarity: 'uncommon', cost: 200 },
  { id: 'r3', name: 'Solar Watering Can', type: 'item', value: 'Legendary Tool', rarity: 'legendary', cost: 5000 },
  { id: 'r4', name: 'Community Trophy', type: 'badge', value: 'Profile Badge', rarity: 'epic', cost: 1000 },
]

export default function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<typeof campaigns[0] | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Campaigns</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowRewards(true)}>
            <Gift className="w-4 h-4" /> Rewards
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-slate-400">Active Campaigns</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{campaigns.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Total Participants</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{campaigns.reduce((sum, c) => sum + c.participants, 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Scheduled</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{campaigns.filter(c => c.status === 'scheduled').length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Drafts</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{campaigns.filter(c => c.status === 'draft').length}</p>
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
          onRowClick={r => setSelectedCampaign(r as typeof campaigns[0])}
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
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowRewards(false)}>Close</Button>
          <Button><Plus className="w-4 h-4" /> Add Reward</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
