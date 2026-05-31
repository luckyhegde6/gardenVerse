'use client'

import { useParams } from 'next/navigation'
import { Sprout, Heart, CalendarDays, Droplets, Wheat, Syringe, FlaskRound } from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'

type CropStage = 'seed' | 'sprouting' | 'growing' | 'mature' | 'harvested' | 'wilted' | 'diseased'

interface CropDetail {
  id: string
  name: string
  species: string
  garden: string
  owner: string
  stage: CropStage
  health: number
  growthProgress: number
  daysToHarvest: number
  waterLevel: number
  plantedDate: string
  lastWatered: string
  fertilized: boolean
  fertilizerType: string | null
  lastFertilized: string | null
  sunlightHours: number
  temperature: number
  soilQuality: number
  notes: string
}

const mockCrops: Record<string, CropDetail> = {
  c1: {
    id: 'c1', name: 'Tomato', species: 'Solanum lycopersicum', garden: "Sarah's Paradise",
    owner: 'sarah@example.com', stage: 'growing', health: 85, growthProgress: 62,
    daysToHarvest: 24, waterLevel: 70, plantedDate: '2026-05-01', lastWatered: '2026-05-28',
    fertilized: true, fertilizerType: 'Organic Compost', lastFertilized: '2026-05-20',
    sunlightHours: 6.5, temperature: 24, soilQuality: 78, notes: 'Looking healthy. Support stakes installed.',
  },
  c2: {
    id: 'c2', name: 'Basil', species: 'Ocimum basilicum', garden: "Sarah's Paradise",
    owner: 'sarah@example.com', stage: 'mature', health: 92, growthProgress: 100,
    daysToHarvest: 0, waterLevel: 85, plantedDate: '2026-04-15', lastWatered: '2026-05-28',
    fertilized: false, fertilizerType: null, lastFertilized: null,
    sunlightHours: 7.0, temperature: 25, soilQuality: 82, notes: 'Ready for harvest. Pinch leaves regularly.',
  },
  c3: {
    id: 'c3', name: 'Lettuce', species: 'Lactuca sativa', garden: 'Urban Farm',
    owner: 'mike@example.com', stage: 'sprouting', health: 60, growthProgress: 25,
    daysToHarvest: 32, waterLevel: 45, plantedDate: '2026-05-20', lastWatered: '2026-05-27',
    fertilized: true, fertilizerType: 'Liquid Seaweed', lastFertilized: '2026-05-25',
    sunlightHours: 4.0, temperature: 20, soilQuality: 55, notes: 'Needs more water and shade.',
  },
  c6: {
    id: 'c6', name: 'Sunflower', species: 'Helianthus annuus', garden: 'Compost Central',
    owner: 'james@example.com', stage: 'seed', health: 100, growthProgress: 5,
    daysToHarvest: 50, waterLevel: 90, plantedDate: '2026-05-25', lastWatered: '2026-05-28',
    fertilized: false, fertilizerType: null, lastFertilized: null,
    sunlightHours: 8.0, temperature: 26, soilQuality: 88, notes: 'Just planted. Keep soil moist.',
  },
  c7: {
    id: 'c7', name: 'Mint', species: 'Mentha spicata', garden: 'Terra Garden',
    owner: 'lisa@example.com', stage: 'mature', health: 45, growthProgress: 100,
    daysToHarvest: 0, waterLevel: 30, plantedDate: '2026-02-15', lastWatered: '2026-05-26',
    fertilized: false, fertilizerType: null, lastFertilized: null,
    sunlightHours: 5.0, temperature: 22, soilQuality: 60, notes: 'Showing signs of disease. Monitor closely.',
  },
  c9: {
    id: 'c9', name: 'Cucumber', species: 'Cucumis sativus', garden: 'Urban Farm',
    owner: 'mike@example.com', stage: 'wilted', health: 20, growthProgress: 45,
    daysToHarvest: 20, waterLevel: 15, plantedDate: '2026-05-05', lastWatered: '2026-05-22',
    fertilized: false, fertilizerType: null, lastFertilized: null,
    sunlightHours: 7.5, temperature: 28, soilQuality: 40, notes: 'Wilting detected. Urgent watering needed.',
  },
}

const stageColors: Record<CropStage, string> = {
  seed: 'text-slate-400',
  sprouting: 'text-sky-400',
  growing: 'text-emerald-400',
  mature: 'text-amber-400',
  harvested: 'text-green-600',
  wilted: 'text-red-400',
  diseased: 'text-red-600',
}

const stageLabels: Record<CropStage, string> = {
  seed: 'Seed',
  sprouting: 'Sprouting',
  growing: 'Growing',
  mature: 'Mature',
  harvested: 'Harvested',
  wilted: 'Wilted',
  diseased: 'Diseased',
}

export default function CropDetailPage() {
  const params = useParams()
  const id = params.id as string
  const crop = mockCrops[id]

  const [waterCount, setWaterCount] = useState(0)
  const [isFertilized, setIsFertilized] = useState(crop?.fertilized ?? false)
  const [isHarvested, setIsHarvested] = useState(crop?.stage === 'harvested')
  const [activeTab, setActiveTab] = useState('overview')

  if (!crop) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Sprout className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Crop Not Found</h2>
        <p className="text-sm text-slate-500">The crop with ID &quot;{id}&quot; does not exist.</p>
      </div>
    )
  }

  const handleWater = () => {
    setWaterCount(prev => prev + 1)
  }

  const handleFertilize = () => {
    setIsFertilized(true)
  }

  const handleHarvest = () => {
    setIsHarvested(true)
  }

  const adjustedWaterLevel = Math.max(0, Math.min(100, crop.waterLevel + waterCount * 10))
  const adjustedHealth = isHarvested ? 100 : crop.health
  const adjustedDays = isHarvested ? 0 : crop.daysToHarvest

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{crop.name}</h1>
              <Badge variant="info">{crop.species}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              In {crop.garden} &middot; Owned by {crop.owner}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium capitalize ${stageColors[crop.stage]}`}>
            Stage: {stageLabels[crop.stage]}
          </span>
          {isHarvested && <Badge variant="success">Harvested</Badge>}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Crop Health"
          value={`${adjustedHealth}%`}
          change={adjustedHealth - 50}
          trend={adjustedHealth >= 50 ? 'up' : 'down'}
          icon={<Heart className="w-6 h-6" />}
        />
        <StatCard
          title="Growth Progress"
          value={`${crop.growthProgress}%`}
          change={crop.growthProgress}
          trend={crop.growthProgress >= 50 ? 'up' : 'down'}
          icon={<Wheat className="w-6 h-6" />}
        />
        <StatCard
          title="Days to Harvest"
          value={adjustedDays}
          icon={<CalendarDays className="w-6 h-6" />}
        />
        <StatCard
          title="Water Level"
          value={`${adjustedWaterLevel}%`}
          change={waterCount > 0 ? waterCount * 10 : undefined}
          trend={adjustedWaterLevel >= 50 ? 'up' : 'down'}
          icon={<Droplets className="w-6 h-6" />}
        />
      </div>

      {/* Tabs */}
      <TabsRoot value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conditions">Growing Conditions</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Crop Information</h3>
              <Badge variant={isHarvested ? 'success' : isFertilized ? 'info' : 'default'}>
                {isHarvested ? 'Harvested' : isFertilized ? 'Fertilized' : 'Unfertilized'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
              <DetailField label="Plant Species" value={crop.species} />
              <DetailField label="Planted Date" value={crop.plantedDate} />
              <DetailField label="Last Watered" value={crop.lastWatered} />
              <DetailField label="Fertilized" value={isFertilized ? 'Yes' : 'No'} />
              {isFertilized && crop.fertilizerType && (
                <DetailField label="Fertilizer Type" value={crop.fertilizerType} />
              )}
              {isFertilized && crop.lastFertilized && (
                <DetailField label="Last Fertilized" value={crop.lastFertilized} />
              )}
              <DetailField label="Garden" value={crop.garden} />
              <DetailField label="Owner" value={crop.owner} />
              <DetailField label="Growth Stage" value={stageLabels[crop.stage]} />
            </div>
          </div>

          {crop.notes && (
            <div className="card mt-4">
              <div className="card-header">
                <h3 className="card-title">Grower Notes</h3>
              </div>
              <p className="text-sm text-slate-400 p-2">{crop.notes}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="conditions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Environmental Conditions</h3>
              </div>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Temperature</span>
                  <span className="text-sm font-medium text-slate-200">{crop.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Sunlight Exposure</span>
                  <span className="text-sm font-medium text-slate-200">{crop.sunlightHours} hrs/day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Soil Quality</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${crop.soilQuality >= 70 ? 'bg-emerald-500' : crop.soilQuality >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${crop.soilQuality}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{crop.soilQuality}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Resource Status</h3>
              </div>
              <div className="space-y-4 p-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-400">Water Level</span>
                    <span className={`text-sm font-medium ${adjustedWaterLevel >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {adjustedWaterLevel}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${adjustedWaterLevel >= 70 ? 'bg-blue-500' : adjustedWaterLevel >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${adjustedWaterLevel}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-400">Growth Progress</span>
                    <span className="text-sm font-medium text-emerald-400">{crop.growthProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${crop.growthProgress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-sm text-slate-400">Fertilizer Status</span>
                  <Badge variant={isFertilized ? 'success' : 'warning'}>
                    {isFertilized ? 'Applied' : 'None'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actions">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Crop Management Actions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-2">
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="rounded-full bg-blue-500/10 p-4 text-blue-400">
                  <Droplets className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-200">Water</p>
                  <p className="text-xs text-slate-500 mt-1">Increase water level by 10%</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleWater}
                  disabled={isHarvested || adjustedWaterLevel >= 100}
                >
                  {waterCount > 0 ? `Water (${waterCount}x)` : 'Water Now'}
                </Button>
                {waterCount > 0 && (
                  <p className="text-xs text-blue-400">+{waterCount * 10}% water applied</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-400">
                  <Syringe className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-200">Fertilize</p>
                  <p className="text-xs text-slate-500 mt-1">Apply organic fertilizer</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFertilize}
                  disabled={isHarvested || isFertilized}
                >
                  {isFertilized ? 'Fertilized ✓' : 'Fertilize'}
                </Button>
                {isFertilized && (
                  <p className="text-xs text-emerald-400">Organic Compost applied</p>
                )}
              </div>

              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="rounded-full bg-amber-500/10 p-4 text-amber-400">
                  <FlaskRound className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-200">Harvest</p>
                  <p className="text-xs text-slate-500 mt-1">Collect ready crops</p>
                </div>
                <Button
                  variant={isHarvested ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={handleHarvest}
                  disabled={isHarvested}
                >
                  {isHarvested ? 'Harvested ✓' : 'Harvest'}
                </Button>
                {isHarvested && (
                  <p className="text-xs text-amber-400">Crop collected</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </TabsRoot>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  )
}
