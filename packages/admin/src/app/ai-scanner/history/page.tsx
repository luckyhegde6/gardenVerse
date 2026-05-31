'use client'

import { Scan, Sprout, Bug, Percent } from 'lucide-react'
import { useState, useMemo } from 'react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { cn } from '@/lib/utils'

type ScanStatus = 'completed' | 'processing' | 'failed'

interface ScanRecord {
  id: string
  plantName: string
  disease: string
  confidence: number
  user: string
  date: string
  status: ScanStatus
  notes?: string
}

const scanHistory: ScanRecord[] = [
  {
    id: 'sh-001',
    plantName: 'Tomato',
    disease: 'None',
    confidence: 96,
    user: 'green_thumb',
    date: '2026-05-29 14:32',
    status: 'completed',
    notes: 'Healthy plant, no issues detected',
  },
  {
    id: 'sh-002',
    plantName: 'Rose',
    disease: 'Black Spot',
    confidence: 88,
    user: 'urban_farmer',
    date: '2026-05-29 12:15',
    status: 'completed',
    notes: 'Moderate infection on lower leaves',
  },
  {
    id: 'sh-003',
    plantName: 'Lavender',
    disease: 'None',
    confidence: 97,
    user: 'botany_king',
    date: '2026-05-28 20:00',
    status: 'completed',
    notes: 'Perfect condition',
  },
  {
    id: 'sh-004',
    plantName: 'Sunflower',
    disease: 'Powdery Mildew',
    confidence: 82,
    user: 'seed_saver',
    date: '2026-05-28 18:45',
    status: 'completed',
    notes: 'Early stage, treat with fungicide',
  },
  {
    id: 'sh-005',
    plantName: 'Mint',
    disease: 'Rust',
    confidence: 79,
    user: 'compost_guru',
    date: '2026-05-28 16:30',
    status: 'completed',
    notes: 'Orange pustules on leaf undersides',
  },
  {
    id: 'sh-006',
    plantName: 'Basil',
    disease: 'None',
    confidence: 98,
    user: 'terra_master',
    date: '2026-05-27 14:00',
    status: 'completed',
    notes: 'Vibrant green, no abnormalities',
  },
  {
    id: 'sh-007',
    plantName: 'Lettuce',
    disease: 'Downy Mildew',
    confidence: 85,
    user: 'harvest_queen',
    date: '2026-05-27 11:20',
    status: 'completed',
    notes: 'Yellow patches on upper leaves',
  },
  {
    id: 'sh-008',
    plantName: 'Cucumber',
    disease: 'Bacterial Wilt',
    confidence: 91,
    user: 'garden_newb',
    date: '2026-05-26 09:45',
    status: 'completed',
    notes: 'Vascular discoloration observed',
  },
  {
    id: 'sh-009',
    plantName: 'Strawberry',
    disease: 'Gray Mold',
    confidence: 76,
    user: 'berry_patch',
    date: '2026-05-25 16:10',
    status: 'completed',
    notes: 'Fuzzy gray growth on fruits',
  },
  {
    id: 'sh-010',
    plantName: 'Pepper',
    disease: 'None',
    confidence: 94,
    user: 'spice_garden',
    date: '2026-05-25 10:30',
    status: 'completed',
    notes: 'Healthy foliage, good color',
  },
  {
    id: 'sh-011',
    plantName: 'Apple',
    disease: 'Apple Scab',
    confidence: 87,
    user: 'orchard_king',
    date: '2026-05-24 15:45',
    status: 'completed',
    notes: 'Olive-green spots on leaves',
  },
  {
    id: 'sh-012',
    plantName: 'Carrot',
    disease: 'None',
    confidence: 99,
    user: 'root_veggie',
    date: '2026-05-24 08:20',
    status: 'completed',
    notes: 'Excellent root development',
  },
  {
    id: 'sh-013',
    plantName: 'Tomato',
    disease: 'Early Blight',
    confidence: 73,
    user: 'green_thumb',
    date: '2026-05-23 13:10',
    status: 'completed',
    notes: 'Target spots on older leaves',
  },
  {
    id: 'sh-014',
    plantName: 'Lavender',
    disease: 'Root Rot',
    confidence: 81,
    user: 'botany_king',
    date: '2026-05-22 09:00',
    status: 'failed',
    notes: 'Image quality too low for accurate diagnosis',
  },
  {
    id: 'sh-015',
    plantName: 'Basil',
    disease: 'None',
    confidence: 95,
    user: 'terra_master',
    date: '2026-05-22 11:30',
    status: 'completed',
    notes: 'Strong growth, no signs of stress',
  },
  {
    id: 'sh-016',
    plantName: 'Sunflower',
    disease: 'None',
    confidence: 93,
    user: 'seed_saver',
    date: '2026-05-21 17:20',
    status: 'completed',
    notes: 'Tall and healthy',
  },
  {
    id: 'sh-017',
    plantName: 'Mint',
    disease: 'None',
    confidence: 97,
    user: 'compost_guru',
    date: '2026-05-20 14:45',
    status: 'completed',
    notes: 'Lush growth, pest-free',
  },
  {
    id: 'sh-018',
    plantName: 'Lettuce',
    disease: 'Aphid Infestation',
    confidence: 84,
    user: 'harvest_queen',
    date: '2026-05-19 10:00',
    status: 'completed',
    notes: 'Colonies on young leaves',
  },
  {
    id: 'sh-019',
    plantName: 'Strawberry',
    disease: 'None',
    confidence: 92,
    user: 'berry_patch',
    date: '2026-05-18 08:35',
    status: 'completed',
    notes: 'Runner propagation successful',
  },
  {
    id: 'sh-020',
    plantName: 'Pepper',
    disease: 'Bacterial Leaf Spot',
    confidence: 71,
    user: 'spice_garden',
    date: '2026-05-17 15:50',
    status: 'completed',
    notes: 'Water-soaked lesions on leaves',
  },
  {
    id: 'sh-021',
    plantName: 'Rose',
    disease: 'None',
    confidence: 90,
    user: 'urban_farmer',
    date: '2026-05-16 12:25',
    status: 'completed',
    notes: 'Blooming well',
  },
  {
    id: 'sh-022',
    plantName: 'Cucumber',
    disease: 'None',
    confidence: 96,
    user: 'garden_newb',
    date: '2026-05-15 09:10',
    status: 'completed',
    notes: 'First successful harvest',
  },
  {
    id: 'sh-023',
    plantName: 'Apple',
    disease: 'Cedar-Apple Rust',
    confidence: 66,
    user: 'orchard_king',
    date: '2026-05-14 16:00',
    status: 'completed',
    notes: 'Bright orange lesions on leaves',
  },
  {
    id: 'sh-024',
    plantName: 'Carrot',
    disease: 'None',
    confidence: 98,
    user: 'root_veggie',
    date: '2026-05-13 07:50',
    status: 'completed',
    notes: 'Consistent growth across bed',
  },
  {
    id: 'sh-025',
    plantName: 'Tomato',
    disease: 'Septoria Leaf Spot',
    confidence: 78,
    user: 'green_thumb',
    date: '2026-05-12 14:20',
    status: 'processing',
    notes: 'Analysis in progress',
  },
  {
    id: 'sh-026',
    plantName: 'Lettuce',
    disease: 'None',
    confidence: 93,
    user: 'harvest_queen',
    date: '2026-05-11 11:15',
    status: 'completed',
    notes: 'Crisp and healthy heads',
  },
  {
    id: 'sh-027',
    plantName: 'Mint',
    disease: 'Verticillium Wilt',
    confidence: 60,
    user: 'compost_guru',
    date: '2026-05-10 13:40',
    status: 'completed',
    notes: 'Wilting despite adequate water',
  },
  {
    id: 'sh-028',
    plantName: 'Lavender',
    disease: 'None',
    confidence: 99,
    user: 'botany_king',
    date: '2026-05-09 10:30',
    status: 'completed',
    notes: 'Premium quality specimen',
  },
  {
    id: 'sh-029',
    plantName: 'Sunflower',
    disease: 'Sclerotinia Rot',
    confidence: 69,
    user: 'seed_saver',
    date: '2026-05-08 16:55',
    status: 'failed',
    notes: 'Scanner error — retry recommended',
  },
  {
    id: 'sh-030',
    plantName: 'Pepper',
    disease: 'None',
    confidence: 91,
    user: 'spice_garden',
    date: '2026-05-07 09:05',
    status: 'completed',
    notes: 'Fruiting abundantly',
  },
]

const uniquePlants = Array.from(new Set(scanHistory.map(s => s.plantName))).length
const diseasesFound = Array.from(new Set(scanHistory.filter(s => s.disease !== 'None').map(s => s.disease))).length
const totalScans = scanHistory.length
const avgConfidence = Math.round(
  scanHistory.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.confidence, 0) /
    Math.max(1, scanHistory.filter(s => s.status === 'completed').length)
)

type FilterStatus = 'all' | ScanStatus

function getConfidenceVariant(confidence: number) {
  if (confidence >= 90) return 'success'
  if (confidence >= 75) return 'info'
  if (confidence >= 60) return 'warning'
  return 'error'
}

function getStatusVariant(status: ScanStatus) {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'info'
    case 'failed': return 'error'
  }
}

export default function ScanHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return scanHistory
    return scanHistory.filter(s => s.status === statusFilter)
  }, [statusFilter])

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Failed', value: 'failed' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Scan History</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete record of all AI-powered plant scans across the platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Scans"
          value={totalScans}
          change={18.3}
          trend="up"
          icon={<Scan className="w-6 h-6" />}
          changeLabel="this month"
        />
        <StatCard
          title="Unique Plants"
          value={uniquePlants}
          change={5.1}
          trend="up"
          icon={<Sprout className="w-6 h-6" />}
          changeLabel="vs last month"
        />
        <StatCard
          title="Diseases Found"
          value={diseasesFound}
          change={-2.4}
          trend="down"
          icon={<Bug className="w-6 h-6" />}
          changeLabel="vs last month"
        />
        <StatCard
          title="Avg Confidence"
          value={`${avgConfidence}%`}
          change={1.2}
          trend="up"
          icon={<Percent className="w-6 h-6" />}
          changeLabel="this month"
        />
      </div>

      {/* Status Filters */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Scan Records</h3>
          <div className="flex items-center gap-2">
            {filterButtons.map(btn => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  statusFilter === btn.value
                    ? 'bg-admin-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'plantName', header: 'Plant Name', sortable: true },
            {
              key: 'disease',
              header: 'Disease Diagnosis',
              sortable: true,
              render: r => {
                const d = r.disease as string
                return d === 'None'
                  ? <span className="text-emerald-400 font-medium">Healthy</span>
                  : <span className="text-red-400">{d}</span>
              },
            },
            {
              key: 'confidence',
              header: 'Confidence',
              sortable: true,
              width: '110px',
              render: r => {
                const c = r.confidence as number
                const s = r.status as ScanStatus
                if (s === 'failed') return <span className="text-slate-500 text-xs">N/A</span>
                if (s === 'processing') return <span className="text-sky-400 text-xs">Pending</span>
                return (
                  <Badge variant={getConfidenceVariant(c)}>
                    {c}%
                  </Badge>
                )
              },
            },
            { key: 'user', header: 'User', sortable: true },
            { key: 'date', header: 'Date', sortable: true },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              width: '120px',
              render: r => {
                const s = r.status as ScanStatus
                return (
                  <Badge variant={getStatusVariant(s)} dot>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Badge>
                )
              },
            },
          ]}
          data={filteredData as unknown as Record<string, unknown>[]}
          keyExtractor={s => String(s.id)}
          searchable
          searchPlaceholder="Search by plant, disease, or user..."
          pageSize={12}
          emptyMessage="No scan records match your filters."
        />
      </div>
    </div>
  )
}
