'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Megaphone,
  Plus,
  Gift,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Percent,
  Users,
  Tag,
  Edit3,
  Trash2,
  Calendar,
  Target,
} from 'lucide-react'
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
  discountPercent: number | null
  minLevel: number | null
  maxRedemptions: number | null
  currentRedemptions: number
  targetUserRole: string | null
  targetGardenType: string | null
  couponCode: string | null
}

interface RewardConfig {
  id: string
  name: string
  type: string
  value: string
  rarity: string
  cost: number
}

interface CampaignFormData {
  name: string
  type: string
  status: string
  startDate: string
  endDate: string
  schedule: string
  rewards: string
  discountPercent: string
  minLevel: string
  maxRedemptions: string
  targetUserRole: string
  targetGardenType: string
  couponCode: string
}

// ── Constants ──────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'seasonal', label: 'Seasonal Event' },
  { value: 'quest', label: 'Quest Line' },
  { value: 'competition', label: 'Competition' },
  { value: 'event', label: 'One-time Event' },
  { value: 'promotion', label: 'Promotion' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'weekends', label: 'Weekends Only' },
  { value: 'one-time', label: 'One Time' },
  { value: 'onboarding', label: 'Onboarding' },
]

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'PREMIUM', label: 'Premium' },
]

const GARDEN_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'REAL', label: 'Real' },
  { value: 'HYBRID', label: 'Hybrid' },
]

const INITIAL_FORM: CampaignFormData = {
  name: '',
  type: 'event',
  status: 'draft',
  startDate: '',
  endDate: '',
  schedule: 'one-time',
  rewards: '',
  discountPercent: '',
  minLevel: '',
  maxRedemptions: '',
  targetUserRole: '',
  targetGardenType: '',
  couponCode: '',
}

// ── Page Component ────────────────────────────────────────

export default function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [rewardsConfig, setRewardsConfig] = useState<RewardConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ---- Form State ---- */
  const [formData, setFormData] = useState<CampaignFormData>(INITIAL_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  /* ============================================================== */

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get('/campaigns')
      const body = res.data as Record<string, unknown>
      const rawData = (body.data as unknown[]) ??
        (body.campaigns as unknown[]) ??
        (Array.isArray(body) ? body : [])

      if (Array.isArray(rawData)) {
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
            discountPercent: entry.discountPercent != null ? Number(entry.discountPercent) : null,
            minLevel: entry.minLevel != null ? Number(entry.minLevel) : null,
            maxRedemptions: entry.maxRedemptions != null ? Number(entry.maxRedemptions) : null,
            currentRedemptions: typeof entry.currentRedemptions === 'number' ? entry.currentRedemptions : Number(entry.currentRedemptions ?? 0),
            targetUserRole: entry.targetUserRole ? String(entry.targetUserRole) : null,
            targetGardenType: entry.targetGardenType ? String(entry.targetGardenType) : null,
            couponCode: entry.couponCode ? String(entry.couponCode) : null,
          }
        }))
      }

      try {
        const rewardsRes = await api.get('/campaigns/rewards')
        const rewardsBody = rewardsRes.data as Record<string, unknown>
        const rawRewards = (rewardsBody.data as unknown[]) ??
          (rewardsBody.rewards as unknown[]) ??
          (Array.isArray(rewardsBody) ? rewardsBody : [])
        if (Array.isArray(rawRewards)) {
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
        // rewards endpoint optional
      }
    } catch {
      setError('Failed to load campaigns data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  /* ============================================================== */

  const computedStats = {
    activeCount: campaigns.filter(c => c.status === 'active').length,
    totalParticipants: campaigns.reduce((sum, c) => sum + c.participants, 0),
    scheduledCount: campaigns.filter(c => c.status === 'scheduled').length,
    draftCount: campaigns.filter(c => c.status === 'draft').length,
  }

  /* ============================================================== */

  const openCreateModal = () => {
    setEditingCampaign(null)
    setFormData(INITIAL_FORM)
    setFormError(null)
    setFormSuccess(null)
    setShowCreate(true)
  }

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
      endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
      schedule: campaign.schedule,
      rewards: campaign.rewards,
      discountPercent: campaign.discountPercent != null ? String(campaign.discountPercent) : '',
      minLevel: campaign.minLevel != null ? String(campaign.minLevel) : '',
      maxRedemptions: campaign.maxRedemptions != null ? String(campaign.maxRedemptions) : '',
      targetUserRole: campaign.targetUserRole ?? '',
      targetGardenType: campaign.targetGardenType ?? '',
      couponCode: campaign.couponCode ?? '',
    })
    setFormError(null)
    setFormSuccess(null)
    setShowEdit(true)
  }

  const handleFieldChange = (field: keyof CampaignFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const buildPayload = useCallback(() => {
    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      type: formData.type,
      status: formData.status,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      schedule: formData.schedule,
    }
    if (formData.rewards.trim()) payload.rewards = formData.rewards.trim()
    if (formData.discountPercent) payload.discountPercent = parseFloat(formData.discountPercent)
    if (formData.minLevel) payload.minLevel = parseInt(formData.minLevel, 10)
    if (formData.maxRedemptions) payload.maxRedemptions = parseInt(formData.maxRedemptions, 10)
    if (formData.targetUserRole) payload.targetUserRole = formData.targetUserRole
    if (formData.targetGardenType) payload.targetGardenType = formData.targetGardenType
    if (formData.couponCode.trim()) payload.couponCode = formData.couponCode.trim().toUpperCase()
    return payload
  }, [formData])

  const handleCreate = useCallback(async () => {
    setFormError(null)
    setFormSuccess(null)

    if (!formData.name.trim()) {
      setFormError('Campaign name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/campaigns', buildPayload())
      setFormSuccess('Campaign created successfully!')
      fetchCampaigns()
      setTimeout(() => setShowCreate(false), 1500)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Error: ${(err as { response: { data?: { error?: string } } }).response?.data?.error ?? 'Server error'}`
          : 'Failed to create campaign.'
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, buildPayload, fetchCampaigns])

  const handleUpdate = useCallback(async () => {
    if (!editingCampaign) return
    setFormError(null)
    setFormSuccess(null)

    if (!formData.name.trim()) {
      setFormError('Campaign name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.patch(`/campaigns/${editingCampaign.id}`, buildPayload())
      setFormSuccess('Campaign updated successfully!')
      fetchCampaigns()
      setTimeout(() => setShowEdit(false), 1500)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Error: ${(err as { response: { data?: { error?: string } } }).response?.data?.error ?? 'Server error'}`
          : 'Failed to update campaign.'
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [editingCampaign, formData, buildPayload, fetchCampaigns])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCampaign) return
    setIsDeleting(true)
    try {
      await api.delete(`/campaigns/${deletingCampaign.id}`)
      setCampaigns(prev => prev.filter(c => c.id !== deletingCampaign.id))
      setShowDelete(false)
      setDeletingCampaign(null)
    } catch {
      setError('Failed to delete campaign.')
    } finally {
      setIsDeleting(false)
    }
  }, [deletingCampaign])

  /* ── Loading State ── */
  if (isLoading && campaigns.length === 0) {
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
      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchCampaigns}>Retry</Button>
        </div>
      )}

      {/* ── Success Banner ── */}
      {formSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{formSuccess}</p>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-400/10">
            <Megaphone className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Campaigns</h1>
            <p className="text-sm text-slate-500">Manage marketing campaigns, discounts, and promotions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowRewards(true)}>
            <Gift className="w-4 h-4" /> Rewards
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </div>
      </div>

      {/* ── Campaigns Data ── */}
      {campaigns.length > 0 ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm text-slate-400">Active Campaigns</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{computedStats.activeCount}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-400">Total Participants</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{computedStats.totalParticipants.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-400">Scheduled</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{computedStats.scheduledCount}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-400">Drafts</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{computedStats.draftCount}</p>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">All Campaigns</h3>
              <Megaphone className="w-4 h-4 text-purple-400" />
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
                      variant={r.status === 'active' ? 'success' : r.status === 'scheduled' ? 'info' : r.status === 'draft' ? 'default' : r.status === 'completed' ? 'active' : 'warning'}
                      dot
                    >
                      {r.status as string}
                    </Badge>
                  ),
                },
                {
                  key: 'discountPercent',
                  header: 'Discount %',
                  width: '100px',
                  sortable: true,
                  render: r => {
                    const val = r.discountPercent as number | null
                    return val != null
                      ? <Badge variant="warning"><Percent className="w-3 h-3 mr-0.5" />{val}%</Badge>
                      : <span className="text-slate-600">—</span>
                  },
                },
                {
                  key: 'minLevel',
                  header: 'Min Level',
                  width: '90px',
                  render: r => {
                    const val = r.minLevel as number | null
                    return val != null ? <span className="font-mono text-slate-300">{val}</span> : <span className="text-slate-600">—</span>
                  },
                },
                {
                  key: 'maxRedemptions',
                  header: 'Max Redemptions',
                  width: '120px',
                  render: r => {
                    const max = r.maxRedemptions as number | null
                    const current = r.currentRedemptions as number
                    if (max != null) {
                      const left = max - current
                      return <span className={left <= 0 ? 'text-red-400 font-mono' : 'text-slate-300 font-mono'}>{left}/{max}</span>
                    }
                    return <span className="text-slate-500 font-mono">{current} / ∞</span>
                  },
                },
                {
                  key: 'targetUserRole',
                  header: 'Target Role',
                  width: '100px',
                  render: r => {
                    const val = r.targetUserRole as string | null
                    return val ? <Badge variant="info">{val}</Badge> : <span className="text-slate-600">All</span>
                  },
                },
                {
                  key: 'couponCode',
                  header: 'Coupon Code',
                  width: '110px',
                  render: r => {
                    const val = r.couponCode as string | null
                    return val ? <span className="font-mono text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">{val}</span> : <span className="text-slate-600">—</span>
                  },
                },
                { key: 'startDate', header: 'Start', sortable: true, width: '100px', render: r => (
                  <span className="text-xs text-slate-400">{r.startDate ? formatDate(r.startDate as string) : '—'}</span>
                )},
                { key: 'endDate', header: 'End', sortable: true, width: '100px', render: r => (
                  <span className="text-xs text-slate-400">{r.endDate ? formatDate(r.endDate as string) : '—'}</span>
                )},
                { key: 'participants', header: 'Participants', sortable: true, width: '100px' },
                { key: 'rewards', header: 'Rewards', width: '100px', render: r => (
                  <span className="text-xs text-slate-500">{r.rewards as string || '—'}</span>
                )},
                {
                  key: 'actions',
                  header: 'Actions',
                  width: '80px',
                  render: r => {
                    const campaign = r as unknown as Campaign
                    return (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(campaign) }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingCampaign(campaign); setShowDelete(true) }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  },
                },
              ]}
              data={campaigns as unknown as Record<string, unknown>[]}
              keyExtractor={c => String((c as unknown as Campaign).id)}
              searchable
              searchPlaceholder="Search campaigns..."
              onRowClick={r => openEditModal(r as unknown as Campaign)}
              pageSize={10}
            />
          </div>
        </>
      ) : (
        !error && (
          <div className="card p-10 text-center">
            <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No Campaigns Yet</h3>
            <p className="text-sm text-slate-500 mb-4">Create your first marketing campaign to get started.</p>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4" /> Create Campaign
            </Button>
          </div>
        )
      )}

      {/* ════════════════════════════════════════
          CREATE CAMPAIGN MODAL
          ════════════════════════════════════════ */}
      <Modal open={showCreate} onOpenChange={setShowCreate} title="Create Campaign">
        <div className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{formError}</p>
            </div>
          )}

          <Input
            id="create-name"
            label="Campaign Name *"
            placeholder="e.g., Winter Wonderland"
            value={formData.name}
            onChange={e => handleFieldChange('name', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="create-type"
              label="Type"
              options={TYPE_OPTIONS}
              value={formData.type}
              onChange={e => handleFieldChange('type', e.target.value)}
            />
            <Select
              id="create-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={e => handleFieldChange('status', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="create-start"
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={e => handleFieldChange('startDate', e.target.value)}
            />
            <Input
              id="create-end"
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={e => handleFieldChange('endDate', e.target.value)}
            />
          </div>

          <Select
            id="create-schedule"
            label="Schedule"
            options={SCHEDULE_OPTIONS}
            value={formData.schedule}
            onChange={e => handleFieldChange('schedule', e.target.value)}
          />

          <Input
            id="create-rewards"
            label="Rewards"
            placeholder="e.g., 500 XP, Rare Seed Pack"
            value={formData.rewards}
            onChange={e => handleFieldChange('rewards', e.target.value)}
          />

          {/* Discount fields */}
          <div className="rounded-lg border border-slate-700/60 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              Discount &amp; Targeting
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <Input
                id="create-discount"
                label="Discount %"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 20"
                value={formData.discountPercent}
                onChange={e => handleFieldChange('discountPercent', e.target.value)}
              />
              <Input
                id="create-min-level"
                label="Min Level"
                type="number"
                min="1"
                placeholder="e.g., 5"
                value={formData.minLevel}
                onChange={e => handleFieldChange('minLevel', e.target.value)}
              />
              <Input
                id="create-max-redemptions"
                label="Max Redemptions"
                type="number"
                min="1"
                placeholder="e.g., 100"
                value={formData.maxRedemptions}
                onChange={e => handleFieldChange('maxRedemptions', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Select
                id="create-target-role"
                label="Target User Role"
                options={ROLE_OPTIONS}
                value={formData.targetUserRole}
                onChange={e => handleFieldChange('targetUserRole', e.target.value)}
              />
              <Select
                id="create-target-garden"
                label="Target Garden Type"
                options={GARDEN_TYPE_OPTIONS}
                value={formData.targetGardenType}
                onChange={e => handleFieldChange('targetGardenType', e.target.value)}
              />
              <Input
                id="create-coupon-code"
                label="Coupon Code"
                placeholder="e.g., WINTER20"
                value={formData.couponCode}
                onChange={e => handleFieldChange('couponCode', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={isSubmitting} disabled={isSubmitting}>
              <Plus className="w-4 h-4" /> Create Campaign
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* ════════════════════════════════════════
          EDIT CAMPAIGN MODAL
          ════════════════════════════════════════ */}
      <Modal
        open={showEdit}
        onOpenChange={setShowEdit}
        title={editingCampaign ? `Edit: ${editingCampaign.name}` : 'Edit Campaign'}
      >
        <div className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{formError}</p>
            </div>
          )}

          <Input
            id="edit-name"
            label="Campaign Name *"
            placeholder="e.g., Winter Wonderland"
            value={formData.name}
            onChange={e => handleFieldChange('name', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="edit-type"
              label="Type"
              options={TYPE_OPTIONS}
              value={formData.type}
              onChange={e => handleFieldChange('type', e.target.value)}
            />
            <Select
              id="edit-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={e => handleFieldChange('status', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="edit-start"
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={e => handleFieldChange('startDate', e.target.value)}
            />
            <Input
              id="edit-end"
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={e => handleFieldChange('endDate', e.target.value)}
            />
          </div>

          <Select
            id="edit-schedule"
            label="Schedule"
            options={SCHEDULE_OPTIONS}
            value={formData.schedule}
            onChange={e => handleFieldChange('schedule', e.target.value)}
          />

          <Input
            id="edit-rewards"
            label="Rewards"
            placeholder="e.g., 500 XP, Rare Seed Pack"
            value={formData.rewards}
            onChange={e => handleFieldChange('rewards', e.target.value)}
          />

          {/* Discount fields */}
          <div className="rounded-lg border border-slate-700/60 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              Discount &amp; Targeting
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <Input
                id="edit-discount"
                label="Discount %"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 20"
                value={formData.discountPercent}
                onChange={e => handleFieldChange('discountPercent', e.target.value)}
              />
              <Input
                id="edit-min-level"
                label="Min Level"
                type="number"
                min="1"
                placeholder="e.g., 5"
                value={formData.minLevel}
                onChange={e => handleFieldChange('minLevel', e.target.value)}
              />
              <Input
                id="edit-max-redemptions"
                label="Max Redemptions"
                type="number"
                min="1"
                placeholder="e.g., 100"
                value={formData.maxRedemptions}
                onChange={e => handleFieldChange('maxRedemptions', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Select
                id="edit-target-role"
                label="Target User Role"
                options={ROLE_OPTIONS}
                value={formData.targetUserRole}
                onChange={e => handleFieldChange('targetUserRole', e.target.value)}
              />
              <Select
                id="edit-target-garden"
                label="Target Garden Type"
                options={GARDEN_TYPE_OPTIONS}
                value={formData.targetGardenType}
                onChange={e => handleFieldChange('targetGardenType', e.target.value)}
              />
              <Input
                id="edit-coupon-code"
                label="Coupon Code"
                placeholder="e.g., WINTER20"
                value={formData.couponCode}
                onChange={e => handleFieldChange('couponCode', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={isSubmitting} disabled={isSubmitting}>
              <CheckCircle2 className="w-4 h-4" /> Update Campaign
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* ════════════════════════════════════════
          DELETE CONFIRM MODAL
          ════════════════════════════════════════ */}
      <Modal
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Campaign"
        description="This action cannot be undone."
      >
        <p className="text-sm text-slate-400">
          Are you sure you want to delete{' '}
          <strong className="text-slate-200">{deletingCampaign?.name}</strong>?
          All associated data, including participants and rewards, will be permanently removed.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" loading={isDeleting} onClick={handleDeleteConfirm} disabled={isDeleting}>
            <Trash2 className="w-4 h-4" /> Delete Campaign
          </Button>
        </ModalFooter>
      </Modal>

      {/* ════════════════════════════════════════
          REWARDS CONFIG MODAL
          ════════════════════════════════════════ */}
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
    </div>
  )
}
