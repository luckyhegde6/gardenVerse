'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Grid3X3,
  Plus,
  Sprout,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Droplets,
  Thermometer,
  FlaskConical,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Modal, ModalFooter } from '@/components/Modal'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import api from '@/lib/api'

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface Plot {
  id: string
  name: string | null
  plotNumber: number
  gardenType: string
  isPurchased: boolean
  cropCount: number
  soilQuality: number
  lastSoilCheck: string | null
  gardenId: string | null
  isActive: boolean
  irrigationLevel: number | null
}

interface PricingTier {
  from: number
  to: number
  price: number
  currency: string
}

interface PricingInfo {
  currentPlots: number
  maxPlots: number
  tiers: PricingTier[]
  canPurchase: boolean
  nextPrice: number
}

interface SoilCheckForm {
  phLevel: string
  moisture: string
  nitrogen: string
  phosphorus: string
  potassium: string
  organicMatter: string
}

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const SOIL_QUALITY_COLORS: Record<string, string> = {
  excellent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  good: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  fair: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  poor: 'text-red-400 bg-red-400/10 border-red-400/20',
  critical: 'text-red-500 bg-red-500/10 border-red-500/30',
}

function soilQualityLabel(q: number): string {
  if (q >= 80) return 'Excellent'
  if (q >= 60) return 'Good'
  if (q >= 40) return 'Fair'
  if (q >= 20) return 'Poor'
  return 'Critical'
}

function soilQualityVariant(q: number): string {
  if (q >= 80) return 'excellent'
  if (q >= 60) return 'good'
  if (q >= 40) return 'fair'
  if (q >= 20) return 'poor'
  return 'critical'
}

function soilBarColor(q: number): string {
  if (q >= 60) return 'bg-emerald-500'
  if (q >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

const INITIAL_SOIL_CHECK: SoilCheckForm = {
  phLevel: '',
  moisture: '',
  nitrogen: '',
  phosphorus: '',
  potassium: '',
  organicMatter: '',
}

/* ────────────────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────────────────── */

export default function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([])
  const [pricing, setPricing] = useState<PricingInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ---- Soil Check Modal ---- */
  const [showSoilModal, setShowSoilModal] = useState(false)
  const [soilCheckPlot, setSoilCheckPlot] = useState<Plot | null>(null)
  const [soilForm, setSoilForm] = useState<SoilCheckForm>(INITIAL_SOIL_CHECK)
  const [soilSubmitting, setSoilSubmitting] = useState(false)
  const [soilError, setSoilError] = useState<string | null>(null)
  const [soilSuccess, setSoilSuccess] = useState<string | null>(null)

  /* ---- Purchase Modal ---- */
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)

  /* ============================================================== */

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [plotsRes, pricingRes] = await Promise.all([
        api.get('/plots', { params: { limit: 100 } }),
        api.get('/plots/pricing').catch(() => null),
      ])

      const plotsBody = plotsRes.data as Record<string, unknown>
      const rawPlots = (plotsBody.data as unknown[]) ?? (Array.isArray(plotsBody) ? plotsBody : [])
      setPlots(
        (rawPlots as Record<string, unknown>[]).map(p => ({
          id: String(p.id ?? ''),
          name: p.name ? String(p.name) : null,
          plotNumber: typeof p.plotNumber === 'number' ? p.plotNumber : Number(p.plotNumber ?? 0),
          gardenType: String(p.gardenType ?? p.type ?? 'VIRTUAL'),
          isPurchased: Boolean(p.isPurchased ?? true),
          cropCount: typeof p.cropCount === 'number' ? p.cropCount : Number(p.cropCount ?? 0),
          soilQuality: typeof p.soilQuality === 'number' ? p.soilQuality : Number(p.soilQuality ?? 50),
          lastSoilCheck: p.lastSoilCheck ? String(p.lastSoilCheck) : null,
          gardenId: p.gardenId ? String(p.gardenId) : null,
          isActive: Boolean(p.isActive ?? true),
          irrigationLevel: p.irrigationLevel != null ? Number(p.irrigationLevel) : null,
        }))
      )

      if (pricingRes) {
        const pBody = pricingRes.data as Record<string, unknown>
        setPricing({
          currentPlots: typeof pBody.currentPlots === 'number' ? pBody.currentPlots : Number(pBody.currentPlots ?? 0),
          maxPlots: typeof pBody.maxPlots === 'number' ? pBody.maxPlots : Number(pBody.maxPlots ?? 0),
          canPurchase: Boolean(pBody.canPurchase ?? true),
          nextPrice: typeof pBody.nextPrice === 'number' ? pBody.nextPrice : Number(pBody.nextPrice ?? 0),
          tiers: Array.isArray(pBody.tiers) ? (pBody.tiers as Record<string, unknown>[]).map(t => ({
            from: Number(t.from ?? 0),
            to: Number(t.to ?? 0),
            price: Number(t.price ?? 0),
            currency: String(t.currency ?? 'GREEN_CREDITS'),
          })) : [],
        })
      }
    } catch {
      setError('Failed to load plots data.')
      setPlots([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ============================================================== */

  const openSoilCheck = (plot: Plot) => {
    setSoilCheckPlot(plot)
    setSoilForm(INITIAL_SOIL_CHECK)
    setSoilError(null)
    setSoilSuccess(null)
    setShowSoilModal(true)
  }

  const handleSoilFieldChange = (field: keyof SoilCheckForm, value: string) => {
    setSoilForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSoilSubmit = useCallback(async () => {
    if (!soilCheckPlot) return
    setSoilError(null)
    setSoilSuccess(null)
    setSoilSubmitting(true)

    try {
      await api.post(`/plots/${soilCheckPlot.id}/soil-check`, {
        phLevel: soilForm.phLevel ? parseFloat(soilForm.phLevel) : undefined,
        moisture: soilForm.moisture ? parseFloat(soilForm.moisture) : undefined,
        nitrogen: soilForm.nitrogen ? parseFloat(soilForm.nitrogen) : undefined,
        phosphorus: soilForm.phosphorus ? parseFloat(soilForm.phosphorus) : undefined,
        potassium: soilForm.potassium ? parseFloat(soilForm.potassium) : undefined,
        organicMatter: soilForm.organicMatter ? parseFloat(soilForm.organicMatter) : undefined,
      })
      setSoilSuccess('Soil check recorded successfully!')
      fetchData()
      setTimeout(() => setShowSoilModal(false), 1500)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Error: ${(err as { response: { data?: { error?: string } } }).response?.data?.error ?? 'Server error'}`
          : 'Failed to submit soil check.'
      setSoilError(message)
    } finally {
      setSoilSubmitting(false)
    }
  }, [soilCheckPlot, soilForm, fetchData])

  const handlePurchase = useCallback(async () => {
    setPurchaseError(null)
    setPurchaseSuccess(null)
    setPurchaseLoading(true)
    try {
      await api.post('/plots', {})
      setPurchaseSuccess('New plot purchased successfully!')
      fetchData()
      setTimeout(() => setShowPurchaseModal(false), 1500)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Error: ${(err as { response: { data?: { error?: string } } }).response?.data?.error ?? 'Server error'}`
          : 'Failed to purchase plot.'
      setPurchaseError(message)
    } finally {
      setPurchaseLoading(false)
    }
  }, [fetchData])

  /* ============================================================== */

  const purchasedCount = plots.filter(p => p.isPurchased).length
  const freeCount = plots.filter(p => !p.isPurchased).length
  const totalCrops = plots.reduce((sum, p) => sum + p.cropCount, 0)
  const avgSoilQuality = plots.length > 0
    ? Math.round(plots.reduce((sum, p) => sum + p.soilQuality, 0) / plots.length)
    : 0

  /* ── Loading State ── */
  if (isLoading && plots.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading plots...</p>
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
            <Grid3X3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Plots &amp; Gardens</h1>
            <p className="text-sm text-slate-500">Manage garden plots, soil checks, and plot purchases</p>
          </div>
        </div>
        <Button onClick={() => { setPurchaseError(null); setPurchaseSuccess(null); setShowPurchaseModal(true) }}>
          <Plus className="w-4 h-4" /> Purchase New Plot
        </Button>
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
      {soilSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{soilSuccess}</p>
        </div>
      )}

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-slate-400">Total Plots</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{plots.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Purchased</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{purchasedCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Free</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{freeCount}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <p className="text-sm text-slate-400">Active Crops</p>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-1">{totalCrops}</p>
        </div>
      </div>

      {/* ── Plot Cards Grid ── */}
      {plots.length === 0 && !isLoading ? (
        <div className="card p-10 text-center">
          <Grid3X3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-md font-medium text-slate-300 mb-1">No Plots Available</h3>
          <p className="text-sm text-slate-500 mb-4">Purchase your first plot to get started.</p>
          <Button onClick={() => { setPurchaseError(null); setPurchaseSuccess(null); setShowPurchaseModal(true) }}>
            <Plus className="w-4 h-4" /> Purchase New Plot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plots.map(plot => (
            <div
              key={plot.id}
              className={`card transition-all hover:border-slate-700/80 ${
                !plot.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    {plot.name ?? `Plot ${plot.plotNumber}`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">#{plot.plotNumber}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={plot.gardenType === 'VIRTUAL' ? 'info' : 'success'} dot>
                    {plot.gardenType}
                  </Badge>
                  {plot.isPurchased && (
                    <Badge variant="success">Purchased</Badge>
                  )}
                </div>
              </div>

              {/* Crop Count */}
              <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong className="text-slate-200">{plot.cropCount}</strong> crops
                </span>
              </div>

              {/* Soil Quality Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Soil Quality</span>
                  <span className={soilBarColor(plot.soilQuality).replace('bg-', 'text-')}>
                    {plot.soilQuality}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${soilBarColor(plot.soilQuality)}`}
                    style={{ width: `${plot.soilQuality}%` }}
                  />
                </div>
              </div>

              {/* Irrigation */}
              {plot.irrigationLevel != null && (
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Irrigation <strong className="text-sky-400">{plot.irrigationLevel}%</strong></span>
                </div>
              )}

              {/* Last Soil Check */}
              <p className="text-[10px] text-slate-600 mb-3">
                {plot.lastSoilCheck
                  ? `Last checked ${formatRelativeTime(plot.lastSoilCheck)}`
                  : 'No soil check recorded'}
              </p>

              {/* Soil Check Button */}
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => openSoilCheck(plot)}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Soil Check
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════
          SOIL CHECK MODAL
          ════════════════════════════════════════ */}
      <Modal
        open={showSoilModal}
        onOpenChange={setShowSoilModal}
        title={`Soil Check — ${soilCheckPlot?.name ?? `Plot ${soilCheckPlot?.plotNumber ?? ''}`}`}
        description="Record soil parameters for this plot"
      >
        <div className="space-y-4">
          {soilError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{soilError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="ph-level"
              label="pH Level"
              type="number"
              step="0.1"
              min="0"
              max="14"
              placeholder="e.g., 6.5"
              value={soilForm.phLevel}
              onChange={e => handleSoilFieldChange('phLevel', e.target.value)}
            />
            <Input
              id="moisture"
              label="Moisture %"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="e.g., 45"
              value={soilForm.moisture}
              onChange={e => handleSoilFieldChange('moisture', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              id="nitrogen"
              label="Nitrogen (N)"
              type="number"
              step="0.1"
              min="0"
              placeholder="mg/kg"
              value={soilForm.nitrogen}
              onChange={e => handleSoilFieldChange('nitrogen', e.target.value)}
            />
            <Input
              id="phosphorus"
              label="Phosphorus (P)"
              type="number"
              step="0.1"
              min="0"
              placeholder="mg/kg"
              value={soilForm.phosphorus}
              onChange={e => handleSoilFieldChange('phosphorus', e.target.value)}
            />
            <Input
              id="potassium"
              label="Potassium (K)"
              type="number"
              step="0.1"
              min="0"
              placeholder="mg/kg"
              value={soilForm.potassium}
              onChange={e => handleSoilFieldChange('potassium', e.target.value)}
            />
          </div>

          <Input
            id="organic-matter"
            label="Organic Matter %"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="e.g., 3.5"
            value={soilForm.organicMatter}
            onChange={e => handleSoilFieldChange('organicMatter', e.target.value)}
          />

          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowSoilModal(false)} disabled={soilSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSoilSubmit} loading={soilSubmitting} disabled={soilSubmitting}>
              <CheckCircle2 className="w-4 h-4" />
              {soilSubmitting ? 'Submitting...' : 'Submit Soil Check'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* ════════════════════════════════════════
          PURCHASE PLOT MODAL
          ════════════════════════════════════════ */}
      <Modal
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
        title="Purchase New Plot"
        description={pricing ? `${pricing.currentPlots} of ${pricing.maxPlots} plots owned` : 'Loading pricing...'}
      >
        <div className="space-y-4">
          {purchaseError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{purchaseError}</p>
            </div>
          )}

          {purchaseSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300">{purchaseSuccess}</p>
            </div>
          )}

          {pricing && (
            <>
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Plot Ownership</span>
                  <span className="text-slate-300">
                    {pricing.currentPlots} / {pricing.maxPlots}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pricing.currentPlots >= pricing.maxPlots ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(pricing.currentPlots / Math.max(pricing.maxPlots, 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Pricing tiers */}
              {pricing.tiers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-2">Pricing Tiers</p>
                  <div className="space-y-1.5">
                    {pricing.tiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-sm"
                      >
                        <span className="text-slate-400">
                          Plot {tier.from}{tier.to > tier.from ? ` – ${tier.to}` : ''}
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {tier.price.toLocaleString()} {tier.currency === 'GREEN_CREDITS' ? 'GC' : tier.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase button */}
              {pricing.canPurchase ? (
                <div className="rounded-lg bg-emerald-400/5 border border-emerald-400/20 p-4 text-center">
                  <p className="text-sm text-slate-300 mb-3">
                    Next plot price:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {pricing.nextPrice.toLocaleString()} GC
                    </strong>
                  </p>
                  <Button
                    className="w-full"
                    onClick={handlePurchase}
                    loading={purchaseLoading}
                    disabled={purchaseLoading}
                  >
                    <CreditCard className="w-4 h-4" />
                    Buy at {pricing.nextPrice.toLocaleString()} GC
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 p-4 text-center">
                  <p className="text-sm text-amber-300">
                    Maximum plot limit reached ({pricing.maxPlots}).
                  </p>
                  <p className="text-xs text-amber-400/70 mt-1">
                    Upgrade your account to unlock more plots.
                  </p>
                </div>
              )}
            </>
          )}

          {!pricing && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          )}

          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowPurchaseModal(false)} disabled={purchaseLoading}>
              Close
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
