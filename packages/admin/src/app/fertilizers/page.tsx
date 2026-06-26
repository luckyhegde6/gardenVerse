'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical,
  Package,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  MapPin,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { cn, formatDate, formatDateTime, formatRelativeTime } from '@/lib/utils'
import api from '@/lib/api'

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface Fertilizer {
  id: string
  name: string
  description: string
  price: number
  currency: string
  rarity: string
  effects: string[]
  duration: number
  durationUnit: string
  category: string
  isOnSale: boolean
  discountPrice: number | null
}

interface ActiveFertilizer {
  id: string
  fertilizerId: string
  fertilizerName: string
  gardenId: string
  gardenName: string
  gardenLocation: string
  appliedAt: string
  remainingDuration: number
  remainingUnit: string
  effects: string[]
}

interface GardenOption {
  id: string
  name: string
  location: string
}

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const RARITY_COLORS: Record<string, string> = {
  COMMON: 'text-slate-400 bg-slate-400/10',
  UNCOMMON: 'text-emerald-400 bg-emerald-400/10',
  RARE: 'text-sky-400 bg-sky-400/10',
  EPIC: 'text-purple-400 bg-purple-400/10',
  LEGENDARY: 'text-amber-400 bg-amber-400/10',
}

const RARITY_VARIANTS: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  COMMON: 'default',
  UNCOMMON: 'success',
  RARE: 'info',
  EPIC: 'info',
  LEGENDARY: 'warning',
}

/* ────────────────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────────────────── */

export default function FertilizersPage() {
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([])
  const [activeFertilizers, setActiveFertilizers] = useState<ActiveFertilizer[]>([])
  const [gardens, setGardens] = useState<GardenOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ---- Search ---- */
  const [searchQuery, setSearchQuery] = useState('')

  /* ---- Apply Modal ---- */
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedFertilizer, setSelectedFertilizer] = useState<Fertilizer | null>(null)
  const [selectedGardenId, setSelectedGardenId] = useState('')
  const [applySubmitting, setApplySubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)

  /* ============================================================== */

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [fertRes, gardensRes] = await Promise.all([
        api.get('/fertilizers', { params: { limit: 100 } }),
        api.get('/plots', { params: { limit: 100 } }).catch(() => null),
      ])

      const fertBody = fertRes.data as Record<string, unknown>
      const rawFerts = (fertBody.data as unknown[]) ?? (Array.isArray(fertBody) ? fertBody : [])

      const mappedFerts: Fertilizer[] = (rawFerts as Record<string, unknown>[]).map(f => ({
        id: String(f.id ?? ''),
        name: String(f.name ?? ''),
        description: String(f.description ?? ''),
        price: typeof f.price === 'number' ? f.price : Number(f.price ?? 0),
        currency: String(f.currency ?? 'GREEN_CREDITS'),
        rarity: String(f.rarity ?? 'COMMON').toUpperCase(),
        effects: Array.isArray(f.effects) ? (f.effects as string[]) : (typeof f.effects === 'string' ? (f.effects as string).split(',').map(e => e.trim()).filter(Boolean) : []),
        duration: typeof f.duration === 'number' ? f.duration : Number(f.duration ?? 0),
        durationUnit: String(f.durationUnit ?? 'hours'),
        category: String(f.category ?? 'FERTILIZER'),
        isOnSale: Boolean(f.isOnSale ?? false),
        discountPrice: f.discountPrice != null ? Number(f.discountPrice) : null,
      }))
      setFertilizers(mappedFerts)

      /* Extract active fertilizers from the fertilizers response if present */
      const rawActive = fertBody.activeFertilizers as unknown[] | null
      if (Array.isArray(rawActive) && rawActive.length > 0) {
        setActiveFertilizers((rawActive as Record<string, unknown>[]).map(a => ({
          id: String(a.id ?? ''),
          fertilizerId: String(a.fertilizerId ?? ''),
          fertilizerName: String(a.fertilizerName ?? ''),
          gardenId: String(a.gardenId ?? ''),
          gardenName: String(a.gardenName ?? ''),
          gardenLocation: String(a.gardenLocation ?? ''),
          appliedAt: String(a.appliedAt ?? ''),
          remainingDuration: typeof a.remainingDuration === 'number' ? a.remainingDuration : Number(a.remainingDuration ?? 0),
          remainingUnit: String(a.remainingUnit ?? 'hours'),
          effects: Array.isArray(a.effects) ? (a.effects as string[]) : [],
        })))
      }

      /* Build garden list for the apply modal */
      if (gardensRes) {
        const gBody = gardensRes.data as Record<string, unknown>
        const rawGardens = (gBody.data as unknown[]) ?? (Array.isArray(gBody) ? gBody : [])
        setGardens((rawGardens as Record<string, unknown>[]).map(g => ({
          id: String(g.id ?? ''),
          name: String(g.name ?? 'Unnamed Garden'),
          location: String(g.location ?? g.region ?? ''),
        })))
      }
    } catch {
      setError('Failed to load fertilizers data.')
      setFertilizers([])
      setActiveFertilizers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ============================================================== */

  const openApplyModal = (fertilizer: Fertilizer) => {
    setSelectedFertilizer(fertilizer)
    setSelectedGardenId(gardens.length > 0 ? gardens[0].id : '')
    setApplyError(null)
    setApplySuccess(null)
    setShowApplyModal(true)
  }

  const handleApply = useCallback(async () => {
    if (!selectedFertilizer || !selectedGardenId) {
      setApplyError('Please select a garden.')
      return
    }
    setApplyError(null)
    setApplySuccess(null)
    setApplySubmitting(true)

    try {
      await api.post('/shop/buy', {
        itemId: selectedFertilizer.id,
        gardenId: selectedGardenId,
        quantity: 1,
      })
      setApplySuccess(`Applied "${selectedFertilizer.name}" to the selected garden!`)
      fetchData()
      setTimeout(() => setShowApplyModal(false), 1500)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Error: ${(err as { response: { data?: { error?: string } } }).response?.data?.error ?? 'Server error'}`
          : 'Failed to apply fertilizer.'
      setApplyError(message)
    } finally {
      setApplySubmitting(false)
    }
  }, [selectedFertilizer, selectedGardenId, fetchData])

  /* ============================================================== */

  const filteredFertilizers = fertilizers.filter(f => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.effects.some(e => e.toLowerCase().includes(q)) ||
      f.rarity.toLowerCase().includes(q)
    )
  })

  /* ── Loading State ── */
  if (isLoading && fertilizers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading fertilizers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-400/10">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Fertilizers</h1>
            <p className="text-sm text-slate-500">Browse fertilizers and manage active applications</p>
          </div>
        </div>
        <Badge variant="info">{fertilizers.length} available</Badge>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData}>Retry</Button>
        </div>
      )}

      {/* ── Success Banner ── */}
      {applySuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{applySuccess}</p>
        </div>
      )}

      {/* ── Search ── */}
      {fertilizers.length > 0 && (
        <div className="flex items-center gap-3 mb-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search fertilizers..."
              className="input-field pl-10"
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          SECTION 1: AVAILABLE FERTILIZERS
          ════════════════════════════════════════ */}
      <div>
        <h2 className="text-md font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          Available Fertilizers
        </h2>

        {filteredFertilizers.length === 0 && !isLoading ? (
          <div className="card p-10 text-center">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-md font-medium text-slate-300 mb-1">No Fertilizers Available</h3>
            <p className="text-sm text-slate-500">
              {searchQuery ? 'No fertilizers match your search.' : 'The fertilizer shop is empty.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFertilizers.map(fert => (
              <div key={fert.id} className="card group hover:border-slate-700/80 transition-all">
                {/* Rarity Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
                    RARITY_COLORS[fert.rarity] ?? 'text-slate-400 bg-slate-400/10'
                  )}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {fert.rarity.charAt(0) + fert.rarity.slice(1).toLowerCase()}
                  </div>
                  {fert.isOnSale && fert.discountPrice != null && (
                    <Badge variant="warning">SALE</Badge>
                  )}
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 mb-3 group-hover:bg-emerald-500/20 transition-colors">
                  <FlaskConical className="w-6 h-6" />
                </div>

                {/* Name & Description */}
                <h4 className="text-sm font-semibold text-slate-200">{fert.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{fert.description}</p>

                {/* Effects */}
                {fert.effects.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Effects</p>
                    <div className="flex flex-wrap gap-1">
                      {fert.effects.map((effect, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/40"
                        >
                          {effect}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration */}
                {fert.duration > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lasts <strong className="text-slate-300">{fert.duration} {fert.durationUnit}</strong></span>
                  </div>
                )}

                {/* Price & Apply */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    {fert.isOnSale && fert.discountPrice != null ? (
                      <>
                        <span className="text-lg font-bold text-emerald-400">{fert.discountPrice}</span>
                        <span className="text-xs text-slate-500 line-through">{fert.price}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-emerald-400">{fert.price}</span>
                    )}
                    <span className="text-xs text-slate-500">{fert.currency === 'GREEN_CREDITS' ? 'GC' : 'EP'}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openApplyModal(fert)}
                    disabled={gardens.length === 0}
                    title={gardens.length === 0 ? 'No gardens available' : 'Apply to garden'}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          SECTION 2: ACTIVE ON YOUR GARDENS
          ════════════════════════════════════════ */}
      <div>
        <h2 className="text-md font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          Active on Your Gardens
        </h2>

        {activeFertilizers.length > 0 ? (
          <>
            {/* Desktop: DataTable */}
            <div className="card hidden md:block">
              <DataTable
                columns={[
                  {
                    key: 'fertilizerName',
                    header: 'Fertilizer',
                    sortable: true,
                    render: r => (
                      <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                        {r.fertilizerName as string}
                      </span>
                    ),
                  },
                  {
                    key: 'gardenName',
                    header: 'Garden',
                    sortable: true,
                    render: r => (
                      <span className="flex items-center gap-1.5 text-sm text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {r.gardenName as string}
                      </span>
                    ),
                  },
                  {
                    key: 'gardenLocation',
                    header: 'Location',
                    render: r => {
                      const loc = r.gardenLocation as string
                      return loc ? <span className="text-xs text-slate-500">{loc}</span> : <span className="text-xs text-slate-600">—</span>
                    },
                  },
                  {
                    key: 'appliedAt',
                    header: 'Applied At',
                    sortable: true,
                    render: r => (
                      <span className="text-xs text-slate-400">{formatDateTime(r.appliedAt as string)}</span>
                    ),
                  },
                  {
                    key: 'remainingDuration',
                    header: 'Remaining',
                    sortable: true,
                    render: r => {
                      const dur = r.remainingDuration as number
                      const unit = r.remainingUnit as string
                      return (
                        <Badge variant={dur <= 1 ? 'warning' : dur <= 6 ? 'info' : 'success'}>
                          {dur} {unit}
                        </Badge>
                      )
                    },
                  },
                ]}
                data={activeFertilizers as unknown as Record<string, unknown>[]}
                keyExtractor={r => r.id as string}
                pageSize={10}
              />
            </div>

            {/* Mobile: Cards */}
            <div className="grid grid-cols-1 md:hidden gap-3">
              {activeFertilizers.map(a => (
                <div key={a.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-200">{a.fertilizerName}</span>
                    </div>
                    <Badge variant={a.remainingDuration <= 1 ? 'warning' : 'success'}>
                      {a.remainingDuration} {a.remainingUnit}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {a.gardenName}{a.gardenLocation ? ` — ${a.gardenLocation}` : ''}
                  </div>
                  <p className="text-[10px] text-slate-600">
                    Applied {formatRelativeTime(a.appliedAt)}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card p-8 text-center">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No fertilizers active on your gardens.</p>
            <p className="text-xs text-slate-600 mt-1">
              Apply a fertilizer from above to boost your garden&apos;s growth.
            </p>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          APPLY FERTILIZER MODAL
          ════════════════════════════════════════ */}
      <Modal
        open={showApplyModal}
        onOpenChange={setShowApplyModal}
        title={selectedFertilizer ? `Apply: ${selectedFertilizer.name}` : 'Apply Fertilizer'}
        description="Select a garden to apply this fertilizer to"
      >
        {selectedFertilizer && (
          <div className="space-y-4">
            {/* Fertilizer Summary */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{selectedFertilizer.name}</p>
                <p className="text-xs text-slate-500">{selectedFertilizer.description}</p>
              </div>
              <div className="ml-auto text-right">
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
                  RARITY_COLORS[selectedFertilizer.rarity] ?? ''
                )}>
                  {selectedFertilizer.rarity}
                </span>
                <p className="text-sm font-bold text-emerald-400 mt-1">
                  {selectedFertilizer.isOnSale && selectedFertilizer.discountPrice != null
                    ? selectedFertilizer.discountPrice
                    : selectedFertilizer.price} GC
                </p>
              </div>
            </div>

            {/* Error */}
            {applyError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{applyError}</p>
              </div>
            )}

            {/* Effects Info */}
            {selectedFertilizer.effects.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">Effects</p>
                <div className="flex flex-wrap gap-1">
                  {selectedFertilizer.effects.map((effect, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/40"
                    >
                      {effect}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Garden Select */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Select Garden <span className="text-red-400">*</span>
              </label>
              {gardens.length > 0 ? (
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500"
                  value={selectedGardenId}
                  onChange={e => setSelectedGardenId(e.target.value)}
                >
                  {gardens.map(g => (
                    <option key={g.id} value={g.id} className="bg-slate-900">
                      {g.name}{g.location ? ` (${g.location})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-lg bg-amber-400/10 border border-amber-400/20 text-sm text-amber-300">
                  No gardens available. Create a garden first.
                </div>
              )}
            </div>

            {/* Duration hint */}
            {selectedFertilizer.duration > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-sky-400/10 border border-sky-400/20 text-xs text-sky-300">
                <Clock className="w-4 h-4 shrink-0" />
                This fertilizer lasts for <strong>{selectedFertilizer.duration} {selectedFertilizer.durationUnit}</strong> after application.
              </div>
            )}

            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowApplyModal(false)} disabled={applySubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                loading={applySubmitting}
                disabled={applySubmitting || gardens.length === 0}
              >
                <FlaskConical className="w-4 h-4" />
                {applySubmitting ? 'Applying...' : 'Apply Fertilizer'}
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}
