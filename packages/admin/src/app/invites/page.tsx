'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, Plus, Copy, XCircle, RefreshCw, Users, BarChart3, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Toggle } from '@/components/Toggle'
import api from '@/lib/api'

interface InviteEntry {
  id: string; code: string; createdBy: string; maxUses: number; used: number; status: string; expiresAt: string; createdAt: string; tier: string
}

const usageStats = [
  { label: 'Total Codes', value: 48 },
  { label: 'Active Codes', value: 32 },
  { label: 'Total Used', value: 2890 },
  { label: 'Conversion Rate', value: '72.4%' },
  { label: 'Avg Uses/Code', value: 60.2 },
]

export default function InvitesPage() {
  const [invites, setInvites] = useState<InviteEntry[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [bulkCount, setBulkCount] = useState(1)
  const [selectedInvite, setSelectedInvite] = useState<InviteEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvites = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await api.get('/invites')
      const body = res.data as Record<string, unknown>
      const rawData = (body.data as unknown[]) || (body.invites as unknown[]) || (Array.isArray(body) ? body : [])

      if (rawData.length > 0) {
        setInvites(rawData.map(inv => {
          const entry = inv as Record<string, unknown>
          return {
            id: String(entry.id ?? ''),
            code: String(entry.code ?? ''),
            createdBy: (entry.createdBy && typeof entry.createdBy === 'object') 
              ? String((entry.createdBy as Record<string, unknown>).username ?? 'unknown')
              : String(entry.createdBy ?? entry.created_by ?? 'unknown'),
            maxUses: typeof entry.maxUses === 'number' ? entry.maxUses : typeof entry.max_uses === 'number' ? entry.max_uses : Number(entry.maxUses ?? entry.max_uses ?? 0),
            used: typeof entry.used === 'number' ? entry.used : Number(entry.used ?? 0),
            status: String(entry.status ?? 'active'),
            expiresAt: String(entry.expiresAt ?? entry.expires_at ?? ''),
            createdAt: String(entry.createdAt ?? entry.created_at ?? new Date().toISOString()),
            tier: String(entry.tier ?? 'standard'),
          }
        }))
      }
    } catch {
      setError('Could not load invites from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchInvites() }, [fetchInvites])

  const revokeInvite = (id: string) => {
    setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'revoked' } : i))
  }

  if (isLoading && invites.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading invites...</p>
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
          <Button variant="ghost" size="sm" onClick={fetchInvites}>Retry</Button>
        </div>
      )}

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
          onRowClick={r => setSelectedInvite(r as unknown as InviteEntry)}
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
