'use client'

import { useState } from 'react'
import { Mail, Plus, Copy, XCircle, RefreshCw, Users, BarChart3 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Toggle } from '@/components/Toggle'

const mockInvites = [
  { id: 'inv1', code: 'GROW2026', createdBy: 'admin_alex', maxUses: 100, used: 78, status: 'active', expiresAt: '2026-12-31', createdAt: '2026-01-01', tier: 'premium' },
  { id: 'inv2', code: 'SPRING25', createdBy: 'admin_alex', maxUses: 50, used: 50, status: 'exhausted', expiresAt: '2026-06-01', createdAt: '2026-03-01', tier: 'standard' },
  { id: 'inv3', code: 'BETA-TEST', createdBy: 'dev_sarah', maxUses: 25, used: 12, status: 'active', expiresAt: '2026-09-30', createdAt: '2026-04-15', tier: 'beta' },
  { id: 'inv4', code: 'PARTNER-FLOW', createdBy: 'admin_alex', maxUses: 10, used: 3, status: 'active', expiresAt: '2026-08-15', createdAt: '2026-05-01', tier: 'premium' },
  { id: 'inv5', code: 'LEAKED-CODE', createdBy: 'hacker_old', maxUses: 999, used: 542, status: 'revoked', expiresAt: '2025-12-31', createdAt: '2025-06-01', tier: 'standard' },
  { id: 'inv6', code: 'COMMUNITY-V2', createdBy: 'mod_nina', maxUses: 200, used: 145, status: 'active', expiresAt: '2026-11-30', createdAt: '2026-02-14', tier: 'standard' },
]

const usageStats = [
  { label: 'Total Codes', value: 48 },
  { label: 'Active Codes', value: 32 },
  { label: 'Total Used', value: 2890 },
  { label: 'Conversion Rate', value: '72.4%' },
  { label: 'Avg Uses/Code', value: 60.2 },
]

export default function InvitesPage() {
  const [invites, setInvites] = useState(mockInvites)
  const [showCreate, setShowCreate] = useState(false)
  const [bulkCount, setBulkCount] = useState(1)
  const [selectedInvite, setSelectedInvite] = useState<typeof mockInvites[0] | null>(null)

  const revokeInvite = (id: string) => {
    setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'revoked' } : i))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Invite Management</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'standard', label: 'Standard Tier' },
              { value: 'premium', label: 'Premium Tier' },
              { value: 'beta', label: 'Beta Tier' },
            ]}
            className="w-36"
          />
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Create Invites
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {usageStats.map(stat => (
          <div key={stat.label} className="card text-center">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Invite Codes</h3>
          <Badge variant="info">{invites.filter(i => i.status === 'active').length} active</Badge>
        </div>
        <DataTable
          columns={[
            { key: 'code', header: 'Code', sortable: true, render: r => <span className="font-mono text-admin-400 font-medium">{r.code as string}</span> },
            { key: 'createdBy', header: 'Created By', sortable: true },
            { key: 'maxUses', header: 'Max Uses', sortable: true, width: '90px' },
            {
              key: 'used',
              header: 'Used',
              sortable: true,
              width: '120px',
              render: r => {
                const used = r.used as number
                const max = r.maxUses as number
                const pct = Math.round((used / max) * 100)
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-200">{used}/{max}</span>
                    <div className="flex-1 h-1.5 max-w-20 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-admin-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              width: '100px',
              render: r => (
                <Badge variant={r.status === 'active' ? 'success' : r.status === 'exhausted' ? 'warning' : 'error'} dot>
                  {r.status as string}
                </Badge>
              ),
            },
            { key: 'tier', header: 'Tier', sortable: true, width: '90px' },
            { key: 'expiresAt', header: 'Expires', sortable: true },
            {
              key: 'actions',
              header: '',
              width: '60px',
              render: r => (
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-sky-400" title="Copy code">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {(r.status as string) === 'active' && (
                    <button
                      onClick={e => { e.stopPropagation(); revokeInvite(r.id as string) }}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400"
                      title="Revoke"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={invites as unknown as Record<string, unknown>[]}
          keyExtractor={item => String(item.id)}
          searchable
          searchPlaceholder="Search codes..."
          onRowClick={r => setSelectedInvite(r as typeof mockInvites[0])}
          pageSize={10}
        />
      </div>

      <Modal
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Invite Codes"
        description="Generate one or multiple invite codes"
      >
        <div className="space-y-4">
          <Input
            id="invite-count"
            label="Number of Codes"
            type="number"
            min={1}
            max={100}
            value={String(bulkCount)}
            onChange={e => setBulkCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          />
          <Select
            label="Tier"
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'premium', label: 'Premium' },
              { value: 'beta', label: 'Beta' },
            ]}
          />
          <Input
            id="invite-max-uses"
            label="Max Uses Per Code"
            type="number"
            defaultValue="100"
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button>Generate {bulkCount} Code{bulkCount > 1 ? 's' : ''}</Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
