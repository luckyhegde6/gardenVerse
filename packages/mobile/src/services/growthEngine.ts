import { Crop, CropStatus, GardenType } from "../types"
import api from "./api"

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

export type GrowthEventCallback = (updatedCrops: Crop[]) => void

export class GrowthEngine {
  private timer: ReturnType<typeof setInterval> | null = null
  private crops: Crop[] = []
  private gardenType: GardenType = GardenType.VIRTUAL
  private sunlightExposure: number = 50
  private onUpdate: GrowthEventCallback | null = null
  private paused = false

  start(crops: Crop[], gardenType: GardenType, sunlightExposure: number, callback: GrowthEventCallback) {
    this.crops = crops
    this.gardenType = gardenType
    this.sunlightExposure = sunlightExposure
    this.onUpdate = callback

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

  onCropAction(cropId: string, action: 'water' | 'fertilize') {
    this.crops = this.crops.map(c => {
      if (c.id !== cropId) return c
      if (action === 'water') {
        return { ...c, hydration: Math.min(100, c.hydration + 20), _growthBoost: (c as any)._growthBoost ? (c as any)._growthBoost + 3 : 3 }
      }
      if (action === 'fertilize') {
        return { ...c, nutrientLevel: Math.min(100, c.nutrientLevel + 30), _growthBoost: (c as any)._growthBoost ? (c as any)._growthBoost + 2 : 2 }
      }
      return c
    })
  }

  forceTick() {
    this.tick()
  }

  private tick() {
    if (this.paused) return

    const gameMinutesPerTick = this.gardenType === GardenType.VIRTUAL
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

      // Hydration decay (more in high sun)
      const sunModifier = this.sunlightExposure > 70 ? 1.5 : this.sunlightExposure < 30 ? 0.5 : 1
      hydration = Math.max(0, hydration - HYDRATION_DECAY_PER_TICK * sunModifier)

      // Nutrient decay
      nutrientLevel = Math.max(0, nutrientLevel - NUTRIENT_DECAY_PER_TICK)

      // Health effects
      if (hydration < HYDRATION_THRESHOLD || nutrientLevel < NUTRIENT_THRESHOLD) {
        health = Math.max(0, health - STRESS_DAMAGE_PER_TICK)
      } else if (health < 100) {
        health = Math.min(100, health + HEALTH_RECOVERY_PER_TICK)
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
  }
}

export const growthEngine = new GrowthEngine()
