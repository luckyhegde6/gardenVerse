import { Crop, CropStatus, GardenType } from "@/types"
// import api from "@services/api"

// A tick happens every TICK_INTERVAL_MS of real time.
const TICK_INTERVAL_MS = 30_000

// For a virtual garden, each tick advances game-time by this many minutes.
const VIRTUAL_TICK_GAME_MINUTES = 50
const REAL_TICK_GAME_MINUTES = 0.5

// Full growth 0 → 100 takes GROWTH_TICKS ticks (virtual: ~36 min, real: ~36 h)
const GROWTH_TICKS = 72

// Base per-tick changes
const BASE_GROWTH_PER_TICK = 100 / GROWTH_TICKS       // ~1.39
const HYDRATION_DECAY_PER_TICK = 2
const NUTRIENT_DECAY_PER_TICK = 1
const HEALTH_RECOVERY_PER_TICK = 0.5
const STRESS_DAMAGE_PER_TICK = 3
const HYDRATION_THRESHOLD = 25
const NUTRIENT_THRESHOLD = 25

export interface GrowthState {
  lastTickAt: number
  ticksElapsed: number
}

export type WeatherCondition = "clear" | "rain" | "heavy_rain" | "frost" | "heatwave" | "wind" | "cloudy"

export interface WeatherState {
  condition: WeatherCondition
  temperature: number // Celsius
  humidity: number     // 0-100
  rainfall: number     // mm per hour
}

const DEFAULT_WEATHER: WeatherState = { condition: "clear", temperature: 25, humidity: 50, rainfall: 0 }

export type GrowthEventCallback = (updatedCrops: Crop[]) => void
export type GrowthTickCallback = (growingCropIds: string[]) => void

export class GrowthEngine {
  private timer: ReturnType<typeof setInterval> | null = null
  private crops: Crop[] = []
  private gardenType: GardenType = GardenType.VIRTUAL
  private sunlightExposure: number = 50
  private weather: WeatherState = DEFAULT_WEATHER
  private onUpdate: GrowthEventCallback | null = null
  private onGrowthTick: GrowthTickCallback | null = null
  private paused = false

  start(crops: Crop[], gardenType: GardenType, sunlightExposure: number, callback: GrowthEventCallback, growthTickCallback?: GrowthTickCallback) {
    this.crops = crops
    this.gardenType = gardenType
    this.sunlightExposure = sunlightExposure
    this.onUpdate = callback
    this.onGrowthTick = growthTickCallback ?? null

    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  setPaused(paused: boolean) {
    this.paused = paused
  }

  updateCrops(crops: Crop[]) {
    this.crops = crops
  }

  updateGardenType(gardenType: GardenType) {
    this.gardenType = gardenType
  }

  updateSunlight(sunlightExposure: number) {
    this.sunlightExposure = sunlightExposure
  }

  setWeather(weather: WeatherState) {
    this.weather = weather
  }

  onCropAction(cropId: string, action: 'water' | 'fertilize' | 'plant') {
    this.crops = this.crops.map(c => {
      if (c.id !== cropId) return c
      if (action === 'water') {
        return { ...c, hydration: Math.min(100, c.hydration + 20), _growthBoost: (c as any)._growthBoost ? (c as any)._growthBoost + 3 : 3 }
      }
      if (action === 'fertilize') {
        return { ...c, nutrientLevel: Math.min(100, c.nutrientLevel + 30), _growthBoost: (c as any)._growthBoost ? (c as any)._growthBoost + 2 : 2 }
      }
      if (action === 'plant') {
        // Plant action - reset growth boost for new crop
        return { ...c, _growthBoost: 0 }
      }
      return c
    })
  }

  forceTick() {
    this.tick()
  }

  private tick() {
    if (this.paused) return

    const _gameMinutesPerTick = this.gardenType === GardenType.VIRTUAL
      ? VIRTUAL_TICK_GAME_MINUTES
      : REAL_TICK_GAME_MINUTES

    let changed = false

    this.crops = this.crops.map(crop => {
      if (crop.status === CropStatus.HARVESTED || crop.status === CropStatus.WILTED) return crop

      let { growthStage, hydration, nutrientLevel, health } = crop
      let status: string = crop.status
      const boost = (crop as any)._growthBoost || 0

      // Growth
      const growthBoost = boost > 0 ? BASE_GROWTH_PER_TICK * 2 : BASE_GROWTH_PER_TICK
      growthStage = Math.min(100, growthStage + growthBoost)

      // Hydration decay (modified by sun + weather)
      const sunModifier = this.sunlightExposure > 70 ? 1.5 : this.sunlightExposure < 30 ? 0.5 : 1
      let hydrationChange = -HYDRATION_DECAY_PER_TICK * sunModifier

      // Weather effects on hydration
      if (this.weather.condition === "rain") {
        hydrationChange += 3 // Light rain adds moisture
      } else if (this.weather.condition === "heavy_rain") {
        hydrationChange += 6 // Heavy rain adds more moisture
        // Flooding risk: excess rain can damage health
        if (hydration > 80) {
          health = Math.max(0, health - 1)
        }
      } else if (this.weather.condition === "heatwave") {
        hydrationChange -= 2 // Heat dries soil faster
      } else if (this.weather.condition === "wind") {
        hydrationChange -= 1 // Wind increases evaporation
      }

      hydration = Math.max(0, Math.min(100, hydration + hydrationChange))

      // Nutrient decay
      nutrientLevel = Math.max(0, nutrientLevel - NUTRIENT_DECAY_PER_TICK)

      // Health effects
      if (hydration < HYDRATION_THRESHOLD || nutrientLevel < NUTRIENT_THRESHOLD) {
        health = Math.max(0, health - STRESS_DAMAGE_PER_TICK)
      } else if (health < 100) {
        health = Math.min(100, health + HEALTH_RECOVERY_PER_TICK)
      }

      // Weather-specific health effects
      if (this.weather.condition === "frost") {
        // Frost damages crops that aren't protected
        const frostDamage = this.weather.temperature < 0 ? 3 : 1
        health = Math.max(0, health - frostDamage)
      } else if (this.weather.condition === "heatwave" && this.weather.temperature > 40) {
        // Extreme heat damages crops
        health = Math.max(0, health - 2)
      }

      // Status transitions
      if (growthStage <= 0) status = CropStatus.SEED
      else if (growthStage <= 25) status = CropStatus.SPROUTING
      else if (growthStage <= 75) status = CropStatus.GROWING
      else if (growthStage >= 100) status = CropStatus.MATURE

      if (health <= 0) status = CropStatus.WILTED as CropStatus

      // Decrease growth boost
      const newBoost = Math.max(0, boost - 1)

      changed = true

      return {
        ...crop,
        growthStage,
        hydration,
        nutrientLevel,
        health,
        status,
        _growthBoost: newBoost,
      } as Crop & { _growthBoost: number }
    })

    if (changed && this.onUpdate) {
      this.onUpdate(this.crops)
    }

    // Emit growth tick event for visual feedback
    const growingCropIds = this.crops
      .filter(c => c.status === CropStatus.SPROUTING || c.status === CropStatus.GROWING)
      .map(c => c.id)
    if (growingCropIds.length > 0 && this.onGrowthTick) {
      this.onGrowthTick(growingCropIds)
    }
  }
}

export const growthEngine = new GrowthEngine()
