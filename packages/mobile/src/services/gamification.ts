import api from '@services/api';
import type { PlantCollectionData, CollectionStats, SpeciesMasteryData } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface GamificationData {
  level: number;
  experience: number;
  xpForNextLevel: number;
  greenCredits: number;
  ecoPoints: number;
  collections: CollectionStats;
  masteries: SpeciesMasteryData[];
}

export interface AchievementData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  maxProgress: number;
  xpReward: number;
  tokenReward: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
}

// ─── Backend Response Shapes (before mapping) ──────────────────────────────

interface CollectionStatsResponse {
  totalSpecies: number;
  discovered: number;
  mastered: number;
  completionRate: number;
}

const mapCollectionStats = (res: CollectionStatsResponse): CollectionStats => ({
  discovered: res.discovered,
  total: res.totalSpecies,
  completion: res.completionRate,
});

// ─── Service ───────────────────────────────────────────────────────────────

const GamificationService = {
  /**
   * Get full plant-centric gamification data (level, XP, collections, masteries).
   */
  async getGamification(): Promise<GamificationData> {
    try {
      const res = await api.get('/gamification');
      const d = res.data;
      return {
        level: d.level,
        experience: d.experience,
        xpForNextLevel: d.xpForNextLevel,
        greenCredits: d.greenCredits,
        ecoPoints: d.ecoPoints,
        collections: mapCollectionStats(d.collections),
        masteries: d.masteries ?? [],
      };
    } catch {
      return {
        level: 1,
        experience: 0,
        xpForNextLevel: 100,
        greenCredits: 0,
        ecoPoints: 0,
        collections: { discovered: 0, total: 0, completion: 0 },
        masteries: [],
      };
    }
  },

  /**
   * Get the user's plant collections (discovered species).
   */
  async getCollections(): Promise<PlantCollectionData[]> {
    try {
      const res = await api.get('/gamification/collections');
      return res.data;
    } catch {
      return [];
    }
  },

  /**
   * Get collection stats (discovered / total / completion %).
   */
  async getCollectionStats(): Promise<CollectionStats> {
    try {
      const res = await api.get('/gamification/collections/stats');
      return mapCollectionStats(res.data);
    } catch {
      return { discovered: 0, total: 0, completion: 0 };
    }
  },

  /**
   * Get mastery data for a specific species.
   */
  async getMastery(speciesId: string): Promise<SpeciesMasteryData> {
    try {
      const res = await api.get(`/gamification/mastery/${speciesId}`);
      return res.data;
    } catch {
      return {
        id: '',
        speciesId,
        speciesName: 'Unknown',
        level: 1,
        experience: 0,
        plantCount: 0,
        harvestCount: 0,
        totalForNextLevel: 100,
        perfectedAt: null,
      };
    }
  },

  /**
   * Get all achievements with user progress.
   */
  async getAchievements(): Promise<AchievementData[]> {
    try {
      const res = await api.get('/gamification/achievements');
      return res.data;
    } catch {
      return [];
    }
  },
};

export default GamificationService;
