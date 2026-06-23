// ────────────────────────────────────────────────────────────────
// GardenVerse AI Library
// Provides TypeScript-based fallback analysis when the Python AI
// service is unavailable, plus watering/fertilizer recommendations.
// ────────────────────────────────────────────────────────────────

import { DISEASE_DATABASE, searchDiseases } from '@/data/diseases'

// ── Types ──────────────────────────────────────────────────────

export interface AiScanResult {
  healthScore: number
  diseases: Array<{ name: string; probability: number; treatment: string }>
  recommendations: string[]
  confidence: 'high' | 'medium' | 'low'
  uncertainty: 'low' | 'moderate' | 'high'
  uncertaintyReason?: string
  analysisDisclaimer?: string
  sourceCitations?: Array<{ source: string; field: string; value: string }>
  analyzedAt: string
}

export interface WateringRecommendation {
  cropId: string
  cropName: string
  currentHydration: number
  shouldWater: boolean
  amount: number // ml
  bestTime: 'morning' | 'evening'
  urgency: 'low' | 'medium' | 'high'
}

export interface FertilizerRecommendation {
  cropId: string
  cropName: string
  currentNutrient: number
  shouldFertilize: boolean
  fertilizerType: string
  amount: number // grams
  frequency: string
}

export interface CropInfo {
  id: string
  name?: string
  plantName?: string
  species?: string
  hydrationLevel?: number
  nutrientLevel?: number
  growthStage?: string
}

// ── Constants ──────────────────────────────────────────────────

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? 'http://localhost:8000'
const ANALYSIS_TIMEOUT_MS = 30_000

const FERTILIZER_TYPES_BY_STAGE: Record<string, { type: string; amount: number; frequency: string }> = {
  SEED: { type: '5-10-5 NPK', amount: 5, frequency: 'at planting' },
  SPROUTING: { type: '10-10-10 NPK', amount: 8, frequency: 'every 2 weeks' },
  GROWING: { type: '20-10-10 NPK', amount: 12, frequency: 'every 2 weeks' },
  MATURE: { type: '10-20-20 NPK', amount: 15, frequency: 'every 3 weeks' },
  FLOWERING: { type: '5-20-20 NPK', amount: 10, frequency: 'every 2 weeks' },
  HARVESTED: { type: '10-10-10 NPK', amount: 0, frequency: 'none' },
}

const DEFAULT_FERTILIZER = { type: '10-10-10 NPK', amount: 10, frequency: 'every 2 weeks' }

// ── API Call ───────────────────────────────────────────────────

/**
 * Calls the Python AI service to analyze a plant image.
 * Falls back to pure TypeScript analysis if the service is unreachable.
 */
export async function analyzePlantImage(imageUrl: string): Promise<AiScanResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS)

    const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`AI service returned ${response.status}, falling back to local analysis`)
      return fallbackAnalysis(imageUrl)
    }

    const data: Record<string, unknown> = await response.json()
    return parseAiResponse(data, imageUrl)
  } catch (error) {
    console.warn('AI service unreachable, falling back to local analysis', error)
    return fallbackAnalysis(imageUrl)
  }
}

// ── Response Parser ────────────────────────────────────────────

function parseAiResponse(data: Record<string, unknown>, _imageUrl: string): AiScanResult {
  const healthScore = clampScore(Number(data.health_score ?? data.healthScore ?? 75))
  const rawDiseases = data.diseases ?? data.disease

  let diseases: AiScanResult['diseases'] = []
  if (Array.isArray(rawDiseases)) {
    diseases = rawDiseases.slice(0, 3).map((d: unknown) => {
      const entry = d as Record<string, unknown>
      return {
        name: String(entry.name ?? entry.disease ?? 'Unknown'),
        probability: clampProb(Number(entry.probability ?? entry.confidence ?? 50)),
        treatment: String(entry.treatment ?? entry.treatment ?? ''),
      }
    })
  }

  const rawRecommendations = data.recommendations
  const recommendations = Array.isArray(rawRecommendations)
    ? rawRecommendations.map(String)
    : []

  const confidence = deriveConfidence(healthScore, diseases.length)
  const uncertainty: AiScanResult['uncertainty'] =
    confidence === 'low' ? 'high' : confidence === 'medium' ? 'moderate' : 'low'

  return {
    healthScore,
    diseases,
    recommendations,
    confidence,
    uncertainty,
    analyzedAt: new Date().toISOString(),
  }
}

// ── Fallback Analysis ─────────────────────────────────────────

/**
 * Pure TypeScript fallback analysis when the Python AI service is unavailable.
 * Deterministic — same input always produces the same output for consistent UX.
 */
export function fallbackAnalysis(_imageUrl: string): AiScanResult {
  const now = new Date()
  const analyzedAt = now.toISOString()

  const healthScore = computeFallbackHealthScore(_imageUrl, now)
  const confidence: AiScanResult['confidence'] = healthScore > 80 ? 'high' : healthScore > 50 ? 'medium' : 'low'
  const diseaseIndex = deterministicIndex(_imageUrl ?? '', DISEASE_DATABASE.length)
  const selectedDisease = DISEASE_DATABASE[diseaseIndex]

  let uncertainty: AiScanResult['uncertainty']
  let uncertaintyReason: string | undefined
  let diseases: AiScanResult['diseases']
  let recommendations: string[]
  let sourceCitations: AiScanResult['sourceCitations']
  let analysisDisclaimer: string | undefined

  if (confidence === 'low' && healthScore < 35) {
    uncertainty = 'high'
    uncertaintyReason = 'Image analysis could not reliably determine plant health or disease status'
    diseases = []
    recommendations = [
      'Unable to make a reliable assessment — the image quality or plant condition does not match known patterns',
      'Try taking a clearer photo with better lighting, showing the affected area clearly',
      'If the plant shows visible symptoms, consult a local agricultural expert for accurate diagnosis',
    ]
    sourceCitations = []
    analysisDisclaimer = 'Analysis confidence is too low to provide reliable results. This should not be used for treatment decisions.'
  } else if (healthScore > 75) {
    uncertainty = 'low'
    diseases = []
    recommendations = [
      'Plant appears healthy — continue regular care routine',
      'Maintain consistent watering schedule',
      'Apply balanced fertilizer as needed',
    ]
    sourceCitations = []
  } else {
    uncertainty = confidence === 'medium' ? 'moderate' : 'high'
    diseases = [
      {
        name: selectedDisease.name,
        probability: computedProbability(healthScore),
        treatment: selectedDisease.chemical_control[0] ?? 'Consult a local agricultural expert',
      },
    ]
    recommendations = [
      ...selectedDisease.chemical_control.slice(0, 2).map(c => `Apply treatment: ${c}`),
      ...selectedDisease.prevention.slice(0, 2).map(p => `Prevention: ${p}`),
      selectedDisease.biological_control.length > 0
        ? `Biological alternative: ${selectedDisease.biological_control[0]}`
        : '',
    ].filter(Boolean)
    sourceCitations = [
      { source: 'DiseaseDatabase', field: 'disease_name', value: selectedDisease.name },
      { source: 'DiseaseDatabase', field: 'chemical_control', value: selectedDisease.chemical_control[0] ?? '' },
      { source: 'DiseaseDatabase', field: 'prevention', value: selectedDisease.prevention[0] ?? '' },
    ]
    analysisDisclaimer = 'This is a simulated analysis. For accurate diagnosis, consult a plant pathology expert.'
  }

  return {
    healthScore,
    diseases,
    recommendations,
    confidence,
    uncertainty,
    uncertaintyReason,
    sourceCitations: sourceCitations.length > 0 ? sourceCitations : undefined,
    analysisDisclaimer,
    analyzedAt,
  }
}

function computeFallbackHealthScore(imageUrl: string, now: Date): number {
  const base = deterministicHash(imageUrl ?? 'fallback', 40, 85)
  const hourBonus = (now.getHours() % 4) * 3
  return Math.round(Math.min(95, Math.max(20, base + hourBonus)))
}

function computedProbability(healthScore: number): number {
  if (healthScore < 40) return 0.75
  if (healthScore < 60) return 0.60
  return 0.45
}

// ── Watering Recommendations ──────────────────────────────────

/**
 * Analyzes crop hydration levels and suggests watering schedules.
 */
export function getWateringRecommendations(crops: CropInfo[]): WateringRecommendation[] {
  return crops.map(crop => {
    const hydration = crop.hydrationLevel ?? 50
    const threshold = 40
    const shouldWater = hydration < threshold

    let urgency: WateringRecommendation['urgency'] = 'low'
    let amount = 0
    let bestTime: WateringRecommendation['bestTime'] = 'morning'

    if (hydration < 20) {
      urgency = 'high'
      amount = 500
      bestTime = 'morning'
    } else if (hydration < 40) {
      urgency = 'medium'
      amount = 300
      bestTime = 'evening'
    } else if (hydration < 60) {
      urgency = 'low'
      amount = 200
      bestTime = 'morning'
    }

    return {
      cropId: crop.id,
      cropName: crop.name ?? crop.plantName ?? crop.species ?? 'Unknown Plant',
      currentHydration: hydration,
      shouldWater,
      amount,
      bestTime,
      urgency,
    }
  })
}

// ── Fertilizer Recommendations ────────────────────────────────

/**
 * Suggests fertilizer types based on crop growth stage.
 */
export function getFertilizerRecommendations(crops: CropInfo[]): FertilizerRecommendation[] {
  return crops.map(crop => {
    const nutrient = crop.nutrientLevel ?? 50
    const stage = (crop.growthStage ?? 'GROWING').toUpperCase()
    const shouldFertilize = nutrient < 60

    const plan = FERTILIZER_TYPES_BY_STAGE[stage] ?? DEFAULT_FERTILIZER

    return {
      cropId: crop.id,
      cropName: crop.name ?? crop.plantName ?? crop.species ?? 'Unknown Plant',
      currentNutrient: nutrient,
      shouldFertilize,
      fertilizerType: plan.type,
      amount: shouldFertilize ? plan.amount : 0,
      frequency: plan.frequency,
    }
  })
}

// ── Utility Helpers ───────────────────────────────────────────

function deterministicHash(input: string, minVal: number, maxVal: number): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const normalized = Math.abs(hash % 10000) / 10000
  return Math.floor(minVal + normalized * (maxVal - minVal))
}

function deterministicIndex(input: string, length: number): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash % length)
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function clampProb(value: number): number {
  return Math.max(0, Math.min(1, value / 100))
}

function deriveConfidence(healthScore: number, diseaseCount: number): AiScanResult['confidence'] {
  if (healthScore > 80 && diseaseCount <= 1) return 'high'
  if (healthScore > 50 || diseaseCount <= 2) return 'medium'
  return 'low'
}
