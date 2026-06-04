'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sprout,
  Leaf,
  Sun,
  FlaskConical,
  UtensilsCrossed,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { StatCard } from '@/components/StatCard'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────

interface PlantSpecies {
  id: string
  commonName: string
  scientificName: string
  family: string | null
  genus: string | null
  species: string | null
  imageUrl: string | null
  description: string | null
  growingDays: number | null
  difficulty: string
  minTemp: number | null
  maxTemp: number | null
  waterNeeds: string
  sunlightNeeds: string
  soilPhMin: number | null
  soilPhMax: number | null
  matureHeightCm: number | null
  spacingCm: number | null
  seasons: string[]
  edible: boolean
  medicinal: boolean
  attractsPollinators: boolean
  isNative: boolean
  tags: string[]
  baseYield: number
  growthTimeHours: number | null
  dataSource: string
  createdAt: string
  updatedAt: string
}

type PlantFormData = Omit<PlantSpecies, 'id' | 'createdAt' | 'updatedAt' | 'dataSource'>

const DEFAULT_FORM: PlantFormData = {
  commonName: '',
  scientificName: '',
  family: '',
  genus: '',
  species: '',
  imageUrl: '',
  description: '',
  growingDays: null,
  difficulty: 'MEDIUM',
  minTemp: null,
  maxTemp: null,
  waterNeeds: 'MODERATE',
  sunlightNeeds: 'FULL_SUN',
  soilPhMin: null,
  soilPhMax: null,
  matureHeightCm: null,
  spacingCm: null,
  seasons: [],
  edible: false,
  medicinal: false,
  attractsPollinators: false,
  isNative: false,
  tags: [],
  baseYield: 1,
  growthTimeHours: null,
}

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All Difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
]

const SEASON_OPTIONS = [
  { value: '', label: 'All Seasons' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
]

const DIFFICULTY_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
}

const WATER_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'HIGH', label: 'High' },
]

const SUNLIGHT_OPTIONS = [
  { value: 'FULL_SUN', label: 'Full Sun' },
  { value: 'PARTIAL_SHADE', label: 'Partial Shade' },
  { value: 'FULL_SHADE', label: 'Full Shade' },
]

const SEASONS_LIST = ['spring', 'summer', 'fall', 'winter'] as const

// ── Page Component ────────────────────────────────────────

export default function PlantsPage() {
  const [plants, setPlants] = useState<PlantSpecies[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [edibleFilter, setEdibleFilter] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlant, setEditingPlant] = useState<PlantSpecies | null>(null)
  const [formData, setFormData] = useState<PlantFormData>({ ...DEFAULT_FORM })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PlantFormData, string>>>({})
  const [saving, setSaving] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalSpecies: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    springCount: 0,
    summerCount: 0,
    fallCount: 0,
    winterCount: 0,
  })

  // ── Fetch Data ──────────────────────────────────────────

  const fetchPlants = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      if (difficultyFilter) params.difficulty = difficultyFilter
      if (seasonFilter) params.season = seasonFilter
      if (edibleFilter) params.edible = edibleFilter

      const res = await api.get('/plants', { params })
      const body = res.data as { data?: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }

      const rawPlants = (body.data as unknown[]) ?? []
      const totalCount = body.total ?? rawPlants.length

      const mapped: PlantSpecies[] = rawPlants.map((p) => {
        const entry = p as Record<string, unknown>
        return {
          id: String(entry.id ?? ''),
          commonName: String(entry.commonName ?? ''),
          scientificName: String(entry.scientificName ?? ''),
          family: entry.family != null ? String(entry.family) : null,
          genus: entry.genus != null ? String(entry.genus) : null,
          species: entry.species != null ? String(entry.species) : null,
          imageUrl: entry.imageUrl != null ? String(entry.imageUrl) : null,
          description: entry.description != null ? String(entry.description) : null,
          growingDays: entry.growingDays != null ? Number(entry.growingDays) : null,
          difficulty: String(entry.difficulty ?? 'MEDIUM'),
          minTemp: entry.minTemp != null ? Number(entry.minTemp) : null,
          maxTemp: entry.maxTemp != null ? Number(entry.maxTemp) : null,
          waterNeeds: String(entry.waterNeeds ?? 'MODERATE'),
          sunlightNeeds: String(entry.sunlightNeeds ?? 'FULL_SUN'),
          soilPhMin: entry.soilPhMin != null ? Number(entry.soilPhMin) : null,
          soilPhMax: entry.soilPhMax != null ? Number(entry.soilPhMax) : null,
          matureHeightCm: entry.matureHeightCm != null ? Number(entry.matureHeightCm) : null,
          spacingCm: entry.spacingCm != null ? Number(entry.spacingCm) : null,
          seasons: Array.isArray(entry.seasons) ? entry.seasons.map(String) : [],
          edible: Boolean(entry.edible),
          medicinal: Boolean(entry.medicinal),
          attractsPollinators: Boolean(entry.attractsPollinators),
          isNative: Boolean(entry.isNative),
          tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
          baseYield: entry.baseYield != null ? Number(entry.baseYield) : 1,
          growthTimeHours: entry.growthTimeHours != null ? Number(entry.growthTimeHours) : null,
          dataSource: String(entry.dataSource ?? ''),
          createdAt: String(entry.createdAt ?? ''),
          updatedAt: String(entry.updatedAt ?? ''),
        }
      })

      setPlants(mapped)
      setTotal(totalCount)

      // Compute stats from all fetched data
      setStats({
        totalSpecies: totalCount,
        easyCount: mapped.filter((p) => p.difficulty === 'EASY').length,
        mediumCount: mapped.filter((p) => p.difficulty === 'MEDIUM').length,
        hardCount: mapped.filter((p) => p.difficulty === 'HARD').length,
        springCount: mapped.filter((p) => p.seasons.includes('spring')).length,
        summerCount: mapped.filter((p) => p.seasons.includes('summer')).length,
        fallCount: mapped.filter((p) => p.seasons.includes('fall')).length,
        winterCount: mapped.filter((p) => p.seasons.includes('winter')).length,
      })
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Failed to load plants: ${(err as { response: { status: number } }).response?.status ?? 'Unknown error'}`
          : 'Failed to load plants. The server may be unavailable.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, difficultyFilter, seasonFilter, edibleFilter])

  useEffect(() => {
    fetchPlants()
  }, [fetchPlants])

  // ── Modal Handlers ──────────────────────────────────────

  const openCreateModal = () => {
    setEditingPlant(null)
    setFormData({ ...DEFAULT_FORM })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEditModal = (plant: PlantSpecies) => {
    setEditingPlant(plant)
    setFormData({
      commonName: plant.commonName,
      scientificName: plant.scientificName,
      family: plant.family ?? '',
      genus: plant.genus ?? '',
      species: plant.species ?? '',
      imageUrl: plant.imageUrl ?? '',
      description: plant.description ?? '',
      growingDays: plant.growingDays,
      difficulty: plant.difficulty,
      minTemp: plant.minTemp,
      maxTemp: plant.maxTemp,
      waterNeeds: plant.waterNeeds,
      sunlightNeeds: plant.sunlightNeeds,
      soilPhMin: plant.soilPhMin,
      soilPhMax: plant.soilPhMax,
      matureHeightCm: plant.matureHeightCm,
      spacingCm: plant.spacingCm,
      seasons: [...plant.seasons],
      edible: plant.edible,
      medicinal: plant.medicinal,
      attractsPollinators: plant.attractsPollinators,
      isNative: plant.isNative,
      tags: [...plant.tags],
      baseYield: plant.baseYield,
      growthTimeHours: plant.growthTimeHours,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPlant(null)
    setFormData({ ...DEFAULT_FORM })
    setFormErrors({})
  }

  // ── Form Validation ─────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PlantFormData, string>> = {}

    if (!formData.commonName.trim()) {
      errors.commonName = 'Common name is required'
    }
    if (!formData.scientificName.trim()) {
      errors.scientificName = 'Scientific name is required'
    }
    if (!formData.difficulty) {
      errors.difficulty = 'Difficulty is required'
    }
    if (!formData.waterNeeds) {
      errors.waterNeeds = 'Water needs is required'
    }
    if (!formData.sunlightNeeds) {
      errors.sunlightNeeds = 'Sunlight needs is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Save ─────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        commonName: formData.commonName.trim(),
        scientificName: formData.scientificName.trim(),
        family: formData.family?.trim() || undefined,
        genus: formData.genus?.trim() || undefined,
        species: formData.species?.trim() || undefined,
        imageUrl: formData.imageUrl?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        growingDays: formData.growingDays ?? undefined,
        difficulty: formData.difficulty,
        minTemp: formData.minTemp ?? undefined,
        maxTemp: formData.maxTemp ?? undefined,
        waterNeeds: formData.waterNeeds,
        sunlightNeeds: formData.sunlightNeeds,
        soilPhMin: formData.soilPhMin ?? undefined,
        soilPhMax: formData.soilPhMax ?? undefined,
        matureHeightCm: formData.matureHeightCm ?? undefined,
        spacingCm: formData.spacingCm ?? undefined,
        seasons: formData.seasons,
        edible: formData.edible,
        medicinal: formData.medicinal,
        attractsPollinators: formData.attractsPollinators,
        isNative: formData.isNative,
        tags: formData.tags,
        baseYield: formData.baseYield,
        growthTimeHours: formData.growthTimeHours ?? undefined,
      }

      if (editingPlant) {
        await api.put(`/plants/${editingPlant.id}`, payload)
      } else {
        await api.post('/plants', payload)
      }

      closeModal()
      fetchPlants()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response: { data?: { message?: string } } }).response?.data?.message ?? 'Save failed')
          : 'Save failed. Please try again.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Form Field Helpers ──────────────────────────────────

  const updateField = <K extends keyof PlantFormData>(key: K, value: PlantFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
    }
  }

  const toggleSeason = (season: string) => {
    setFormData((prev) => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter((s) => s !== season)
        : [...prev.seasons, season],
    }))
  }

  // ── Reset Filters ───────────────────────────────────────

  const clearFilters = () => {
    setSearchQuery('')
    setDifficultyFilter('')
    setSeasonFilter('')
    setEdibleFilter('')
    setPage(1)
  }

  const hasActiveFilters = searchQuery || difficultyFilter || seasonFilter || edibleFilter

  // ── Render ──────────────────────────────────────────────

  if (isLoading && plants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading plants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchPlants}>
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Species"
          value={stats.totalSpecies}
          icon={<Sprout className="w-6 h-6" />}
        />
        <StatCard
          title="Easy / Medium / Hard"
          value={`${stats.easyCount} / ${stats.mediumCount} / ${stats.hardCount}`}
          icon={<FlaskConical className="w-6 h-6" />}
        />
        <StatCard
          title="Edible Species"
          value={plants.filter((p) => p.edible).length}
          icon={<UtensilsCrossed className="w-6 h-6" />}
        />
        <StatCard
          title="Season Coverage"
          value={`${stats.springCount} spr · ${stats.summerCount} sum · ${stats.fallCount} fal · ${stats.winterCount} win`}
          icon={<Sun className="w-6 h-6" />}
        />
      </div>

      {/* Toolbar: Search + Filters + Add Button */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name, family..."
              className="input-field pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Difficulty filter */}
          <Select
            options={DIFFICULTY_OPTIONS}
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value)
              setPage(1)
            }}
            className="w-full sm:w-[160px]"
          />

          {/* Season filter */}
          <Select
            options={SEASON_OPTIONS}
            value={seasonFilter}
            onChange={(e) => {
              setSeasonFilter(e.target.value)
              setPage(1)
            }}
            className="w-full sm:w-[160px]"
          />

          {/* Edible filter */}
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'true', label: 'Edible Only' },
              { value: 'false', label: 'Non-Edible' },
            ]}
            value={edibleFilter}
            onChange={(e) => {
              setEdibleFilter(e.target.value)
              setPage(1)
            }}
            className="w-full sm:w-[140px]"
          />

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}

          {/* Add Plant */}
          <Button onClick={openCreateModal} className="shrink-0 ml-auto">
            <Plus className="w-4 h-4" />
            Add Plant
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Plant Species Catalog</h3>
          <Badge variant="info">{total}</Badge>
        </div>
        {plants.length > 0 ? (
          <DataTable
            columns={[
              {
                key: 'commonName',
                header: 'Common Name',
                sortable: true,
                render: (r) => (
                  <div className="flex items-center gap-2.5">
                    {(r.imageUrl as string) ? (
                      <img
                        src={r.imageUrl as string}
                        alt={r.commonName as string}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <Sprout className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {r.commonName as string}
                      </p>
                      <p className="text-xs text-slate-500 italic">
                        {r.scientificName as string}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'family',
                header: 'Family',
                sortable: true,
                render: (r) => (
                  <span className="text-sm text-slate-400">
                    {r.family ? String(r.family) : '—'}
                  </span>
                ),
              },
              {
                key: 'difficulty',
                header: 'Difficulty',
                sortable: true,
                width: '100px',
                render: (r) => {
                  const d = String(r.difficulty)
                  return (
                    <Badge variant={DIFFICULTY_BADGE[d] ?? 'default'}>
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </Badge>
                  )
                },
              },
              {
                key: 'seasons',
                header: 'Seasons',
                sortable: false,
                width: '140px',
                render: (r) => {
                  const seasons = r.seasons as string[]
                  return (
                    <div className="flex gap-1 flex-wrap">
                      {SEASONS_LIST.map((s) => (
                        <span
                          key={s}
                          className={`inline-block w-2 h-2 rounded-full ${
                            seasons.includes(s)
                              ? s === 'spring'
                                ? 'bg-green-400'
                                : s === 'summer'
                                  ? 'bg-amber-400'
                                  : s === 'fall'
                                    ? 'bg-orange-400'
                                    : 'bg-sky-400'
                              : 'bg-slate-700'
                          }`}
                          title={s.charAt(0).toUpperCase() + s.slice(1)}
                        />
                      ))}
                    </div>
                  )
                },
              },
              {
                key: 'edible',
                header: 'Edible',
                sortable: true,
                width: '80px',
                render: (r) =>
                  r.edible ? (
                    <Badge variant="success">Yes</Badge>
                  ) : (
                    <Badge variant="default">No</Badge>
                  ),
              },
              {
                key: 'growingDays',
                header: 'Days',
                sortable: true,
                width: '70px',
                render: (r) => (
                  <span className="text-sm text-slate-400">
                    {r.growingDays != null ? String(r.growingDays) : '—'}
                  </span>
                ),
              },
              {
                key: 'medicinal',
                header: 'Medicinal',
                sortable: true,
                width: '90px',
                render: (r) =>
                  r.medicinal ? (
                    <Badge variant="info">Yes</Badge>
                  ) : (
                    <Badge variant="default">No</Badge>
                  ),
              },
            ]}
            data={plants as unknown as Record<string, unknown>[]}
            keyExtractor={(item) => String(item.id)}
            searchable={false}
            onRowClick={(r) => {
              const plant = plants.find((p) => p.id === r.id)
              if (plant) openEditModal(plant)
            }}
            pageSize={20}
            emptyMessage="No plants match your filters. Try adjusting your search criteria."
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-800/50 p-4 mb-4">
              <Sprout className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-1">No Plants Found</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {hasActiveFilters
                ? 'No plants match your current filters. Try broadening your search.'
                : 'Get started by adding your first plant species to the catalog.'}
            </p>
            {!hasActiveFilters && (
              <Button onClick={openCreateModal} className="mt-4">
                <Plus className="w-4 h-4" />
                Add Plant
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={(o) => {
          if (!o) closeModal()
        }}
        title={editingPlant ? `Edit: ${editingPlant.commonName}` : 'Create New Plant'}
        description={
          editingPlant
            ? `Editing ${editingPlant.scientificName}`
            : 'Add a new plant species to the catalog'
        }
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="space-y-5">
          {/* Basic Info */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Common Name *"
                id="commonName"
                value={formData.commonName}
                onChange={(e) => updateField('commonName', e.target.value)}
                error={formErrors.commonName}
                placeholder="e.g. Tomato"
              />
              <Input
                label="Scientific Name *"
                id="scientificName"
                value={formData.scientificName}
                onChange={(e) => updateField('scientificName', e.target.value)}
                error={formErrors.scientificName}
                placeholder="e.g. Solanum lycopersicum"
              />
              <Input
                label="Family"
                id="family"
                value={formData.family ?? ''}
                onChange={(e) => updateField('family', e.target.value)}
                placeholder="e.g. Solanaceae"
              />
              <Input
                label="Genus"
                id="genus"
                value={formData.genus ?? ''}
                onChange={(e) => updateField('genus', e.target.value)}
                placeholder="e.g. Solanum"
              />
              <Input
                label="Species"
                id="species"
                value={formData.species ?? ''}
                onChange={(e) => updateField('species', e.target.value)}
                placeholder="e.g. lycopersicum"
              />
              <Input
                label="Image URL"
                id="imageUrl"
                value={formData.imageUrl ?? ''}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description ?? ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500 resize-none"
              placeholder="Describe the plant..."
            />
          </div>

          {/* Growing Conditions */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Growing Conditions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Difficulty *"
                id="difficulty"
                options={[
                  { value: 'EASY', label: 'Easy' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HARD', label: 'Hard' },
                ]}
                value={formData.difficulty}
                onChange={(e) => updateField('difficulty', e.target.value)}
                error={formErrors.difficulty}
              />
              <Select
                label="Water Needs *"
                id="waterNeeds"
                options={WATER_OPTIONS}
                value={formData.waterNeeds}
                onChange={(e) => updateField('waterNeeds', e.target.value)}
                error={formErrors.waterNeeds}
              />
              <Select
                label="Sunlight Needs *"
                id="sunlightNeeds"
                options={SUNLIGHT_OPTIONS}
                value={formData.sunlightNeeds}
                onChange={(e) => updateField('sunlightNeeds', e.target.value)}
                error={formErrors.sunlightNeeds}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Input
                label="Growing Days"
                id="growingDays"
                type="number"
                value={formData.growingDays ?? ''}
                onChange={(e) =>
                  updateField('growingDays', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 75"
              />
              <Input
                label="Growth Time (hours)"
                id="growthTimeHours"
                type="number"
                value={formData.growthTimeHours ?? ''}
                onChange={(e) =>
                  updateField(
                    'growthTimeHours',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="e.g. 48"
              />
              <Input
                label="Base Yield"
                id="baseYield"
                type="number"
                value={formData.baseYield}
                onChange={(e) => updateField('baseYield', Number(e.target.value))}
                placeholder="1"
              />
            </div>
          </div>

          {/* Temperature & Soil */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Temperature &amp; Soil
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Min Temp (°C)"
                id="minTemp"
                type="number"
                step="0.1"
                value={formData.minTemp ?? ''}
                onChange={(e) =>
                  updateField('minTemp', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 10"
              />
              <Input
                label="Max Temp (°C)"
                id="maxTemp"
                type="number"
                step="0.1"
                value={formData.maxTemp ?? ''}
                onChange={(e) =>
                  updateField('maxTemp', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 35"
              />
              <Input
                label="Soil pH Min"
                id="soilPhMin"
                type="number"
                step="0.1"
                value={formData.soilPhMin ?? ''}
                onChange={(e) =>
                  updateField('soilPhMin', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 6.0"
              />
              <Input
                label="Soil pH Max"
                id="soilPhMax"
                type="number"
                step="0.1"
                value={formData.soilPhMax ?? ''}
                onChange={(e) =>
                  updateField('soilPhMax', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 7.5"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Mature Height (cm)"
                id="matureHeightCm"
                type="number"
                value={formData.matureHeightCm ?? ''}
                onChange={(e) =>
                  updateField(
                    'matureHeightCm',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="e.g. 120"
              />
              <Input
                label="Spacing (cm)"
                id="spacingCm"
                type="number"
                value={formData.spacingCm ?? ''}
                onChange={(e) =>
                  updateField('spacingCm', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 45"
              />
            </div>
          </div>

          {/* Seasons */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Seasons
            </label>
            <div className="flex gap-4">
              {SEASONS_LIST.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.seasons.includes(s)}
                    onChange={() => toggleSeason(s)}
                    className="rounded border-slate-600 bg-slate-800 text-admin-500 focus:ring-admin-500"
                  />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Attributes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {([
                ['edible', 'Edible'],
                ['medicinal', 'Medicinal'],
                ['attractsPollinators', 'Attracts Pollinators'],
                ['isNative', 'Native'],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData[key] as boolean}
                    onChange={(e) => updateField(key, e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-admin-500 focus:ring-admin-500"
                  />
                  <span className="flex items-center gap-1.5">
                    {key === 'edible' && <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />}
                    {key === 'medicinal' && <FlaskConical className="w-3.5 h-3.5 text-purple-400" />}
                    {key === 'attractsPollinators' && <Leaf className="w-3.5 h-3.5 text-amber-400" />}
                    {key === 'isNative' && <Sprout className="w-3.5 h-3.5 text-green-400" />}
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <Input
            label="Tags (comma-separated)"
            id="tags"
            value={formData.tags.join(', ')}
            onChange={(e) =>
              updateField(
                'tags',
                e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
            placeholder="e.g. annual, vegetable, container-friendly"
          />
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {editingPlant ? 'Update Plant' : 'Create Plant'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
