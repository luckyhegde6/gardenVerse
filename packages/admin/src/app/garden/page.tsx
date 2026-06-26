'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Sprout, Trees, Bug, Droplets, Loader2, AlertCircle,
  Grid3X3, Info, Search, MapPin, Settings, GripVertical,
  ToggleLeft, ToggleRight, RotateCcw, User, Heart,
  CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Select } from '@/components/Select'
import { Input } from '@/components/Input'
import { Modal, ModalFooter } from '@/components/Modal'
import api from '@/lib/api'

/* ───────────────────────────────────────────
   Types
   ─────────────────────────────────────────── */

interface DashboardStats {
  totalGardens: number
  totalCrops: number
  totalUsers: number
  verifiedUsers: number
  verificationRate: string
  activeListings: number
  completedTransactions: number
  totalRevenue: number
  reportsPending: number
  activeSessions: number
}

interface GardenRow {
  id: string
  name: string
  owner: string
  type: string
  size: number
  crops: number
  soilQuality: number
  irrigation: number
  status: string
}

interface CropRow {
  id: string
  name: string
  garden: string
  stage: string
  health: number
  status: string
}

/** A crop as returned inside a garden's `crops` array. */
interface GardenCrop {
  id: string
  name: string
  species: string
  status: string
  growthStage: number
  health: number
  hydration: number
  nutrientLevel: number
  plotX: number
  plotY: number
}

/** A garden enriched with its full crop list for the map view. */
interface GardenMapEntry {
  id: string
  name: string
  type: string
  size: number
  soilQuality: number
  irrigationLevel: number
  status: string
  user: { id: string; username: string; displayName: string }
  crops: GardenCrop[]
  gridWidth?: number
  gridHeight?: number
  irrigationType?: string
  wateringMode?: string
  hasMotorPump?: boolean
}

interface SimpleUser {
  id: string
  username: string
  displayName: string
}

/* ───────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  SEED: 'Seed',
  SPROUTING: 'Sprouting',
  GROWING: 'Growing',
  MATURE: 'Mature',
  HARVESTED: 'Harvested',
  WILTED: 'Wilted',
  DISEASED: 'Diseased',
}

function stageToDots(stage: string): number {
  const map: Record<string, number> = {
    SEED: 1,
    SPROUTING: 2,
    GROWING: 3,
    MATURE: 4,
    HARVESTED: 4,
  }
  return map[stage] ?? 0
}

function healthColor(h: number): string {
  if (h >= 70) return 'border-emerald-500'
  if (h >= 40) return 'border-amber-500'
  return 'border-red-500'
}

function healthBg(h: number): string {
  if (h >= 70) return 'bg-emerald-500/20'
  if (h >= 40) return 'bg-amber-500/20'
  return 'bg-red-500/20'
}

const DOT_COLORS: Record<string, string> = {
  1: 'bg-slate-500',
  2: 'bg-sky-400',
  3: 'bg-emerald-400',
  4: 'bg-amber-400',
}

function cellBorderClass(crop: GardenCrop | null, sq: number): string {
  if (crop) return healthColor(crop.health)
  if (sq >= 70) return 'border-amber-800/50'
  if (sq >= 40) return 'border-amber-700/30'
  return 'border-amber-600/20'
}

/**
 * Derive a soil‑colour hex (RGB) string based on soil quality (0‑100).
 * Higher quality → richer, darker earth.
 */
function soilColor(sq: number): string {
  // lerp between light (#A0724A) and dark (#3B1F0B)
  const t = Math.max(0, Math.min(100, sq)) / 100
  const r = Math.round(160 - t * 80)
  const g = Math.round(114 - t * 60)
  const b = Math.round(74 - t * 50)
  return `rgb(${r},${g},${b})`
}

const GRID = 6

const SPECIES_EMOJI: Record<string, string> = {
  TOMATO: '🍅', CHILLI: '🌶️', TURMERIC: '🟡', RICE: '🌾',
  OKRA: '🫑', BRINJAL: '🍆', MINT: '🌿', CORIANDER: '🌿',
  SPINACH: '🥬', LETTUCE: '🥬', CARROT: '🥕', BEETROOT: '🥔',
  ONION: '🧅', GARLIC: '🧄', GINGER: '🫚', POTATO: '🥔',
  CAULIFLOWER: '🥦', CABBAGE: '🥬', PEA: '🫛', BEAN: '🫘',
  PUMPKIN: '🎃', WATERMELON: '🍉', CUCUMBER: '🥒', SUGARCANE: '🎋',
  COTTON: '🌱', COCONUT: '🥥', BANANA: '🍌', MANGO: '🥭',
  PAPAYA: '🧡', GUAVA: '🍐',
}

function speciesEmoji(species: string | undefined): string {
  return SPECIES_EMOJI[species?.toUpperCase() ?? ''] ?? '🌱'
}

/* ───────────────────────────────────────────
   Page component
   ─────────────────────────────────────────── */

export default function GardenPage() {
  /* ---- existing state ---- */
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [gardens, setGardens] = useState<GardenRow[]>([])
  const [crops, setCrops] = useState<CropRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ---- garden map state ---- */
  const [gardenMaps, setGardenMaps] = useState<GardenMapEntry[]>([])
  const [selectedGardenId, setSelectedGardenId] = useState<string>('')
  const [showCropModal, setShowCropModal] = useState(false)
  const [modalCrop, setModalCrop] = useState<GardenCrop | null>(null)

  /* ---- user filter ---- */
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  /* ---- grid / irrigation settings ---- */
  const [gridSize, setGridSize] = useState(6)
  const [showSettings, setShowSettings] = useState(false)
  const [editGridW, setEditGridW] = useState(6)
  const [editGridH, setEditGridH] = useState(6)
  const [editIrrigationType, setEditIrrigationType] = useState('DRIP')
  const [editWateringMode, setEditWateringMode] = useState('MANUAL')
  const [savingSettings, setSavingSettings] = useState(false)

  /* ---- drag-to-move ---- */
  const [dragSource, setDragSource] = useState<{ x: number; y: number } | null>(null)

  /* ---- data fetching ---- */
  const fetchData = useCallback(async (userIdOverride?: string) => {
    setIsLoading(true)
    setError(null)

    const gardensParams: Record<string, unknown> = { limit: 50 }
    const uid = userIdOverride ?? selectedUserId
    if (uid) {
      gardensParams.userId = uid
    }

    try {
      const [statsRes, gardensRes, cropsRes, usersRes] = await Promise.all([
        api.get('/admin').catch(() => null),
        api.get('/gardens', { params: gardensParams }),
        api.get('/crops', { params: { limit: 50 } }),
        api.get('/users', { params: { limit: 100 } }).catch(() => null),
      ])

      /* users for filter */
      if (usersRes?.data?.data) {
        const rawUsers = usersRes.data.data as Record<string, unknown>[]
        setUsers(rawUsers.map((u) => ({
          id: u.id as string,
          username: u.username as string,
          displayName: (u.displayName as string) || (u.username as string),
        })))
      }

      /* stats */
      if (statsRes) {
        const d = statsRes.data as Record<string, unknown>
        setStats({
          totalUsers: (d.totalUsers as number) ?? 0,
          verifiedUsers: (d.verifiedUsers as number) ?? 0,
          verificationRate: (d.verificationRate as string) ?? '0%',
          totalGardens: (d.activeGardens as number) ?? 0,
          totalCrops: (d.totalCrops as number) ?? 0,
          activeListings: (d.marketplaceVolume as number) ?? 0,
          completedTransactions: (d.marketplaceTransactions as number) ?? 0,
          totalRevenue: (d.revenue as number) ?? 0,
          reportsPending: (d.pendingReports as number) ?? 0,
          activeSessions: (d.activeSessions as number) ?? 0,
        } as DashboardStats)
      }

      /* gardens table */
      const gardensBody = gardensRes.data as { data?: Record<string, unknown>[] }
      if (gardensBody?.data) {
        setGardens(gardensBody.data.map((g: Record<string, unknown>) => ({
          id: g.id as string,
          name: g.name as string,
          owner: ((g.user as Record<string, unknown>)?.displayName as string)
            ?? ((g.user as Record<string, unknown>)?.username as string)
            ?? 'Unknown',
          type: g.type as string,
          size: (g.size as number) ?? (g.crops as unknown[])?.length ?? 0,
          crops: (g.crops as unknown[])?.length ?? 0,
          soilQuality: (g.soilQuality as number) ?? 0,
          irrigation: (g.irrigationLevel as number) ?? 0,
          status: (g.status as string) ?? 'active',
        })))

        /* extract full garden + crop data for map view */
        const mapEntries: GardenMapEntry[] = gardensBody.data.map((g: Record<string, unknown>) => {
          const rawCrops = (g.crops as Record<string, unknown>[]) ?? []
          return {
            id: g.id as string,
            name: g.name as string,
            type: g.type as string,
            size: (g.size as number) ?? 0,
            soilQuality: (g.soilQuality as number) ?? 50,
            irrigationLevel: (g.irrigationLevel as number) ?? 50,
            status: (g.status as string) ?? 'active',
            user: (g.user as { id: string; username: string; displayName: string }) ?? { id: '', username: 'Unknown', displayName: 'Unknown' },
            gridWidth: (g.gridWidth as number) ?? 6,
            gridHeight: (g.gridHeight as number) ?? 6,
            irrigationType: (g.irrigationType as string) ?? 'DRIP',
            wateringMode: (g.wateringMode as string) ?? 'MANUAL',
            hasMotorPump: (g.hasMotorPump as boolean) ?? false,
            crops: rawCrops.map(c => ({
              id: c.id as string,
              name: c.name as string,
              species: c.species as string ?? '',
              status: c.status as string,
              growthStage: (c.growthStage as number) ?? 0,
              health: (c.health as number) ?? 0,
              hydration: (c.hydration as number) ?? 0,
              nutrientLevel: (c.nutrientLevel as number) ?? 0,
              plotX: (c.plotX as number) ?? -1,
              plotY: (c.plotY as number) ?? -1,
            })),
          }
        })
        setGardenMaps(mapEntries)
        if (mapEntries.length > 0 && !selectedGardenId) {
          setSelectedGardenId(mapEntries[0].id)
        }
      }

      /* crops table */
      const cropsBody = cropsRes.data as { data?: Record<string, unknown>[] }
      if (cropsBody?.data) {
        setCrops(cropsBody.data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          garden: ((c.garden as Record<string, unknown>)?.name as string) ?? 'Unknown',
          stage: c.status as string,
          health: (c.health as number) ?? 0,
          status: (c.health as number) >= 70 ? 'healthy' : (c.health as number) >= 40 ? 'warning' : 'error',
        })))
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Failed to load garden data: ${(err as { response: { status: number } }).response?.status ?? 'Unknown error'}`
          : 'Failed to load garden data. The server may be unavailable.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedGardenId, selectedUserId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const userIdParam = params.get('userId')
      if (userIdParam) {
        setSelectedUserId(userIdParam)
        fetchData(userIdParam)
        return
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const diseasedCount = crops.filter(c => c.status === 'error').length
  const avgSoilQuality = gardens.length > 0
    ? Math.round(gardens.reduce((sum, g) => sum + g.soilQuality, 0) / gardens.length)
    : null

  /* ── derived map data ── */
  const selectedGarden = gardenMaps.find(g => g.id === selectedGardenId)
  const activeGridSize = selectedGarden?.gridWidth ?? gridSize

  const gridCells = Array.from({ length: activeGridSize * activeGridSize }, (_, i) => {
    const x = i % activeGridSize
    const y = Math.floor(i / activeGridSize)
    const crop = selectedGarden?.crops.find(c => c.plotX === x && c.plotY === y) ?? null
    return { x, y, crop }
  })

  const occupiedCount = selectedGarden?.crops.length ?? 0
  const totalPlots = activeGridSize * activeGridSize
  const emptyCount = totalPlots - occupiedCount
  const avgHealth = (() => {
    if (!selectedGarden || selectedGarden.crops.length === 0) return null
    return Math.round(selectedGarden.crops.reduce((s, c) => s + c.health, 0) / selectedGarden.crops.length)
  })()
  const avgHydration = (() => {
    if (!selectedGarden || selectedGarden.crops.length === 0) return null
    return Math.round(selectedGarden.crops.reduce((s, c) => s + c.hydration, 0) / selectedGarden.crops.length)
  })()

  const healthyCount = selectedGarden?.crops.filter(c => c.health >= 70).length ?? 0
  const warningCount = selectedGarden?.crops.filter(c => c.health >= 40 && c.health < 70).length ?? 0
  const errorCount = selectedGarden?.crops.filter(c => c.health < 40).length ?? 0

  /* ── save garden settings ── */
  const handleSaveSettings = useCallback(async () => {
    if (!selectedGarden) return
    setSavingSettings(true)
    try {
      await api.patch(`/gardens/${selectedGarden.id}`, {
        gridWidth: editGridW,
        gridHeight: editGridH,
        irrigationType: editIrrigationType,
        wateringMode: editWateringMode,
      })
      setShowSettings(false)
      await fetchData()
    } catch {
      setError('Failed to save garden settings.')
    } finally {
      setSavingSettings(false)
    }
  }, [selectedGarden, editGridW, editGridH, editIrrigationType, editWateringMode, fetchData])

  /* ── drag-to-move crop ── */
  const handleTileDrop = useCallback(async (fromX: number, fromY: number, toX: number, toY: number) => {
    if (!selectedGarden) return
    const crop = selectedGarden.crops.find(c => c.plotX === fromX && c.plotY === fromY)
    if (!crop) return
    const targetOccupied = selectedGarden.crops.find(c => c.plotX === toX && c.plotY === toY)
    try {
      await api.patch(`/crops/${crop.id}`, targetOccupied
        ? { plotX: toX, plotY: toY, swapWithPlotX: fromX, swapWithPlotY: fromY }
        : { plotX: toX, plotY: toY }
      )
      await fetchData()
    } catch {
      setError('Failed to move crop.')
    }
    setDragSource(null)
  }, [selectedGarden, fetchData])

  const gardenSelectOptions = gardenMaps.map(g => ({
    value: g.id,
    label: `${g.name}  (${g.type} · ${g.user.displayName})`,
  }))

  /* ── loading ── */
  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading garden data...</p>
        </div>
      </div>
    )
  }

  /* ───────────────────────────────────────
     Render
     ─────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── error banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchData()}>Retry</Button>
        </div>
      )}

      {!error && (
        <>
          {/* ── stat cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Gardens" value={stats?.totalGardens ?? 0} change={6.8} trend="up" icon={<Trees className="w-6 h-6" />} changeLabel="this month" />
            <StatCard title="Active Crops" value={stats?.totalCrops ?? 0} change={3.2} trend="up" icon={<Sprout className="w-6 h-6" />} changeLabel="vs last week" />
            <StatCard title="Diseased Crops" value={diseasedCount} change={diseasedCount > 0 ? 0 : undefined} trend={diseasedCount > 0 ? 'up' : undefined} icon={<Bug className="w-6 h-6" />} changeLabel="current" />
            <StatCard title="Avg Soil Quality" value={avgSoilQuality !== null ? `${avgSoilQuality}%` : 'N/A'} icon={<Droplets className="w-6 h-6" />} />
          </div>

          {/* ── garden info panel ── */}
          {selectedGarden && (
            <div className="rounded-lg bg-slate-800/30 border border-slate-700/50 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{speciesEmoji(selectedGarden.crops[0]?.species)}</div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">{selectedGarden.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={selectedGarden.type === 'VIRTUAL' ? 'info' : selectedGarden.type === 'REAL' ? 'success' : 'warning'}>
                        {selectedGarden.type}
                      </Badge>
                      <Badge variant={selectedGarden.status === 'active' ? 'active' : selectedGarden.status === 'suspended' ? 'suspended' : 'inactive'} dot>
                        {selectedGarden.status}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {selectedGarden.user?.displayName ?? selectedGarden.user?.username ?? 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* quick action badges */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                    <CheckCircle2 className="w-3 h-3" />
                    {healthyCount} Healthy
                  </span>
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <AlertTriangle className="w-3 h-3" />
                    {warningCount} Warning
                  </span>
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-400/10 text-red-400 border border-red-400/20">
                    <XCircle className="w-3 h-3" />
                    {errorCount} Error
                  </span>
                </div>
              </div>

              {/* soil quality + irrigation bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Soil Quality</span>
                    <span className={selectedGarden.soilQuality >= 70 ? 'text-emerald-400' : selectedGarden.soilQuality >= 40 ? 'text-amber-400' : 'text-red-400'}>
                      {selectedGarden.soilQuality}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${selectedGarden.soilQuality >= 70 ? 'bg-emerald-500' : selectedGarden.soilQuality >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${selectedGarden.soilQuality}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Irrigation Level</span>
                    <span className={selectedGarden.irrigationLevel >= 70 ? 'text-sky-400' : selectedGarden.irrigationLevel >= 40 ? 'text-amber-400' : 'text-red-400'}>
                      {selectedGarden.irrigationLevel}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${selectedGarden.irrigationLevel >= 70 ? 'bg-sky-500' : selectedGarden.irrigationLevel >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${selectedGarden.irrigationLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* quick stats row */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400 border-t border-slate-700/40">
                <span className="flex items-center gap-1">
                  <Grid3X3 className="w-3.5 h-3.5 text-slate-500" />
                  Occupied <strong className="text-slate-200">{occupiedCount}/{totalPlots}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-emerald-500" />
                  Avg Health <strong className={avgHealth !== null && avgHealth >= 70 ? 'text-emerald-400' : avgHealth !== null && avgHealth >= 40 ? 'text-amber-400' : 'text-red-400'}>{avgHealth !== null ? `${avgHealth}%` : '—'}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  Avg Hydration <strong className={avgHydration !== null && avgHydration >= 70 ? 'text-sky-400' : avgHydration !== null && avgHydration >= 40 ? 'text-amber-400' : 'text-red-400'}>{avgHydration !== null ? `${avgHydration}%` : '—'}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-slate-500" />
                  Plots <strong className="text-slate-200">{totalPlots}</strong>
                </span>
              </div>
            </div>
          )}

          {/* ── user filter bar ── */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-slate-800/20 border border-slate-700/40">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Filter by User:</span>
            </div>
            <select
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value)
                fetchData(e.target.value || undefined)
              }}
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName} (@{u.username})
                </option>
              ))}
            </select>
            {selectedUserId && (
              <button
                onClick={() => { setSelectedUserId(''); fetchData() }}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* ── tables ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Gardens Overview</h3>
                <Badge variant="info">{gardens.length}</Badge>
              </div>
              {gardens.length > 0 ? (
                <DataTable
                  columns={[
                    { key: 'name', header: 'Name', sortable: true },
                    { key: 'owner', header: 'Owner', sortable: true },
                    { key: 'type', header: 'Type', sortable: true, width: '90px', render: r => {
                      const colors: Record<string, string> = { VIRTUAL: 'text-sky-400', REAL: 'text-emerald-400', HYBRID: 'text-purple-400' }
                      return <span className={colors[r.type as string] || ''}>{r.type as string}</span>
                    }},
                    { key: 'size', header: 'Plots', sortable: true, width: '70px' },
                    { key: 'crops', header: 'Crops', sortable: true, width: '70px' },
                    { key: 'soilQuality', header: 'Soil', sortable: true, width: '80px', render: r => {
                      const v = r.soilQuality as number
                      return <span className={v >= 70 ? 'text-emerald-400' : v >= 40 ? 'text-amber-400' : 'text-red-400'}>{v}%</span>
                    }},
                    { key: 'irrigation', header: 'Water', sortable: true, width: '80px', render: r => {
                      const v = r.irrigation as number
                      return <span className={v >= 70 ? 'text-emerald-400' : v >= 40 ? 'text-amber-400' : 'text-red-400'}>{v}%</span>
                    }},
                    { key: 'status', header: 'Status', sortable: true, width: '90px', render: r => (
                      <Badge variant={(r.status as string) === 'active' ? 'active' : (r.status as string) === 'suspended' ? 'suspended' : 'inactive'} dot>{r.status as string}</Badge>
                    )},
                  ]}
                  data={gardens as unknown as Record<string, unknown>[]}
                  keyExtractor={(r) => (r as unknown as GardenRow).id}
                  pageSize={8}
                />
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">No gardens found.</div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Crop Health Monitor</h3>
                <Badge variant="info">{crops.length}</Badge>
              </div>
              {crops.length > 0 ? (
                <DataTable
                  columns={[
                    { key: 'name', header: 'Crop', sortable: true },
                    { key: 'garden', header: 'Garden', sortable: true },
                    { key: 'stage', header: 'Stage', sortable: true, width: '100px', render: r => {
                      const colors: Record<string, string> = { SEED: 'text-slate-400', SPROUTING: 'text-sky-400', GROWING: 'text-emerald-400', MATURE: 'text-amber-400', HARVESTED: 'text-green-600', WILTED: 'text-red-400', DISEASED: 'text-red-600' }
                      return <span className={colors[r.stage as string] || ''}>{(r.stage as string).charAt(0) + (r.stage as string).slice(1).toLowerCase()}</span>
                    }},
                    { key: 'health', header: 'Health', sortable: true, width: '80px', render: r => {
                      const v = r.health as number
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className={`h-full rounded-full ${v >= 70 ? 'bg-emerald-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{v}%</span>
                        </div>
                      )
                    }},
                    { key: 'status', header: 'Status', sortable: true, width: '90px', render: r => {
                      const map: Record<string, 'success' | 'warning' | 'error'> = { healthy: 'success', warning: 'warning', error: 'error' }
                      return <Badge variant={map[r.status as string] || 'default'} dot>{r.status as string}</Badge>
                    }},
                  ]}
                  data={crops as unknown as Record<string, unknown>[]}
                  keyExtractor={(r) => (r as unknown as CropRow).id}
                  pageSize={6}
                />
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">No crops found.</div>
              )}
            </div>
          </div>

          {/* ═════════════════════════════════════
              Garden Maps — 2D Visual Grid
              ═════════════════════════════════════ */}
          <hr className="border-slate-700/60" />

          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-admin-400" />
                <h3 className="card-title">Garden Maps</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <Select
                    options={gardenSelectOptions}
                    value={selectedGardenId}
                    onChange={(e) => { setSelectedGardenId(e.target.value); setShowSettings(false) }}
                    placeholder="Select a garden…"
                  />
                </div>
                {selectedGarden && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditGridW(selectedGarden.gridWidth ?? 6)
                      setEditGridH(selectedGarden.gridHeight ?? 6)
                      setEditIrrigationType(selectedGarden.irrigationType ?? 'DRIP')
                      setEditWateringMode(selectedGarden.wateringMode ?? 'MANUAL')
                      setShowSettings(true)
                    }}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </Button>
                )}
              </div>
            </div>

            {!selectedGarden ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Select a garden above to view its map.
              </div>
            ) : (
              <div className="p-1 space-y-5">
                {/* ── stats summary ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-center">
                    <Grid3X3 className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total Plots</p>
                    <p className="text-xl font-semibold text-slate-100 mt-1">{totalPlots}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-center">
                    <Sprout className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Occupied</p>
                    <p className="text-xl font-semibold text-emerald-400 mt-1">{occupiedCount}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-center">
                    <span className="block text-lg mb-0.5">⬜</span>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Empty</p>
                    <p className="text-xl font-semibold text-slate-400 mt-1">{emptyCount}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-center">
                    <Heart className={`w-4 h-4 mx-auto mb-1 ${avgHealth !== null && avgHealth >= 70 ? 'text-emerald-400' : avgHealth !== null && avgHealth >= 40 ? 'text-amber-400' : 'text-red-400'}`} />
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Health</p>
                    <p className={`text-xl font-semibold mt-1 ${avgHealth !== null && avgHealth >= 70 ? 'text-emerald-400' : avgHealth !== null && avgHealth >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {avgHealth !== null ? `${avgHealth}%` : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-center">
                    <Droplets className={`w-4 h-4 mx-auto mb-1 ${avgHydration !== null && avgHydration >= 70 ? 'text-sky-400' : avgHydration !== null && avgHydration >= 40 ? 'text-amber-400' : 'text-red-400'}`} />
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Hydration</p>
                    <p className={`text-xl font-semibold mt-1 ${avgHydration !== null && avgHydration >= 70 ? 'text-sky-400' : avgHydration !== null && avgHydration >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {avgHydration !== null ? `${avgHydration}%` : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-center">
                    <Settings className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Irrigation</p>
                    <p className="text-sm font-semibold text-cyan-400 mt-1">{selectedGarden?.irrigationType ?? 'DRIP'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-center">
                    {selectedGarden?.wateringMode === 'AUTO' ? <ToggleRight className="w-4 h-4 mx-auto mb-1 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 mx-auto mb-1 text-amber-400" />}
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Watering</p>
                    <p className={`text-sm font-semibold mt-1 ${selectedGarden?.wateringMode === 'AUTO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {selectedGarden?.wateringMode ?? 'MANUAL'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-center">
                    {selectedGarden?.hasMotorPump
                      ? <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                      : <XCircle className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                    }
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Motor Pump</p>
                    <p className={`text-sm font-semibold mt-1 ${selectedGarden?.hasMotorPump ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {selectedGarden?.hasMotorPump ? 'ACTIVE' : 'OFF'}
                    </p>
                  </div>
                </div>

                {/* ── coordinate labels + grid ── */}
                <div>
                  {/* column headers */}
                  <div className="flex ml-8 mb-1">
                    {Array.from({ length: activeGridSize }, (_, x) => (
                      <div key={x} className="flex-1 text-center text-[10px] text-slate-600 font-mono">
                        x={x}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-0">
                    {/* row labels */}
                    <div className="flex flex-col justify-around w-8 py-0.5">
                      {Array.from({ length: activeGridSize }, (_, y) => (
                        <div key={y} className="h-[calc((100%-5px)/6)] flex items-center justify-center text-[10px] text-slate-600 font-mono">
                          y={y}
                        </div>
                      ))}
                    </div>

                    {/* grid */}
                    <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${activeGridSize}, 1fr)` }}>
                      {gridCells.map(({ x, y, crop }) => {
                        const sq = selectedGarden.soilQuality
                        const bg = soilColor(sq)
                        const dotCount = crop ? stageToDots(crop.status) : 0

                        return (
                          <button
                            key={`${x}-${y}`}
                            type="button"
                            draggable={!!crop}
                            onDragStart={() => { if (crop) setDragSource({ x: crop.plotX, y: crop.plotY }) }}
                            onDragOver={(e) => { e.preventDefault() }}
                            onDrop={() => {
                              if (dragSource) {
                                handleTileDrop(dragSource.x, dragSource.y, x, y)
                              }
                            }}
                            onClick={() => {
                              if (crop) {
                                setModalCrop(crop)
                                setShowCropModal(true)
                              }
                            }}
                            className={`
                              relative aspect-square rounded-md border-2
                              transition-all duration-150
                              ${dragSource ? 'cursor-copy' : crop ? 'cursor-pointer hover:ring-2 hover:ring-admin-400/60 hover:scale-[1.04]' : 'cursor-default'}
                              ${cellBorderClass(crop, sq)}
                              overflow-hidden group
                            `}
                            style={{ backgroundColor: bg }}
                            title={crop ? `${speciesEmoji(crop.species)} ${crop.name} (${STATUS_LABELS[crop.status] ?? crop.status}) · H:${crop.health}% W:${crop.hydration}% N:${crop.nutrientLevel}%` : `Empty plot (${x},${y})`}
                          >
                            {/* crop content */}
                            {crop ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                                {/* species emoji */}
                                <span className="text-xl leading-none">{speciesEmoji(crop.species)}</span>

                                {/* crop name */}
                                <span className="text-[10px] leading-tight text-slate-100 font-semibold text-center truncate w-full px-0.5 mt-0.5">
                                  {crop.name.length > 10 ? crop.name.slice(0, 9) + '…' : crop.name}
                                </span>

                                {/* growth stage dots */}
                                <div className="flex items-center gap-[3px] mt-1">
                                  {Array.from({ length: 4 }, (_, d) => (
                                    <span
                                      key={d}
                                      className={`w-1.5 h-1.5 rounded-full ${d < dotCount ? (DOT_COLORS[dotCount] ?? 'bg-slate-500') : 'bg-slate-800/60'}`}
                                    />
                                  ))}
                                </div>

                                {/* health bar */}
                                <div className="w-full px-0.5 mt-1">
                                  <div className="h-1.5 rounded-full bg-slate-900/60 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${crop.health >= 70 ? 'bg-emerald-500' : crop.health >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                      style={{ width: `${crop.health}%` }}
                                    />
                                  </div>
                                </div>

                                {/* hydration + nutrient mini indicators */}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[8px] font-bold text-sky-300/90">{crop.hydration}%💧</span>
                                  <span className="text-[8px] font-bold text-emerald-300/90">🧪{crop.nutrientLevel}%</span>
                                </div>
                              </div>
                            ) : (
                              /* empty plot decorative pattern */
                              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <div className="w-4 h-4 rounded-sm border border-amber-700/40" />
                              </div>
                            )}

                            {/* hover info — badge at the bottom */}
                            {crop && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <p className="text-[8px] text-center text-slate-300 leading-tight font-medium">
                                  ❤️{crop.health} · {speciesEmoji(crop.species)}{crop.status}
                                </p>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* ── legend ── */}
                <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/40 text-xs text-slate-400">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Legend</span>

                  <span className="flex items-center gap-1">
                    <span className="text-sm">🍅</span>
                    <span className="text-[10px] text-slate-500">Crop</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">💧80%</span>
                    <span className="text-[10px] text-slate-500">Hydration</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">🧪60%</span>
                    <span className="text-[10px] text-slate-500">Nutrients</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded border-2 border-amber-800/50" style={{ backgroundColor: soilColor(60) }} />
                    <span>Soil</span>
                  </div>

                  <span className="w-px h-4 bg-slate-700" />

                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span>● Seed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>● Sprout</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>● Growing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>● Mature</span>
                  </div>

                  <span className="w-px h-4 bg-slate-700" />

                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm border-2 border-emerald-500 bg-emerald-500/20" />
                    <span>Healthy ≥70%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm border-2 border-amber-500 bg-amber-500/20" />
                    <span>Warning 40-69%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm border-2 border-red-500 bg-red-500/20" />
                    <span>Error &lt;40%</span>
                  </div>

                  <span className="w-px h-4 bg-slate-700" />

                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="text-xs">🍅🌶️🌾🥕</span>
                    <span>Species</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═════════════════════════════════════
          Garden Settings Modal
          ═════════════════════════════════════ */}
      <Modal
        open={showSettings}
        onOpenChange={setShowSettings}
        title="Garden Settings"
        description={selectedGarden ? `Configure ${selectedGarden.name}` : ''}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="grid-width"
              label="Grid Width"
              type="number"
              min={3}
              max={12}
              value={editGridW}
              onChange={e => setEditGridW(Number(e.target.value))}
            />
            <Input
              id="grid-height"
              label="Grid Height"
              type="number"
              min={3}
              max={12}
              value={editGridH}
              onChange={e => setEditGridH(Number(e.target.value))}
            />
          </div>
          <Select
            id="irrigation-type"
            label="Irrigation Type"
            options={[
              { value: 'DRIP', label: 'Drip' },
              { value: 'SPRINKLER', label: 'Sprinkler' },
              { value: 'FLOOD', label: 'Flood' },
              { value: 'MANUAL', label: 'Manual Watering' },
            ]}
            value={editIrrigationType}
            onChange={e => setEditIrrigationType(e.target.value)}
          />
          <Select
            id="watering-mode"
            label="Watering Mode"
            options={[
              { value: 'MANUAL', label: 'Manual' },
              { value: 'AUTO', label: 'Auto' },
            ]}
            value={editWateringMode}
            onChange={e => setEditWateringMode(e.target.value)}
          />
          {editWateringMode === 'AUTO' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-sm text-cyan-300">
              <span>Auto mode requires a motor pump. Purchase one from the Marketplace via the gamification shop.</span>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowSettings(false)}>Cancel</Button>
          <Button variant="primary" loading={savingSettings} onClick={handleSaveSettings}>
            <Settings className="w-4 h-4" />
            Save Settings
          </Button>
        </ModalFooter>
      </Modal>

      {/* ═════════════════════════════════════
          Crop Detail Modal
          ═════════════════════════════════════ */}
      <Modal
        open={showCropModal}
        onOpenChange={setShowCropModal}
        title={modalCrop?.name ?? 'Crop Details'}
        description={`Plot (${modalCrop?.plotX ?? '?'}, ${modalCrop?.plotY ?? '?'})`}
      >
        {modalCrop && (
          <div className="space-y-4">
            {/* overview row */}
            <div className="flex items-center gap-4">
              <Badge variant={modalCrop.health >= 70 ? 'success' : modalCrop.health >= 40 ? 'warning' : 'error'} dot>
                {modalCrop.health >= 70 ? 'Healthy' : modalCrop.health >= 40 ? 'Warning' : 'Critical'}
              </Badge>
              <Badge variant="info">{STATUS_LABELS[modalCrop.status] ?? modalCrop.status}</Badge>
            </div>

            {/* species */}
            <div className="text-sm text-slate-400">
              <span className="text-slate-500">Species:</span>{' '}
              <span className="text-slate-200">{modalCrop.species || modalCrop.name}</span>
            </div>

            {/* stat bars */}
            <div className="space-y-3">
              {/* Health */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Health</span>
                  <span className={modalCrop.health >= 70 ? 'text-emerald-400' : modalCrop.health >= 40 ? 'text-amber-400' : 'text-red-400'}>
                    {modalCrop.health}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${modalCrop.health >= 70 ? 'bg-emerald-500' : modalCrop.health >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${modalCrop.health}%` }}
                  />
                </div>
              </div>

              {/* Hydration */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Hydration</span>
                  <span className={modalCrop.hydration >= 60 ? 'text-sky-400' : 'text-amber-400'}>{modalCrop.hydration}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${modalCrop.hydration >= 60 ? 'bg-sky-500' : 'bg-amber-500'}`}
                    style={{ width: `${modalCrop.hydration}%` }}
                  />
                </div>
              </div>

              {/* Nutrients */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Nutrients</span>
                  <span className={modalCrop.nutrientLevel >= 60 ? 'text-emerald-400' : modalCrop.nutrientLevel >= 30 ? 'text-amber-400' : 'text-red-400'}>
                    {modalCrop.nutrientLevel}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${modalCrop.nutrientLevel >= 60 ? 'bg-emerald-500' : modalCrop.nutrientLevel >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${modalCrop.nutrientLevel}%` }}
                  />
                </div>
              </div>

              {/* Growth Stage */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Growth Stage</span>
                  <span className="text-slate-200">{STATUS_LABELS[modalCrop.status] ?? modalCrop.status}</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }, (_, i) => (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < stageToDots(modalCrop.status) ? DOT_COLORS[stageToDots(modalCrop.status)] ?? 'bg-slate-500' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* garden info */}
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-500 space-y-1">
              <p>
                <span className="text-slate-400">Garden:</span> {selectedGarden?.name ?? '—'}
                <span className="ml-2 text-slate-600">({selectedGarden?.type ?? '—'})</span>
              </p>
              <p>
                <span className="text-slate-400">Soil Quality:</span> {selectedGarden?.soilQuality ?? '—'}%
                <span className="ml-2 text-slate-400">Irrigation:</span> {selectedGarden?.irrigationLevel ?? '—'}%
              </p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
