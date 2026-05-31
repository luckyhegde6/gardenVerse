'use client'

import { Sprout, TreePine, CalendarDays, Thermometer } from 'lucide-react'
import { useState } from 'react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'

type Difficulty = 'easy' | 'moderate' | 'hard'
type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all'

interface PlantSpecies {
  id: string
  name: string
  scientificName: string
  growingDays: number
  difficulty: Difficulty
  season: Season[]
  wateringNeeds: 'low' | 'medium' | 'high'
  sunlightNeeds: 'shade' | 'partial' | 'full'
  yieldEstimate: string
  plantedCount: number
}

const mockPlants: PlantSpecies[] = [
  { id: 'p1', name: 'Tomato', scientificName: 'Solanum lycopersicum', growingDays: 65, difficulty: 'moderate', season: ['spring', 'summer'], wateringNeeds: 'medium', sunlightNeeds: 'full', yieldEstimate: '10-15 lbs/plant', plantedCount: 1240 },
  { id: 'p2', name: 'Basil', scientificName: 'Ocimum basilicum', growingDays: 25, difficulty: 'easy', season: ['spring', 'summer'], wateringNeeds: 'medium', sunlightNeeds: 'full', yieldEstimate: '1-2 lbs/plant', plantedCount: 890 },
  { id: 'p3', name: 'Lettuce', scientificName: 'Lactuca sativa', growingDays: 45, difficulty: 'easy', season: ['spring', 'autumn'], wateringNeeds: 'high', sunlightNeeds: 'partial', yieldEstimate: '1-2 lbs/plant', plantedCount: 675 },
  { id: 'p4', name: 'Carrot', scientificName: 'Daucus carota', growingDays: 70, difficulty: 'moderate', season: ['spring', 'autumn'], wateringNeeds: 'medium', sunlightNeeds: 'full', yieldEstimate: '5-10 lbs/plant', plantedCount: 540 },
  { id: 'p5', name: 'Sunflower', scientificName: 'Helianthus annuus', growingDays: 55, difficulty: 'easy', season: ['summer'], wateringNeeds: 'low', sunlightNeeds: 'full', yieldEstimate: 'N/A (ornamental)', plantedCount: 410 },
  { id: 'p6', name: 'Wheat', scientificName: 'Triticum aestivum', growingDays: 110, difficulty: 'moderate', season: ['spring', 'autumn'], wateringNeeds: 'medium', sunlightNeeds: 'full', yieldEstimate: '40-50 bu/acre', plantedCount: 320 },
  { id: 'p7', name: 'Lavender', scientificName: 'Lavandula angustifolia', growingDays: 90, difficulty: 'hard', season: ['spring', 'summer'], wateringNeeds: 'low', sunlightNeeds: 'full', yieldEstimate: '2-3 lbs/plant', plantedCount: 280 },
  { id: 'p8', name: 'Mint', scientificName: 'Mentha spicata', growingDays: 30, difficulty: 'easy', season: ['spring', 'summer', 'autumn'], wateringNeeds: 'high', sunlightNeeds: 'partial', yieldEstimate: '2-3 lbs/plant', plantedCount: 560 },
  { id: 'p9', name: 'Cucumber', scientificName: 'Cucumis sativus', growingDays: 55, difficulty: 'moderate', season: ['summer'], wateringNeeds: 'high', sunlightNeeds: 'full', yieldEstimate: '5-10 lbs/plant', plantedCount: 440 },
  { id: 'p10', name: 'Rose', scientificName: 'Rosa gallica', growingDays: 120, difficulty: 'hard', season: ['spring', 'summer', 'autumn'], wateringNeeds: 'medium', sunlightNeeds: 'full', yieldEstimate: 'N/A (ornamental)', plantedCount: 190 },
  { id: 'p11', name: 'Spinach', scientificName: 'Spinacia oleracea', growingDays: 35, difficulty: 'easy', season: ['spring', 'autumn', 'winter'], wateringNeeds: 'medium', sunlightNeeds: 'partial', yieldEstimate: '2-4 lbs/plant', plantedCount: 380 },
  { id: 'p12', name: 'Bell Pepper', scientificName: 'Capsicum annuum', growingDays: 75, difficulty: 'moderate', season: ['summer'], wateringNeeds: 'medium', sunlightNeeds: 'full', yieldEstimate: '5-8 lbs/plant', plantedCount: 290 },
  { id: 'p13', name: 'Garlic', scientificName: 'Allium sativum', growingDays: 180, difficulty: 'easy', season: ['autumn', 'winter'], wateringNeeds: 'low', sunlightNeeds: 'full', yieldEstimate: '0.5-1 lb/plant', plantedCount: 250 },
  { id: 'p14', name: 'Strawberry', scientificName: 'Fragaria × ananassa', growingDays: 60, difficulty: 'moderate', season: ['spring', 'summer', 'autumn'], wateringNeeds: 'medium', sunlightNeeds: 'full', yieldEstimate: '1-2 lbs/plant', plantedCount: 510 },
]

const difficultyBadge: Record<Difficulty, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  moderate: 'warning',
  hard: 'error',
}

const difficultyLabel: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
}

const wateringIcons: Record<string, string> = {
  low: '💧',
  medium: '💧💧',
  high: '💧💧💧',
}

export default function PlantSelectionPage() {
  const [plantedIds, setPlantedIds] = useState<Set<string>>(new Set())

  const totalVarieties = mockPlants.length
  const easyCount = mockPlants.filter(p => p.difficulty === 'easy').length
  const totalPlanted = mockPlants.reduce((sum, p) => sum + p.plantedCount, 0)
  const avgGrowingDays = Math.round(mockPlants.reduce((sum, p) => sum + p.growingDays, 0) / totalVarieties)

  const handlePlant = (plant: PlantSpecies) => {
    setPlantedIds(prev => {
      const next = new Set(prev)
      if (next.has(plant.id)) {
        next.delete(plant.id)
      } else {
        next.add(plant.id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Plant Varieties"
          value={totalVarieties}
          icon={<TreePine className="w-6 h-6" />}
        />
        <StatCard
          title="Easy to Grow"
          value={easyCount}
          change={Math.round((easyCount / totalVarieties) * 100)}
          trend="up"
          changeLabel="of all varieties"
          icon={<Sprout className="w-6 h-6" />}
        />
        <StatCard
          title="Total Planted"
          value={totalPlanted}
          icon={<CalendarDays className="w-6 h-6" />}
        />
        <StatCard
          title="Avg. Growing Days"
          value={avgGrowingDays}
          icon={<Thermometer className="w-6 h-6" />}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Available Plant Species</h3>
          <Badge variant="info">{totalVarieties} varieties</Badge>
        </div>
        <DataTable
          columns={[
            { key: 'name', header: 'Name', sortable: true, render: r => {
              const plant = r as unknown as PlantSpecies
              return (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">{plant.name}</span>
                  <span className="text-xs text-slate-500 italic">{plant.scientificName}</span>
                </div>
              )
            }},
            { key: 'growingDays', header: 'Growing Days', sortable: true, width: '110px', render: r => {
              const v = r.growingDays as number
              return (
                <span className={v <= 45 ? 'text-emerald-400' : v <= 90 ? 'text-amber-400' : 'text-red-400'}>
                  {v} days
                </span>
              )
            }},
            { key: 'difficulty', header: 'Difficulty', sortable: true, width: '100px', render: r => {
              const d = r.difficulty as Difficulty
              return <Badge variant={difficultyBadge[d]}>{difficultyLabel[d]}</Badge>
            }},
            { key: 'season', header: 'Season', sortable: true, width: '140px', render: r => {
              const seasons = r.season as Season[]
              return (
                <div className="flex gap-1 flex-wrap">
                  {seasons.map(s => (
                    <Badge key={s} variant={s === 'all' ? 'default' : 'info'}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>
                  ))}
                </div>
              )
            }},
            { key: 'wateringNeeds', header: 'Water', sortable: true, width: '80px' },
            { key: 'sunlightNeeds', header: 'Sunlight', sortable: true, width: '80px' },
            { key: 'plantedCount', header: 'Planted', sortable: true, width: '80px' },
            { key: 'id', header: 'Action', width: '100px', render: r => {
              const plant = r as unknown as PlantSpecies
              const isPlanted = plantedIds.has(plant.id)
              return (
                <Button
                  variant={isPlanted ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handlePlant(plant)}
                >
                  {isPlanted ? 'Remove' : 'Plant'}
                </Button>
              )
            }},
          ]}
          data={mockPlants as unknown as Record<string, unknown>[]}
          keyExtractor={p => String(p.id)}
          searchable
          searchPlaceholder="Search plant species..."
          pageSize={10}
        />
      </div>

      {plantedIds.size > 0 && (
        <div className="card border-emerald-700/60">
          <div className="card-header">
            <h3 className="card-title">Selected for Planting</h3>
            <Badge variant="success">{plantedIds.size} plants</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {mockPlants
              .filter(p => plantedIds.has(p.id))
              .map(plant => (
                <div
                  key={plant.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/50"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-200">{plant.name}</span>
                    <span className="text-xs text-slate-500">
                      {plant.growingDays} days &middot; {wateringIcons[plant.wateringNeeds]}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handlePlant(plant)}>
                    Remove
                  </Button>
                </div>
              ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" size="md">
              Confirm Planting ({plantedIds.size})
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
