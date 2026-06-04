'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Sprout,
  Zap,
  Award,
  Star,
  TrendingUp,
  Leaf,
  Flower2,
  Trees,
  Search,
  Loader2,
  AlertCircle,
  BarChart3,
  FlaskConical,
  Wheat,
  LogIn,
  Droplets,
  BookOpen,
  Combine,
  Swords,
  ShoppingBag,
  Plus,
  Edit2,
  Package,
  Store,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Chart } from '@/components/Chart'
import { Button } from '@/components/Button'
import { Select } from '@/components/Select'
import { Input } from '@/components/Input'
import { Modal, ModalFooter } from '@/components/Modal'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Achievement, ShopItem } from '@/lib/api'

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const TOTAL_SPECIES_AVAILABLE = 31

const MOCK_SPECIES_COLLECTION = [
  { icon: '🍅', commonName: 'Tomato', scientificName: 'Solanum lycopersicum', family: 'Solanaceae', difficulty: 'EASY', season: 'Summer', category: 'Vegetable', plantedCount: 24, harvestedCount: 18, discoveredAt: '2026-04-12' },
  { icon: '🌿', commonName: 'Basil', scientificName: 'Ocimum basilicum', family: 'Lamiaceae', difficulty: 'EASY', season: 'Summer', category: 'Herb', plantedCount: 15, harvestedCount: 12, discoveredAt: '2026-04-15' },
  { icon: '🌻', commonName: 'Sunflower', scientificName: 'Helianthus annuus', family: 'Asteraceae', difficulty: 'EASY', season: 'Summer', category: 'Flower', plantedCount: 8, harvestedCount: 5, discoveredAt: '2026-04-20' },
  { icon: '🍓', commonName: 'Strawberry', scientificName: 'Fragaria × ananassa', family: 'Rosaceae', difficulty: 'MEDIUM', season: 'Spring', category: 'Fruit', plantedCount: 4, harvestedCount: 2, discoveredAt: '2026-05-01' },
  { icon: '🥕', commonName: 'Carrot', scientificName: 'Daucus carota', family: 'Apiaceae', difficulty: 'EASY', season: 'Spring', category: 'Vegetable', plantedCount: 12, harvestedCount: 10, discoveredAt: '2026-04-18' },
  { icon: '🫐', commonName: 'Blueberry', scientificName: 'Vaccinium corymbosum', family: 'Ericaceae', difficulty: 'HARD', season: 'Summer', category: 'Fruit', plantedCount: 2, harvestedCount: 1, discoveredAt: '2026-05-10' },
  { icon: '🌶️', commonName: 'Bell Pepper', scientificName: 'Capsicum annuum', family: 'Solanaceae', difficulty: 'MEDIUM', season: 'Summer', category: 'Vegetable', plantedCount: 6, harvestedCount: 4, discoveredAt: '2026-04-25' },
  { icon: '🥬', commonName: 'Lettuce', scientificName: 'Lactuca sativa', family: 'Asteraceae', difficulty: 'EASY', season: 'Spring', category: 'Vegetable', plantedCount: 10, harvestedCount: 8, discoveredAt: '2026-04-14' },
  { icon: '🌽', commonName: 'Corn', scientificName: 'Zea mays', family: 'Poaceae', difficulty: 'MEDIUM', season: 'Summer', category: 'Vegetable', plantedCount: 3, harvestedCount: 2, discoveredAt: '2026-05-05' },
  { icon: '🧅', commonName: 'Green Onion', scientificName: 'Allium fistulosum', family: 'Amaryllidaceae', difficulty: 'EASY', season: 'Spring', category: 'Vegetable', plantedCount: 7, harvestedCount: 6, discoveredAt: '2026-04-22' },
  { icon: '🌱', commonName: 'Mint', scientificName: 'Mentha spicata', family: 'Lamiaceae', difficulty: 'EASY', season: 'Summer', category: 'Herb', plantedCount: 5, harvestedCount: 3, discoveredAt: '2026-05-08' },
  { icon: '🌺', commonName: 'Lavender', scientificName: 'Lavandula angustifolia', family: 'Lamiaceae', difficulty: 'MEDIUM', season: 'Spring', category: 'Flower', plantedCount: 1, harvestedCount: 0, discoveredAt: '2026-05-15' },
]

const MOCK_UNDISCOVERED_SPECIES = [
  { icon: '🥦', commonName: 'Broccoli', scientificName: 'Brassica oleracea', family: 'Brassicaceae', difficulty: 'MEDIUM', season: 'Fall', category: 'Vegetable' },
  { icon: '🍆', commonName: 'Eggplant', scientificName: 'Solanum melongena', family: 'Solanaceae', difficulty: 'MEDIUM', season: 'Summer', category: 'Vegetable' },
  { icon: '🫑', commonName: 'Jalapeño', scientificName: 'Capsicum annuum', family: 'Solanaceae', difficulty: 'HARD', season: 'Summer', category: 'Vegetable' },
  { icon: '🥒', commonName: 'Cucumber', scientificName: 'Cucumis sativus', family: 'Cucurbitaceae', difficulty: 'EASY', season: 'Summer', category: 'Vegetable' },
  { icon: '🍉', commonName: 'Watermelon', scientificName: 'Citrullus lanatus', family: 'Cucurbitaceae', difficulty: 'HARD', season: 'Summer', category: 'Fruit' },
  { icon: '🥭', commonName: 'Mango', scientificName: 'Mangifera indica', family: 'Anacardiaceae', difficulty: 'HARD', season: 'Summer', category: 'Fruit' },
  { icon: '🍑', commonName: 'Peach', scientificName: 'Prunus persica', family: 'Rosaceae', difficulty: 'HARD', season: 'Summer', category: 'Fruit' },
  { icon: '🌹', commonName: 'Rose', scientificName: 'Rosa rubiginosa', family: 'Rosaceae', difficulty: 'HARD', season: 'Spring', category: 'Flower' },
  { icon: '🌲', commonName: 'Pine', scientificName: 'Pinus sylvestris', family: 'Pinaceae', difficulty: 'HARD', season: 'Winter', category: 'Tree' },
  { icon: '🍋', commonName: 'Lemon', scientificName: 'Citrus limon', family: 'Rutaceae', difficulty: 'HARD', season: 'Winter', category: 'Fruit' },
  { icon: '🍊', commonName: 'Orange', scientificName: 'Citrus × sinensis', family: 'Rutaceae', difficulty: 'HARD', season: 'Winter', category: 'Fruit' },
  { icon: '🌾', commonName: 'Wheat', scientificName: 'Triticum aestivum', family: 'Poaceae', difficulty: 'EASY', season: 'Spring', category: 'Grain' },
  { icon: '🍠', commonName: 'Sweet Potato', scientificName: 'Ipomoea batatas', family: 'Convolvulaceae', difficulty: 'MEDIUM', season: 'Summer', category: 'Vegetable' },
  { icon: '🧄', commonName: 'Garlic', scientificName: 'Allium sativum', family: 'Amaryllidaceae', difficulty: 'EASY', season: 'Fall', category: 'Vegetable' },
  { icon: '🥜', commonName: 'Peanut', scientificName: 'Arachis hypogaea', family: 'Fabaceae', difficulty: 'MEDIUM', season: 'Summer', category: 'Legume' },
  { icon: '🫘', commonName: 'Soybean', scientificName: 'Glycine max', family: 'Fabaceae', difficulty: 'MEDIUM', season: 'Summer', category: 'Legume' },
  { icon: '🌳', commonName: 'Oak', scientificName: 'Quercus robur', family: 'Fagaceae', difficulty: 'HARD', season: 'Fall', category: 'Tree' },
  { icon: '🍄', commonName: 'Mushroom', scientificName: 'Agaricus bisporus', family: 'Agaricaceae', difficulty: 'HARD', season: 'Fall', category: 'Fungus' },
  { icon: '🌿', commonName: 'Rosemary', scientificName: 'Salvia rosmarinus', family: 'Lamiaceae', difficulty: 'MEDIUM', season: 'Spring', category: 'Herb' },
]

const ALL_PLANT_SPECIES = [
  ...MOCK_SPECIES_COLLECTION.map(s => ({ ...s, discovered: true })),
  ...MOCK_UNDISCOVERED_SPECIES.map(s => ({ ...s, plantedCount: 0, harvestedCount: 0, discoveredAt: null, discovered: false })),
]

interface SpeciesMastery {
  speciesName: string
  icon: string
  difficulty: string
  level: number
  plantCount: number
  harvestCount: number
  perfected: boolean
}

type SpeciesCollection = typeof MOCK_SPECIES_COLLECTION[0]

interface Hybrid {
  parent1: string
  parent2: string
  result: string
  discoveredAt: string
}

interface CompanionPair {
  plant1: string
  plant2: string
  benefit: string
}

interface PlantStats {
  activePlanters: number
  totalHarvests: number
  avgMasteryLevel: number
}

interface LevelDistribution {
  level: string
  users: number
}

const MOCK_MASTERIES: SpeciesMastery[] = [
  { speciesName: 'Tomato', icon: '🍅', difficulty: 'EASY', level: 7, plantCount: 24, harvestCount: 18, perfected: false },
  { speciesName: 'Basil', icon: '🌿', difficulty: 'EASY', level: 5, plantCount: 15, harvestCount: 12, perfected: false },
  { speciesName: 'Sunflower', icon: '🌻', difficulty: 'EASY', level: 3, plantCount: 8, harvestCount: 5, perfected: false },
  { speciesName: 'Strawberry', icon: '🍓', difficulty: 'MEDIUM', level: 2, plantCount: 4, harvestCount: 2, perfected: false },
  { speciesName: 'Carrot', icon: '🥕', difficulty: 'EASY', level: 4, plantCount: 12, harvestCount: 10, perfected: false },
  { speciesName: 'Blueberry', icon: '🫐', difficulty: 'HARD', level: 1, plantCount: 2, harvestCount: 1, perfected: false },
  { speciesName: 'Bell Pepper', icon: '🌶️', difficulty: 'MEDIUM', level: 2, plantCount: 6, harvestCount: 4, perfected: false },
  { speciesName: 'Lettuce', icon: '🥬', difficulty: 'EASY', level: 4, plantCount: 10, harvestCount: 8, perfected: false },
  { speciesName: 'Corn', icon: '🌽', difficulty: 'MEDIUM', level: 1, plantCount: 3, harvestCount: 2, perfected: false },
  { speciesName: 'Green Onion', icon: '🧅', difficulty: 'EASY', level: 3, plantCount: 7, harvestCount: 6, perfected: false },
  { speciesName: 'Mint', icon: '🌱', difficulty: 'EASY', level: 2, plantCount: 5, harvestCount: 3, perfected: false },
  { speciesName: 'Lavender', icon: '🌺', difficulty: 'MEDIUM', level: 1, plantCount: 1, harvestCount: 0, perfected: false },
]

const MOCK_HYBRIDS: Hybrid[] = [
  { parent1: 'Tomato', parent2: 'Strawberry', result: 'Tomberry', discoveredAt: '2026-05-28' },
  { parent1: 'Basil', parent2: 'Mint', result: 'Basint', discoveredAt: '2026-05-25' },
  { parent1: 'Carrot', parent2: 'Bell Pepper', result: 'Pepperoot', discoveredAt: '2026-05-20' },
]

const COMPANION_PAIRS: CompanionPair[] = [
  { plant1: 'Tomato', plant2: 'Basil', benefit: 'Repels pests, improves flavor' },
  { plant1: 'Tomato', plant2: 'Carrot', benefit: 'Aerates soil, shares nutrients' },
  { plant1: 'Strawberry', plant2: 'Basil', benefit: 'Attracts pollinators' },
  { plant1: 'Sunflower', plant2: 'Strawberry', benefit: 'Provides dappled shade' },
  { plant1: 'Carrot', plant2: 'Basil', benefit: 'Repels carrot fly' },
  { plant1: 'Tomato', plant2: 'Sunflower', benefit: 'Attracts beneficial insects' },
  { plant1: 'Corn', plant2: 'Soybean', benefit: 'Nitrogen fixation, natural trellis' },
  { plant1: 'Lettuce', plant2: 'Carrot', benefit: 'Shade retention, space efficiency' },
]

const MOCK_PLANT_ACHIEVEMENTS: Achievement[] = [
  { id: 'p1', key: 'first_plant', name: 'First Planting', description: 'Plant your first crop', icon: '🌱', category: 'GARDENING', maxProgress: 1, xpReward: 50, tokenReward: 0 },
  { id: 'p2', key: 'collector_5', name: 'Budding Collector', description: 'Discover 5 unique plant species', icon: '🔍', category: 'GARDENING', maxProgress: 5, xpReward: 100, tokenReward: 0 },
  { id: 'p3', key: 'harvest_10', name: 'First Harvest', description: 'Harvest 10 crops total', icon: '🌾', category: 'GARDENING', maxProgress: 10, xpReward: 100, tokenReward: 0 },
  { id: 'p4', key: 'mastery_3', name: 'Species Apprentice', description: 'Reach mastery level 3 on any species', icon: '⭐', category: 'GARDENING', maxProgress: 3, xpReward: 150, tokenReward: 0 },
  { id: 'p5', key: 'hybrid_first', name: 'First Hybrid', description: 'Create your first hybrid plant', icon: '🧬', category: 'GARDENING', maxProgress: 1, xpReward: 200, tokenReward: 0 },
  { id: 'p6', key: 'collector_15', name: 'Species Hunter', description: 'Discover 15 unique plant species', icon: '🔬', category: 'GARDENING', maxProgress: 15, xpReward: 500, tokenReward: 0 },
  { id: 'p7', key: 'mastery_7', name: 'Master Botanist', description: 'Reach mastery level 7 on any species', icon: '👑', category: 'MILESTONE', maxProgress: 7, xpReward: 1000, tokenReward: 0 },
  { id: 'p8', key: 'harvest_100', name: 'Harvest Legend', description: 'Harvest 100 crops total', icon: '🏆', category: 'GARDENING', maxProgress: 100, xpReward: 2000, tokenReward: 0 },
  { id: 'p9', key: 'companion_3', name: 'Companion Planter', description: 'Grow 3 different companion pairs', icon: '🤝', category: 'GARDENING', maxProgress: 3, xpReward: 250, tokenReward: 0 },
  { id: 'p10', key: 'perfected', name: 'Perfectionist', description: 'Perfect any species (reach max mastery)', icon: '💎', category: 'MILESTONE', maxProgress: 1, xpReward: 500, tokenReward: 0 },
]

const XP_PER_ACTION = [
  { action: 'Plant Crop', xp: 15 },
  { action: 'Water Crop', xp: 5 },
  { action: 'Fertilize Crop', xp: 10 },
  { action: 'Harvest Crop', xp: '25 + health/4' },
  { action: 'Discover Species', xp: 50 },
  { action: 'Cross-Pollinate', xp: 100 },
  { action: 'Daily Login', xp: 'Varies' },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HARD: 'text-red-400',
}

const DIFFICULTY_BADGE_VARIANTS: Record<string, 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface GamificationStats {
  totalUsers: number
  activeToday: number
  totalPlanted: number
  averageLevel: number
}

interface ShopItemWithPurchases extends ShopItem {
  purchases?: number
}

interface AchievementWithCompletions extends Achievement {
  completedBy?: number
}

interface ShopFormState {
  name: string
  description: string
  category: string
  price: number
  currency: string
  icon: string
  isLimited: boolean
  stock: number
  levelRequired: number
  itemType: string
  isOnSale: boolean
  discountPrice: number
  saleEndsAt: string
}

interface AchievementFormState {
  key: string
  name: string
  description: string
  icon: string
  category: string
  maxProgress: number
  xpReward: number
  tokenReward: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getAvgMasteryLevel(masteries: SpeciesMastery[]): number {
  if (!masteries.length) return 0
  return Math.round((masteries.reduce((sum, m) => sum + m.level, 0) / masteries.length) * 10) / 10
}

function getLevelDistribution(): LevelDistribution[] {
  return Array.from({ length: 10 }, (_, i) => ({
    level: `Lv ${i + 1}`,
    users: Math.floor(Math.random() * 30) + 5,
  }))
}

const difficultyOptions = [
  { value: '', label: 'All Difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
]

const seasonOptions = [
  { value: '', label: 'All Seasons' },
  { value: 'Spring', label: 'Spring' },
  { value: 'Summer', label: 'Summer' },
  { value: 'Fall', label: 'Fall' },
  { value: 'Winter', label: 'Winter' },
]

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'Vegetable', label: 'Vegetable' },
  { value: 'Fruit', label: 'Fruit' },
  { value: 'Herb', label: 'Herb' },
  { value: 'Flower', label: 'Flower' },
  { value: 'Tree', label: 'Tree' },
  { value: 'Grain', label: 'Grain' },
  { value: 'Legume', label: 'Legume' },
  { value: 'Fungus', label: 'Fungus' },
]

/* ------------------------------------------------------------------ */
/*  Gamification Page                                                 */
/* ------------------------------------------------------------------ */

export default function GamificationPage() {
  /* ---- State ---- */
  const [masteries, setMasteries] = useState<SpeciesMastery[]>([])
  const [collections, setCollections] = useState<SpeciesCollection[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [plantStats, setPlantStats] = useState<PlantStats | null>(null)
  const [hybrids] = useState<Hybrid[]>(MOCK_HYBRIDS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Plant catalog filters
  const [catalogSearch, setCatalogSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showDiscoveredOnly, setShowDiscoveredOnly] = useState(false)

  // Catalog tab
  const [catalogTab, setCatalogTab] = useState('all')

  // Shop Items state
  const [shopItems, setShopItems] = useState<ShopItemWithPurchases[]>([])
  const [shopLoading, setShopLoading] = useState(false)
  const [shopError, setShopError] = useState<string | null>(null)
  const [shopModalOpen, setShopModalOpen] = useState(false)
  const [editingShopItem, setEditingShopItem] = useState<ShopItemWithPurchases | null>(null)
  const [shopForm, setShopForm] = useState<ShopFormState>({
    name: '', description: '', category: 'SEED', price: 0,
    currency: 'GREEN_CREDITS', icon: '', isLimited: false, stock: 0, levelRequired: 1,
    itemType: 'CONSUMABLE', isOnSale: false, discountPrice: 0, saleEndsAt: '',
  })
  const [shopFormSubmitting, setShopFormSubmitting] = useState(false)

  // Achievements Management state
  const [manageableAchievements, setManageableAchievements] = useState<AchievementWithCompletions[]>([])
  const [achManagementLoading, setAchManagementLoading] = useState(false)
  const [achManagementError, setAchManagementError] = useState<string | null>(null)
  const [achModalOpen, setAchModalOpen] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<AchievementWithCompletions | null>(null)
  const [achForm, setAchForm] = useState<AchievementFormState>({
    key: '', name: '', description: '', icon: '', category: 'GENERAL',
    maxProgress: 1, xpReward: 0, tokenReward: 0,
  })
  const [achFormSubmitting, setAchFormSubmitting] = useState(false)

  // Management tabs
  const [mgmtTab, setMgmtTab] = useState('shop')

  /* ---- Computed ---- */
  const discoveredCount = collections.length
  const collectionPercent = Math.round((discoveredCount / TOTAL_SPECIES_AVAILABLE) * 100)
  const avgMastery = getAvgMasteryLevel(masteries)
  const totalHarvests = collections.reduce((sum, s) => sum + s.harvestedCount, 0)
  const levelDist = useMemo(() => getLevelDistribution(), [])

  const filteredCatalog = useMemo(() => {
    return ALL_PLANT_SPECIES.filter(species => {
      if (catalogTab === 'discovered' && !species.discovered) return false
      if (catalogTab === 'undiscovered' && species.discovered) return false
      if (showDiscoveredOnly && !species.discovered) return false
      if (difficultyFilter && species.difficulty !== difficultyFilter) return false
      if (seasonFilter && species.season !== seasonFilter) return false
      if (categoryFilter && species.category !== categoryFilter) return false
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase()
        return (
          species.commonName.toLowerCase().includes(q) ||
          species.scientificName.toLowerCase().includes(q) ||
          species.family.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [catalogTab, showDiscoveredOnly, difficultyFilter, seasonFilter, categoryFilter, catalogSearch])

  /* ---- Data fetching ---- */
  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [usersRes, masteryRes, collectionRes, aRes] = await Promise.all([
        api.get('/admin/users', { params: { limit: 100 } }).catch(() => null),
        api.get('/gamification/masteries').catch(() => null),
        api.get('/gamification/collections/stats').catch(() => null),
        api.get('/gamification/achievements').catch(() => null),
      ])

      // Users / basic stats
      if (usersRes?.data) {
        const body = usersRes.data as { users: { lastLoginAt: string; level: number }[] }
        const userList = body.users ?? []
        const activeToday = userList.filter(u => {
          const last = new Date(u.lastLoginAt)
          const now = new Date()
          return last.toDateString() === now.toDateString()
        }).length
        const avgLevel = userList.length
          ? Math.round(userList.reduce((sum, u) => sum + u.level, 0) / userList.length)
          : 0
        setStats({
          totalUsers: userList.length,
          activeToday,
          totalPlanted: 0,
          averageLevel: avgLevel,
        })
      } else {
        setStats({ totalUsers: 10, activeToday: 4, totalPlanted: 97, averageLevel: 5 })
      }

      // Masteries
      if (masteryRes?.data) {
        const data = masteryRes.data
        setMasteries(Array.isArray(data) ? data as SpeciesMastery[] : data.data ?? MOCK_MASTERIES)
      } else {
        setMasteries(MOCK_MASTERIES)
      }

      // Collections
      if (collectionRes?.data) {
        const data = collectionRes.data
        setCollections(Array.isArray(data) ? data as SpeciesCollection[] : data.data ?? MOCK_SPECIES_COLLECTION)
      } else {
        setCollections(MOCK_SPECIES_COLLECTION)
      }

      // Achievements
      if (aRes?.data) {
        const data = aRes.data
        setAchievements(Array.isArray(data) ? data : data.data ?? MOCK_PLANT_ACHIEVEMENTS)
      } else {
        setAchievements(MOCK_PLANT_ACHIEVEMENTS)
      }

      // Plant stats from computed data
      const effectiveMasteries = masteryRes?.data
        ? (Array.isArray(masteryRes.data) ? masteryRes.data as SpeciesMastery[] : (masteryRes.data as { data: SpeciesMastery[] }).data ?? MOCK_MASTERIES)
        : MOCK_MASTERIES
      const effectiveCollections = collectionRes?.data
        ? (Array.isArray(collectionRes.data) ? collectionRes.data as SpeciesCollection[] : (collectionRes.data as { data: SpeciesCollection[] }).data ?? MOCK_SPECIES_COLLECTION)
        : MOCK_SPECIES_COLLECTION

      setPlantStats({
        activePlanters: stats?.activeToday ?? 4,
        totalHarvests: effectiveCollections.reduce((sum, s) => sum + s.harvestedCount, 0),
        avgMasteryLevel: getAvgMasteryLevel(effectiveMasteries),
      })
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Server error: ${(err as { response: { status: number } }).response?.status ?? 'Unknown'}`
          : 'Could not load gamification data. Showing mock data.'
      setError(message)

      setStats({ totalUsers: 10, activeToday: 4, totalPlanted: 97, averageLevel: 5 })
      setMasteries(MOCK_MASTERIES)
      setCollections(MOCK_SPECIES_COLLECTION)
      setAchievements(MOCK_PLANT_ACHIEVEMENTS)
      setPlantStats({
        activePlanters: 4,
        totalHarvests: MOCK_SPECIES_COLLECTION.reduce((sum, s) => sum + s.harvestedCount, 0),
        avgMasteryLevel: getAvgMasteryLevel(MOCK_MASTERIES),
      })
    } finally {
      setIsLoading(false)
    }
  }, [stats?.activeToday])

  useEffect(() => { fetchAll() }, [fetchAll])

  /* ---- Shop Items fetch ---- */
  const fetchShopItems = useCallback(async () => {
    setShopLoading(true)
    setShopError(null)
    try {
      const res = await api.get('/gamification', { params: { type: 'shop' } })
      const body = res.data as unknown
      const items = Array.isArray(body) ? body : (body as Record<string, unknown>).data ?? []
      setShopItems(items as ShopItemWithPurchases[])
    } catch {
      setShopError('Could not load shop items.')
      setShopItems([])
    } finally {
      setShopLoading(false)
    }
  }, [])

  useEffect(() => { fetchShopItems() }, [fetchShopItems])

  /* ---- Achievements Management fetch ---- */
  const fetchManageableAchievements = useCallback(async () => {
    setAchManagementLoading(true)
    setAchManagementError(null)
    try {
      const res = await api.get('/gamification', { params: { type: 'achievements' } })
      const body = res.data as unknown
      const items = Array.isArray(body) ? body : (body as Record<string, unknown>).data ?? []
      setManageableAchievements(items as AchievementWithCompletions[])
    } catch {
      setAchManagementError('Could not load achievements.')
      setManageableAchievements([])
    } finally {
      setAchManagementLoading(false)
    }
  }, [])

  useEffect(() => { fetchManageableAchievements() }, [fetchManageableAchievements])

  /* ---- Shop Item Submit ---- */
  const handleShopSubmit = useCallback(async () => {
    setShopFormSubmitting(true)
    try {
      const payload = {
        name: shopForm.name,
        description: shopForm.description,
        category: shopForm.category,
        price: shopForm.price,
        currency: shopForm.currency,
        icon: shopForm.icon,
        isLimited: shopForm.isLimited,
        stock: shopForm.isLimited ? shopForm.stock : null,
        levelRequired: shopForm.levelRequired,
        itemType: shopForm.itemType,
        isOnSale: shopForm.isOnSale,
        discountPrice: shopForm.isOnSale ? shopForm.discountPrice : null,
        saleEndsAt: shopForm.isOnSale ? shopForm.saleEndsAt || null : null,
      }
      const method = editingShopItem ? api.patch : api.post
      await method(`/gamification?type=shop`, payload)
      setShopModalOpen(false)
      setEditingShopItem(null)
      setShopForm({ name: '', description: '', category: 'SEED', price: 0, currency: 'GREEN_CREDITS', icon: '', isLimited: false, stock: 0, levelRequired: 1, itemType: 'CONSUMABLE', isOnSale: false, discountPrice: 0, saleEndsAt: '' })
      await fetchShopItems()
    } catch {
      setShopError('Failed to save shop item.')
    } finally {
      setShopFormSubmitting(false)
    }
  }, [shopForm, editingShopItem, fetchShopItems])

  /* ---- Achievement Submit ---- */
  const handleAchievementSubmit = useCallback(async () => {
    setAchFormSubmitting(true)
    try {
      const payload = {
        key: achForm.key,
        name: achForm.name,
        description: achForm.description,
        icon: achForm.icon,
        category: achForm.category,
        maxProgress: achForm.maxProgress,
        xpReward: achForm.xpReward,
        tokenReward: achForm.tokenReward,
      }
      const method = editingAchievement ? api.patch : api.post
      await method(`/gamification?type=achievements`, payload)
      setAchModalOpen(false)
      setEditingAchievement(null)
      setAchForm({ key: '', name: '', description: '', icon: '', category: 'GENERAL', maxProgress: 1, xpReward: 0, tokenReward: 0 })
      await fetchManageableAchievements()
    } catch {
      setAchManagementError('Failed to save achievement.')
    } finally {
      setAchFormSubmitting(false)
    }
  }, [achForm, editingAchievement, fetchManageableAchievements])

  /* ---- Computed shop stats ---- */
  const shopStats = useMemo(() => {
    const categories = new Set(shopItems.map(i => i.category))
    return {
      totalItems: shopItems.length,
      categoriesCount: categories.size,
      limitedItems: shopItems.filter(i => i.isLimited).length,
      totalStock: shopItems.reduce((sum, i) => sum + (i.stock ?? 0), 0),
    }
  }, [shopItems])

  /* ---- Computed achievements stats ---- */
  const achStats = useMemo(() => {
    const categories = new Set(manageableAchievements.map(a => a.category))
    return {
      totalAchievements: manageableAchievements.length,
      categoriesCount: categories.size,
      totalCompletedBy: manageableAchievements.reduce((sum, a) => sum + (a.completedBy ?? 0), 0),
    }
  }, [manageableAchievements])

  /* ---- Loading State ---- */
  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading plant collections &amp; mastery data...</p>
        </div>
      </div>
    )
  }

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-400/10">
            <Sprout className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Plant Collections &amp; Mastery</h1>
            <p className="text-sm text-slate-500">Species discovery, hybridization, and companion planting</p>
          </div>
        </div>
        <Badge variant="success" dot>Live</Badge>
      </div>

      {/* ============ ERROR BANNER ============ */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchAll}>Retry</Button>
        </div>
      )}

      {/* ============ STATS ROW ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Collection Progress Card */}
        <div className="card group hover:border-slate-700/80 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-400">Species Discovered</p>
              <p className="text-2xl font-bold text-slate-100">
                {discoveredCount} <span className="text-base font-normal text-slate-500">/ {TOTAL_SPECIES_AVAILABLE}</span>
              </p>
            </div>
            <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400 group-hover:bg-emerald-400/20 transition-colors">
              <Leaf className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-slate-500">Collection progress</span>
              <span className="text-emerald-400 font-medium">{collectionPercent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
          </div>
        </div>

        <StatCard
          title="Active Planters (Today)"
          value={plantStats?.activePlanters ?? 0}
          change={0}
          changeLabel="planted today"
          trend="up"
          icon={<Zap className="w-6 h-6" />}
        />
        <StatCard
          title="Total Harvests"
          value={plantStats?.totalHarvests ?? 0}
          change={0}
          changeLabel="crops harvested"
          trend="up"
          icon={<Wheat className="w-6 h-6" />}
        />
        <StatCard
          title="Avg Mastery Level"
          value={avgMastery}
          change={0}
          changeLabel="across all species"
          trend="up"
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* ============ SPECIES MASTERY TABLE ============ */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Species Mastery Overview</h3>
          <Award className="w-4 h-4 text-amber-400" />
        </div>
        <DataTable
          columns={[
            {
              key: 'icon',
              header: '',
              width: '50px',
              render: (r) => <span className="text-lg">{r.icon as string}</span>,
            },
            { key: 'speciesName', header: 'Species Name', sortable: true },
            {
              key: 'difficulty',
              header: 'Difficulty',
              width: '100px',
              sortable: true,
              render: (r) => {
                const diff = r.difficulty as string
                return (
                  <Badge variant={DIFFICULTY_BADGE_VARIANTS[diff] ?? 'default'}>
                    <span className={DIFFICULTY_COLORS[diff] ?? 'text-slate-400'}>{diff}</span>
                  </Badge>
                )
              },
            },
            {
              key: 'level',
              header: 'Level',
              width: '80px',
              sortable: true,
              render: (r) => {
                const lv = r.level as number
                const pct = (lv / 10) * 100
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-slate-200 font-mono text-xs">{lv}/10</span>
                  </div>
                )
              },
            },
            {
              key: 'plantCount',
              header: 'Planted',
              width: '90px',
              sortable: true,
              render: (r) => <span className="text-emerald-400 font-mono">{r.plantCount as number}</span>,
            },
            {
              key: 'harvestCount',
              header: 'Harvested',
              width: '100px',
              sortable: true,
              render: (r) => <span className="text-amber-400 font-mono">{r.harvestCount as number}</span>,
            },
            {
              key: 'perfected',
              header: 'Status',
              width: '100px',
              render: (r) => {
                const perf = r.perfected as boolean
                return perf
                  ? <Badge variant="success">Perfected ✨</Badge>
                  : <Badge variant="default">In Progress</Badge>
              },
            },
          ]}
          data={masteries as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => String(r.speciesName)}
          searchable
          pageSize={8}
          emptyMessage="No species masteries recorded yet."
        />
      </div>

      {/* ============ PLANT COLLECTIONS GRID ============ */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Plant Collections</h3>
          <Flower2 className="w-4 h-4 text-emerald-400" />
        </div>
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collections.map(species => (
              <div
                key={species.commonName}
                className="relative rounded-xl border border-slate-800/60 bg-slate-800/30 p-4 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-400/10 text-xl">
                    {species.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{species.commonName}</p>
                    <p className="text-xs text-slate-500 italic truncate">{species.scientificName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={DIFFICULTY_BADGE_VARIANTS[species.difficulty] ?? 'default'}>
                    <span className={DIFFICULTY_COLORS[species.difficulty]}>{species.difficulty}</span>
                  </Badge>
                  <Badge variant="info">{species.season}</Badge>
                  <Badge variant="default">{species.family}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800/40">
                  <span>Planted: <span className="text-emerald-400 font-mono">{species.plantedCount}</span></span>
                  <span>Harvested: <span className="text-amber-400 font-mono">{species.harvestedCount}</span></span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5">
                  Discovered: {new Date(species.discoveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Leaf className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No plant species discovered yet.</p>
          </div>
        )}
      </div>

      {/* ============ HYBRIDS + COMPANION PLANTING ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Hybrids */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Hybrids</h3>
            <Combine className="w-4 h-4 text-purple-400" />
          </div>
          {hybrids.length > 0 ? (
            <div className="space-y-3">
              {hybrids.map(h => (
                <div
                  key={`${h.parent1}-${h.parent2}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800/60"
                >
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-400 font-medium">{h.parent1}</span>
                    <span className="text-slate-600">×</span>
                    <span className="text-emerald-400 font-medium">{h.parent2}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-amber-400 font-semibold">{h.result}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(h.discoveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
              <p className="text-xs text-slate-500 mt-2">
                Hybridization unlocks unique plant variants with combined traits.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Combine className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">No hybrids created yet.</p>
              <p className="text-xs text-slate-600 mt-1">Cross-pollinate two discovered species to create hybrids.</p>
            </div>
          )}
        </div>

        {/* Companion Planting Reference */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Companion Planting Reference</h3>
            <Swords className="w-4 h-4 text-emerald-400" />
          </div>
          {COMPANION_PAIRS.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="table-header">Plant</th>
                    <th className="table-header">Companion</th>
                    <th className="table-header">Benefit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {COMPANION_PAIRS.map((pair, i) => (
                    <tr key={`${pair.plant1}-${pair.plant2}-${i}`} className="table-row">
                      <td className="table-cell">
                        <span className="text-emerald-400 font-medium">{pair.plant1}</span>
                      </td>
                      <td className="table-cell">
                        <span className="text-amber-400 font-medium">{pair.plant2}</span>
                      </td>
                      <td className="table-cell text-xs text-slate-400">{pair.benefit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">Companion planting reference not available.</p>
            </div>
          )}
        </div>
      </div>

      {/* ============ PLANT CATALOG ============ */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Plant Catalog</h3>
          <Trees className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Search by name, family..."
              className="input-field pl-10"
            />
          </div>
          <div className="w-[140px]">
            <Select
              options={difficultyOptions}
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              placeholder="Difficulty"
            />
          </div>
          <div className="w-[140px]">
            <Select
              options={seasonOptions}
              value={seasonFilter}
              onChange={e => setSeasonFilter(e.target.value)}
              placeholder="Season"
            />
          </div>
          <div className="w-[150px]">
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              placeholder="Category"
            />
          </div>
          <Button
            variant={showDiscoveredOnly ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowDiscoveredOnly(!showDiscoveredOnly)}
          >
            <Search className="w-4 h-4" />
            {showDiscoveredOnly ? 'Discovered' : 'All Species'}
          </Button>
        </div>

        {/* Catalog Tabs */}
        <TabsRoot value={catalogTab} onValueChange={setCatalogTab}>
          <TabsList>
            <TabsTrigger value="all">All ({ALL_PLANT_SPECIES.length})</TabsTrigger>
            <TabsTrigger value="discovered">Discovered ({discoveredCount})</TabsTrigger>
            <TabsTrigger value="undiscovered">Undiscovered ({TOTAL_SPECIES_AVAILABLE - discoveredCount})</TabsTrigger>
          </TabsList>
          <TabsContent value={catalogTab}>
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredCatalog.map(species => {
                  const isDiscovered = species.discovered
                  return (
                    <div
                      key={species.commonName}
                      className={cn(
                        'rounded-xl border p-3 transition-colors text-center',
                        isDiscovered
                          ? 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600/80'
                          : 'border-slate-800/30 bg-slate-900/30 opacity-60 hover:opacity-80 hover:border-slate-700/50'
                      )}
                    >
                      <span className="text-2xl block mb-1">{species.icon}</span>
                      <p className={cn(
                        'text-xs font-medium truncate',
                        isDiscovered ? 'text-slate-200' : 'text-slate-500'
                      )}>
                        {species.commonName}
                      </p>
                      <p className="text-[10px] text-slate-600 italic truncate mt-0.5">{species.scientificName}</p>
                      <div className="flex items-center justify-center gap-1 mt-1.5 flex-wrap">
                        <Badge variant={DIFFICULTY_BADGE_VARIANTS[species.difficulty] ?? 'default'}>{species.difficulty}</Badge>
                        <Badge variant="info">{species.season}</Badge>
                      </div>
                      {!isDiscovered && (
                        <p className="text-[10px] text-slate-600 mt-1.5">🔒 Not yet discovered</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">No species match your filters.</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => {
                  setCatalogSearch('')
                  setDifficultyFilter('')
                  setSeasonFilter('')
                  setCategoryFilter('')
                  setShowDiscoveredOnly(false)
                  setCatalogTab('all')
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </TabsRoot>
      </div>

      {/* ============ ACHIEVEMENTS ============ */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Plant Achievement Progress</h3>
          <Award className="w-4 h-4 text-amber-400" />
        </div>
        <DataTable
          columns={[
            {
              key: 'icon',
              header: '',
              width: '50px',
              render: (r) => <span className="text-lg">{r.icon as string}</span>,
            },
            { key: 'name', header: 'Name', sortable: true },
            { key: 'description', header: 'Description' },
            {
              key: 'category',
              header: 'Category',
              sortable: true,
              width: '120px',
              render: (r) => {
                const colors: Record<string, string> = {
                  GARDENING: 'text-emerald-400',
                  SOCIAL: 'text-sky-400',
                  MILESTONE: 'text-purple-400',
                }
                return (
                  <Badge variant="info">
                    <span className={colors[r.category as string] ?? 'text-slate-400'}>
                      {r.category as string}
                    </span>
                  </Badge>
                )
              },
            },
            {
              key: 'maxProgress',
              header: 'Target',
              width: '80px',
              render: (r) => <span className="text-slate-400 font-mono text-xs">{r.maxProgress as number}</span>,
            },
            {
              key: 'xpReward',
              header: 'XP Reward',
              sortable: true,
              width: '100px',
              render: (r) => <span className="text-emerald-400">+{r.xpReward as number}</span>,
            },
            {
              key: 'tokenReward',
              header: 'Token Reward',
              sortable: true,
              width: '110px',
              render: (r) => {
                const tokens = r.tokenReward as number
                return tokens > 0
                  ? <span className="text-cyan-400">+{tokens} ¤</span>
                  : <span className="text-slate-600">—</span>
              },
            },
          ]}
          data={achievements as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => String(r.id)}
          searchable
          pageSize={8}
          emptyMessage="No plant achievements configured."
        />
      </div>

      {/* ============ LEVEL DISTRIBUTION + XP PER ACTION ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Level Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Level Distribution</h3>
            <BarChart3 className="w-4 h-4 text-slate-500" />
          </div>
          {levelDist.length > 0 && levelDist.some(d => d.users > 0) ? (
            <Chart
              data={levelDist as unknown as Record<string, unknown>[]}
              series={[{ key: 'users', name: 'Users', color: '#22c55e' }]}
              kind="bar"
              height={240}
              showGrid={false}
            />
          ) : (
            <div className="flex items-center justify-center h-[240px] text-slate-500 text-sm">
              No level data to display
            </div>
          )}
        </div>

        {/* XP Per Action */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">XP Per Action</h3>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="table-header">Action</th>
                  <th className="table-header">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {XP_PER_ACTION.map(row => (
                  <tr key={row.action} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {row.action === 'Plant Crop' && <Sprout className="w-4 h-4 text-emerald-400" />}
                        {row.action === 'Water Crop' && <Droplets className="w-4 h-4 text-sky-400" />}
                        {row.action === 'Fertilize Crop' && <FlaskConical className="w-4 h-4 text-purple-400" />}
                        {row.action === 'Harvest Crop' && <Wheat className="w-4 h-4 text-amber-400" />}
                        {row.action === 'Discover Species' && <Search className="w-4 h-4 text-emerald-400" />}
                        {row.action === 'Cross-Pollinate' && <Combine className="w-4 h-4 text-purple-400" />}
                        {row.action === 'Daily Login' && <LogIn className="w-4 h-4 text-cyan-400" />}
                        <span className="text-slate-300">{row.action}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-emerald-400 font-mono">+{row.xp}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============ SHOP & ACHIEVEMENTS MANAGEMENT ============ */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Shop &amp; Achievements Management</h3>
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
        </div>
        <TabsRoot value={mgmtTab} onValueChange={setMgmtTab}>
          <TabsList>
            <TabsTrigger value="shop">Shop Items ({shopItems.length})</TabsTrigger>
            <TabsTrigger value="achievements">Achievements ({manageableAchievements.length})</TabsTrigger>
          </TabsList>

          {/* ---- Shop Items Tab ---- */}
          <TabsContent value="shop">
            {shopError && (
              <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-300 flex-1">{shopError}</p>
                <Button variant="ghost" size="sm" onClick={fetchShopItems}>Retry</Button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg bg-slate-800/30 border border-slate-800/60 p-3">
                <p className="text-xs text-slate-500">Total Items</p>
                <p className="text-lg font-bold text-slate-100">{shopStats.totalItems}</p>
              </div>
              <div className="rounded-lg bg-slate-800/30 border border-slate-800/60 p-3">
                <p className="text-xs text-slate-500">Categories</p>
                <p className="text-lg font-bold text-slate-100">{shopStats.categoriesCount}</p>
              </div>
              <div className="rounded-lg bg-slate-800/30 border border-slate-800/60 p-3">
                <p className="text-xs text-slate-500">Limited Items</p>
                <p className="text-lg font-bold text-amber-400">{shopStats.limitedItems}</p>
              </div>
              <div className="rounded-lg bg-slate-800/30 border border-slate-800/60 p-3">
                <p className="text-xs text-slate-500">Total Stock</p>
                <p className="text-lg font-bold text-slate-100">{shopStats.totalStock}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">Manage in-game shop items players can purchase.</p>
              <Button variant="primary" size="sm" onClick={() => {
                setEditingShopItem(null)
                setShopForm({ name: '', description: '', category: 'SEED', price: 0, currency: 'GREEN_CREDITS', icon: '', isLimited: false, stock: 0, levelRequired: 1, itemType: 'CONSUMABLE', isOnSale: false, discountPrice: 0, saleEndsAt: '' })
                setShopModalOpen(true)
              }}>
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>
            <DataTable
              columns={[
                { key: 'name', header: 'Name', sortable: true },
                { key: 'category', header: 'Category', width: '120px', sortable: true, render: (r) => <Badge variant="info">{r.category as string}</Badge> },
                { key: 'price', header: 'Price', width: '80px', sortable: true, render: (r) => <span className="text-emerald-400 font-mono">{r.price as number}</span> },
                { key: 'currency', header: 'Currency', width: '120px', sortable: true, render: (r) => {
                  const cur = r.currency as string
                  return <Badge variant={cur === 'GREEN_CREDITS' ? 'success' : 'warning'}>{cur === 'GREEN_CREDITS' ? 'Credits' : 'Eco Points'}</Badge>
                }},
                { key: 'stock', header: 'Stock', width: '70px', render: (r) => {
                  const s = r.stock as number | null
                  return s != null ? <span className="text-slate-300 font-mono">{s}</span> : <span className="text-slate-600">∞</span>
                }},
                { key: 'levelRequired', header: 'Min Lv', width: '70px', sortable: true, render: (r) => <span className="text-sky-400 font-mono">{r.levelRequired as number}</span> },
                { key: 'isLimited', header: 'Limited', width: '80px', render: (r) => r.isLimited ? <Badge variant="warning">Limited</Badge> : <Badge variant="default">Unlimited</Badge> },
                { key: 'purchases', header: 'Purchases', width: '100px', sortable: true, render: (r) => {
                  const p = r.purchases as number | undefined
                  return p != null ? <span className="text-amber-400 font-mono">{p}</span> : <span className="text-slate-600">—</span>
                }},
                { key: 'isOnSale', header: 'Sale', width: '70px', render: (r) => r.isOnSale ? <Badge variant="warning">SALE</Badge> : <Badge variant="default">—</Badge> },
              ]}
              data={shopItems as unknown as Record<string, unknown>[]}
              keyExtractor={(r) => String(r.id)}
              onRowClick={(r) => {
                const item = r as unknown as ShopItemWithPurchases
                setEditingShopItem(item)
                setShopForm({
                  name: item.name, description: item.description, category: item.category,
                  price: item.price, currency: item.currency, icon: item.icon,
                  isLimited: item.isLimited, stock: item.stock ?? 0, levelRequired: item.levelRequired,
                  itemType: item.itemType ?? 'CONSUMABLE', isOnSale: item.isOnSale ?? false,
                  discountPrice: item.discountPrice ?? 0, saleEndsAt: item.saleEndsAt ?? '',
                })
                setShopModalOpen(true)
              }}
              searchable
              pageSize={8}
              loading={shopLoading}
              emptyMessage="No shop items found."
            />
          </TabsContent>

          {/* ---- Achievements Management Tab ---- */}
          <TabsContent value="achievements">
            {achManagementError && (
              <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-300 flex-1">{achManagementError}</p>
                <Button variant="ghost" size="sm" onClick={fetchManageableAchievements}>Retry</Button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-slate-800/30 border border-slate-800/60 p-3">
                <p className="text-xs text-slate-500">Total Achievements</p>
                <p className="text-lg font-bold text-slate-100">{achStats.totalAchievements}</p>
              </div>
              <div className="rounded-lg bg-slate-800/30 border border-slate-800/60 p-3">
                <p className="text-xs text-slate-500">Categories</p>
                <p className="text-lg font-bold text-slate-100">{achStats.categoriesCount}</p>
              </div>
              <div className="rounded-lg bg-slate-800/30 border border-slate-800/60 p-3">
                <p className="text-xs text-slate-500">Total Completions</p>
                <p className="text-lg font-bold text-emerald-400">{achStats.totalCompletedBy}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">Create and manage achievements players can earn.</p>
              <Button variant="primary" size="sm" onClick={() => {
                setEditingAchievement(null)
                setAchForm({ key: '', name: '', description: '', icon: '', category: 'GENERAL', maxProgress: 1, xpReward: 0, tokenReward: 0 })
                setAchModalOpen(true)
              }}>
                <Plus className="w-4 h-4" />
                Add Achievement
              </Button>
            </div>
            <DataTable
              columns={[
                { key: 'key', header: 'Key', sortable: true, width: '130px' },
                { key: 'name', header: 'Name', sortable: true },
                { key: 'description', header: 'Description' },
                { key: 'category', header: 'Category', width: '120px', sortable: true, render: (r) => {
                  const colors: Record<string, string> = { GARDENING: 'text-emerald-400', SOCIAL: 'text-sky-400', MILESTONE: 'text-purple-400', GENERAL: 'text-slate-400' }
                  return <Badge variant="info"><span className={colors[r.category as string] ?? 'text-slate-400'}>{r.category as string}</span></Badge>
                }},
                { key: 'maxProgress', header: 'Max Progress', width: '100px', sortable: true, render: (r) => <span className="text-slate-400 font-mono text-xs">{r.maxProgress as number}</span> },
                { key: 'xpReward', header: 'XP Reward', width: '100px', sortable: true, render: (r) => <span className="text-emerald-400">+{r.xpReward as number}</span> },
                { key: 'tokenReward', header: 'Token Rew.', width: '100px', sortable: true, render: (r) => {
                  const tokens = r.tokenReward as number
                  return tokens > 0 ? <span className="text-cyan-400">+{tokens} ¤</span> : <span className="text-slate-600">—</span>
                }},
                { key: 'completedBy', header: 'Completed By', width: '120px', sortable: true, render: (r) => {
                  const count = r.completedBy as number | undefined
                  return count != null ? <span className="text-amber-400 font-mono">{count} users</span> : <span className="text-slate-600">—</span>
                }},
              ]}
              data={manageableAchievements as unknown as Record<string, unknown>[]}
              keyExtractor={(r) => String(r.id)}
              onRowClick={(r) => {
                const item = r as unknown as AchievementWithCompletions
                setEditingAchievement(item)
                setAchForm({ key: item.key, name: item.name, description: item.description, icon: item.icon, category: item.category, maxProgress: item.maxProgress, xpReward: item.xpReward, tokenReward: item.tokenReward })
                setAchModalOpen(true)
              }}
              searchable
              pageSize={8}
              loading={achManagementLoading}
              emptyMessage="No achievements configured."
            />
          </TabsContent>
        </TabsRoot>
      </div>

      {/* ============ SHOP ITEM MODAL ============ */}
      <Modal
        open={shopModalOpen}
        onOpenChange={setShopModalOpen}
        title={editingShopItem ? 'Edit Shop Item' : 'Add Shop Item'}
        description={editingShopItem ? 'Edit the selected shop item' : 'Create a new item for the in-game store'}
      >
        <div className="space-y-4">
          <Input id="shop-name" label="Name" value={shopForm.name} onChange={e => setShopForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Item name" />
          <Input id="shop-description" label="Description" value={shopForm.description} onChange={e => setShopForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Item description" />
          <Select id="shop-category" label="Category" options={[
            { value: 'SEED', label: 'Seed' }, { value: 'TOOL', label: 'Tool' },
            { value: 'FERTILIZER', label: 'Fertilizer' }, { value: 'DECORATION', label: 'Decoration' },
            { value: 'BOOST', label: 'Boost' }, { value: 'COUPON', label: 'Coupon' },
          ]} value={shopForm.category} onChange={e => setShopForm(prev => ({ ...prev, category: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="shop-price" label="Price" type="number" min={0} value={shopForm.price} onChange={e => setShopForm(prev => ({ ...prev, price: Number(e.target.value) }))} />
            <Select id="shop-currency" label="Currency" options={[
              { value: 'GREEN_CREDITS', label: 'Green Credits' }, { value: 'ECO_POINTS', label: 'Eco Points' },
            ]} value={shopForm.currency} onChange={e => setShopForm(prev => ({ ...prev, currency: e.target.value }))} />
          </div>
          <Input id="shop-icon" label="Icon" value={shopForm.icon} onChange={e => setShopForm(prev => ({ ...prev, icon: e.target.value }))} placeholder="Emoji or icon URL" />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="shop-isLimited" checked={shopForm.isLimited} onChange={e => setShopForm(prev => ({ ...prev, isLimited: e.target.checked }))} className="rounded border-slate-700 bg-slate-800 text-admin-500 focus:ring-admin-500" />
            <label htmlFor="shop-isLimited" className="text-sm font-medium text-slate-300">Limited Stock</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="shop-stock" label="Stock" type="number" min={0} value={shopForm.stock} onChange={e => setShopForm(prev => ({ ...prev, stock: Number(e.target.value) }))} disabled={!shopForm.isLimited} />
            <Input id="shop-levelRequired" label="Level Required" type="number" min={1} value={shopForm.levelRequired} onChange={e => setShopForm(prev => ({ ...prev, levelRequired: Number(e.target.value) }))} />
          </div>

          {/* Item Type */}
          <Select id="shop-itemType" label="Item Type" options={[
            { value: 'CONSUMABLE', label: 'Consumable' }, { value: 'TOOL', label: 'Tool' },
            { value: 'EQUIPMENT', label: 'Equipment' }, { value: 'DECORATION', label: 'Decoration' },
          ]} value={shopForm.itemType} onChange={e => setShopForm(prev => ({ ...prev, itemType: e.target.value }))} />

          {/* Sale / Discount */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="shop-isOnSale" checked={shopForm.isOnSale} onChange={e => setShopForm(prev => ({ ...prev, isOnSale: e.target.checked }))} className="rounded border-slate-700 bg-slate-800 text-admin-500 focus:ring-admin-500" />
            <label htmlFor="shop-isOnSale" className="text-sm font-medium text-slate-300">On Sale / Flash Sale</label>
          </div>
          {shopForm.isOnSale && (
            <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-amber-500/30">
              <Input id="shop-discountPrice" label="Discount Price" type="number" min={0} value={shopForm.discountPrice} onChange={e => setShopForm(prev => ({ ...prev, discountPrice: Number(e.target.value) }))} />
              <Input id="shop-saleEndsAt" label="Sale Ends At" type="datetime-local" value={shopForm.saleEndsAt} onChange={e => setShopForm(prev => ({ ...prev, saleEndsAt: e.target.value }))} />
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShopModalOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={shopFormSubmitting} onClick={handleShopSubmit}>
            {editingShopItem ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ============ ACHIEVEMENT MODAL ============ */}
      <Modal
        open={achModalOpen}
        onOpenChange={setAchModalOpen}
        title={editingAchievement ? 'Edit Achievement' : 'Add Achievement'}
        description={editingAchievement ? 'Edit the selected achievement' : 'Add a new achievement for players to earn'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="ach-key" label="Key" value={achForm.key} onChange={e => setAchForm(prev => ({ ...prev, key: e.target.value }))} placeholder="unique_key_name" />
            <Input id="ach-name" label="Name" value={achForm.name} onChange={e => setAchForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Achievement name" />
          </div>
          <Input id="ach-description" label="Description" value={achForm.description} onChange={e => setAchForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Achievement description" />
          <div className="grid grid-cols-2 gap-4">
            <Input id="ach-icon" label="Icon" value={achForm.icon} onChange={e => setAchForm(prev => ({ ...prev, icon: e.target.value }))} placeholder="Emoji or icon URL" />
            <Select id="ach-category" label="Category" options={[
              { value: 'GENERAL', label: 'General' }, { value: 'GARDENING', label: 'Gardening' },
              { value: 'SOCIAL', label: 'Social' }, { value: 'MILESTONE', label: 'Milestone' },
            ]} value={achForm.category} onChange={e => setAchForm(prev => ({ ...prev, category: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input id="ach-maxProgress" label="Max Progress" type="number" min={1} value={achForm.maxProgress} onChange={e => setAchForm(prev => ({ ...prev, maxProgress: Number(e.target.value) }))} />
            <Input id="ach-xpReward" label="XP Reward" type="number" min={0} value={achForm.xpReward} onChange={e => setAchForm(prev => ({ ...prev, xpReward: Number(e.target.value) }))} />
            <Input id="ach-tokenReward" label="Token Reward" type="number" min={0} value={achForm.tokenReward} onChange={e => setAchForm(prev => ({ ...prev, tokenReward: Number(e.target.value) }))} />
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setAchModalOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={achFormSubmitting} onClick={handleAchievementSubmit}>
            {editingAchievement ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>

    </div>
  )
}
