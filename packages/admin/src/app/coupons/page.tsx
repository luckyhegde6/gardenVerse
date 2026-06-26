'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Tag,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Percent,
  Calendar,
  Users,
  Edit3,
  Trash2,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { formatDate, formatDateTime } from '@/lib/utils'
import api from '@/lib/api'

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface Coupon {
  id: string
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minPurchase: number | null
  maxRedemptions: number | null
  currentRedemptions: number
  minLevel: number | null
  appliesTo: string | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

interface CouponFormData {
  code: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: string
  minPurchase: string
  maxRedemptions: string
  minLevel: string
  appliesTo: string
  isActive: boolean
  expiresAt: string
}

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
  { value: 'FIXED', label: 'Fixed Amount' },
]

const INITIAL_FORM: CouponFormData = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minPurchase: '',
  maxRedemptions: '',
  minLevel: '',
  appliesTo: '',
  isActive: true,
  expiresAt: '',
}

/* ────────────────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────────────────── */

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ---- Create/Edit Modal ---- */
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState<CouponFormData>(INITIAL_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ---- Delete Modal ---- */
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  /* ============================================================== */

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get('/coupons', { params: { limit: 100 } })
      const body = res.data as Record<string, unknown>
      const rawData = (body.data as unknown[]) ?? (Array.isArray(body) ? body : [])
      setCoupons(
        (rawData as Record<string, unknown>[]).map(c => ({
          id: String(c.id ?? ''),
          code: String(c.code ?? ''),
          description: String(c.description ?? ''),
          discountType: String(c.discountType ?? 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED',
          discountValue: typeof c.discountValue === 'number' ? c.discountValue : Number(c.discountValue ?? 0),
          minPurchase: c.minPurchase != null ? Number(c.minPurchase) : null,
          maxRedemptions: c.maxRedemptions != null ? Number(c.maxRedemptions) : null,
          currentRedemptions: typeof c.currentRedemptions === 'number' ? c.currentRedemptions : Number(c.currentRedemptions ?? 0),
          minLevel: c.minLevel != null ? Number(c.minLevel) : null,
          appliesTo: c.appliesTo ? String(c.appliesTo) : null,
          isActive: Boolean(c.isActive ?? true),
          expiresAt: c.expiresAt ? String(c.expiresAt) : null,
          createdAt: String(c.createdAt ?? ''),
        }))
      )
    } catch {
      setError('Failed to load coupons.')
      setCoupons([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  /* ============================================================== */

  const openCreateModal = () => {
    setEditingCoupon(null)
    setFormData(INITIAL_FORM)
    setFormError(null)
    setFormSuccess(null)
    setShowModal(true)
  }

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minPurchase: coupon.minPurchase != null ? String(coupon.minPurchase) : '',
      maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : '',
      minLevel: coupon.minLevel != null ? String(coupon.minLevel) : '',
      appliesTo: coupon.appliesTo ?? '',
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    })
    setFormError(null)
    setFormSuccess(null)
    setShowModal(true)
  }

  const handleFieldChange = (field: keyof CouponFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = useCallback(async () => {
    setFormError(null)
    setFormSuccess(null)

    if (!formData.code.trim()) {
      setFormError('Coupon code is required.')
      return
    }
    const discountVal = parseFloat(formData.discountValue)
    if (isNaN(discountVal) || discountVal <= 0) {
      setFormError('Discount value must be a positive number.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: discountVal,
        isActive: formData.isActive,
      }
      if (formData.minPurchase) payload.minPurchase = parseFloat(formData.minPurchase)
      if (formData.maxRedemptions) payload.maxRedemptions = parseInt(formData.maxRedemptions, 10)
      if (formData.minLevel) payload.minLevel = parseInt(formData.minLevel, 10)
      if (formData.appliesTo) payload.appliesTo = formData.appliesTo.trim()
      if (formData.expiresAt) payload.expiresAt = new Date(formData.expiresAt).toISOString()

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, payload)
        setFormSuccess('Coupon updated successfully!')
      } else {
        await api.post('/coupons', payload)
        setFormSuccess('Coupon created successfully!')
      }

      fetchCoupons()
      setTimeout(() => setShowModal(false), 1500)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Error: ${(err as { response: { data?: { error?: string } } }).response?.data?.error ?? 'Server error'}`
          : 'Failed to save coupon.'
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, editingCoupon, fetchCoupons])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCoupon) return
    setIsDeleting(true)
    try {
      await api.delete(`/coupons/${deletingCoupon.id}`)
      setCoupons(prev => prev.filter(c => c.id !== deletingCoupon.id))
      setShowDeleteModal(false)
      setDeletingCoupon(null)
    } catch {
      setError('Failed to delete coupon.')
    } finally {
      setIsDeleting(false)
    }
  }, [deletingCoupon])

  const handleToggleActive = useCallback(async (coupon: Coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}`, { isActive: !coupon.isActive })
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
    } catch {
      setError('Failed to toggle coupon status.')
    }
  }, [])

  /* ============================================================== */

  const activeCount = coupons.filter(c => c.isActive).length
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.currentRedemptions, 0)
  const expiredCount = coupons.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length

  if (isLoading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading coupons...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-400/10">
            <Tag className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Coupons</h1>
            <p className="text-sm text-slate-500">Manage discount coupons and promo codes</p>
          </div>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchCoupons}>Retry</Button>
        </div>
      )}

      {/* Success Banner */}
      {formSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{formSuccess}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-slate-400">Total Coupons</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{coupons.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Active</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Total Redemptions</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{totalRedemptions}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Expired</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{expiredCount}</p>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Coupons</h3>
          <Tag className="w-4 h-4 text-rose-400" />
        </div>
        {coupons.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No coupons found. Create your first coupon.</p>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'code', header: 'Code', sortable: true, render: r => (
                <span className="font-mono font-bold text-slate-200">{r.code as string}</span>
              )},
              { key: 'discountType', header: 'Discount', sortable: true, width: '120px', render: r => {
                const type = r.discountType as string
                const val = r.discountValue as number
                return type === 'PERCENTAGE'
                  ? <Badge variant="warning"><Percent className="w-3 h-3 mr-1" />{val}%</Badge>
                  : <Badge variant="info"><DollarSign className="w-3 h-3 mr-1" />{val}</Badge>
              }},
              { key: 'minPurchase', header: 'Min Purchase', width: '110px', render: r => {
                const val = r.minPurchase as number | null
                return val != null ? <span className="text-slate-400">{val} GC</span> : <span className="text-slate-600">—</span>
              }},
              { key: 'currentRedemptions', header: 'Uses Left', width: '100px', sortable: true, render: r => {
                const current = r.currentRedemptions as number
                const max = r.maxRedemptions as number | null
                if (max != null) {
                  const left = max - current
                  return <span className={left <= 0 ? 'text-red-400 font-mono' : 'text-slate-300 font-mono'}>{left}/{max}</span>
                }
                return <span className="text-slate-500 font-mono">{current} / ∞</span>
              }},
              { key: 'expiresAt', header: 'Expires', sortable: true, width: '110px', render: r => {
                const val = r.expiresAt as string | null
                if (!val) return <span className="text-slate-600">Never</span>
                const expired = new Date(val) < new Date()
                return <span className={expired ? 'text-red-400' : 'text-slate-400'}>{formatDate(val)}</span>
              }},
              { key: 'isActive', header: 'Status', width: '90px', sortable: true, render: r => {
                const active = r.isActive as boolean
                const expired = r.expiresAt ? new Date(r.expiresAt as string) < new Date() : false
                if (expired) return <Badge variant="error" dot>Expired</Badge>
                return <Badge variant={active ? 'success' : 'default'} dot>{active ? 'Active' : 'Disabled'}</Badge>
              }},
              { key: 'actions', header: 'Actions', width: '100px', render: r => {
                const coupon = r as unknown as Coupon
                return (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(coupon) }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(coupon) }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                      title={coupon.isActive ? 'Disable' : 'Enable'}
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingCoupon(coupon); setShowDeleteModal(true) }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              }},
            ]}
            data={coupons as unknown as Record<string, unknown>[]}
            keyExtractor={(c: Record<string, unknown>) => c.id as string}
            searchable
            searchPlaceholder="Search by code, description..."
            pageSize={10}
            loading={isLoading}
          />
        )}
      </div>

      {/* ════════════════════════════════════════
          CREATE/EDIT MODAL
          ════════════════════════════════════════ */}
      <Modal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
      >
        <div className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{formError}</p>
            </div>
          )}

          <Input
            id="coupon-code"
            label="Code *"
            placeholder="e.g., SUMMER2026"
            value={formData.code}
            onChange={e => handleFieldChange('code', e.target.value.toUpperCase())}
          />
          <Input
            id="coupon-desc"
            label="Description"
            placeholder="What is this coupon for?"
            value={formData.description}
            onChange={e => handleFieldChange('description', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="discount-type"
              label="Discount Type *"
              options={DISCOUNT_TYPE_OPTIONS}
              value={formData.discountType}
              onChange={e => handleFieldChange('discountType', e.target.value)}
            />
            <Input
              id="discount-value"
              label="Discount Value *"
              type="number"
              step="0.01"
              min="0"
              placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 50'}
              value={formData.discountValue}
              onChange={e => handleFieldChange('discountValue', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="min-purchase"
              label="Min Purchase (GC)"
              type="number"
              min="0"
              placeholder="Optional"
              value={formData.minPurchase}
              onChange={e => handleFieldChange('minPurchase', e.target.value)}
            />
            <Input
              id="max-redemptions"
              label="Max Redemptions"
              type="number"
              min="1"
              placeholder="Optional"
              value={formData.maxRedemptions}
              onChange={e => handleFieldChange('maxRedemptions', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="min-level"
              label="Min Level Required"
              type="number"
              min="1"
              placeholder="Optional"
              value={formData.minLevel}
              onChange={e => handleFieldChange('minLevel', e.target.value)}
            />
            <Input
              id="applies-to"
              label="Applies To"
              placeholder="Item ID or category"
              value={formData.appliesTo}
              onChange={e => handleFieldChange('appliesTo', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="expires-at"
              label="Expires At"
              type="date"
              value={formData.expiresAt}
              onChange={e => handleFieldChange('expiresAt', e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Status</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => handleFieldChange('isActive', e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-admin-500 focus:ring-admin-500/50"
                  />
                  <span className="text-sm text-slate-300">Active</span>
                </label>
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* ════════════════════════════════════════
          DELETE CONFIRM MODAL
          ════════════════════════════════════════ */}
      <Modal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Coupon"
        description="This action cannot be undone."
      >
        <p className="text-sm text-slate-400">
          Are you sure you want to delete the coupon <strong className="text-slate-200">{deletingCoupon?.code}</strong>?
          All associated data will be permanently removed.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" loading={isDeleting} onClick={handleDeleteConfirm} disabled={isDeleting}>
            <Trash2 className="w-4 h-4" /> Delete Coupon
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
