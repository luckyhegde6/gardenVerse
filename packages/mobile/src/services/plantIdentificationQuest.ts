import { api } from "./api";
import { getItem, setItem, StorageKeys } from "../utils/storage";
import { logger } from "./logger";
import type {
  QuestProgress,
  IdentifiedPlantPhoto,
} from "../types";

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  QUEST_PROGRESS: "plant_id_quest_progress",
  PHOTOS: "plant_id_photos",
  SPECIES_SET: "plant_id_species_set",
} as const;

const XP = {
  FIRST_IDENTIFICATION: 5,
  REPEAT_IDENTIFICATION: 2,
  PHOTO_CAPTURED: 3,
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

// ─── Quest definitions ──────────────────────────────────────────────────────

interface QuestDef {
  key: string;
  title: string;
  description: string;
  targetCount: number;
  xpPerAction: number;
}

const IDENTIFICATION_QUESTS: QuestDef[] = [
  { key: "identify_3_species", title: "Botanist Apprentice", description: "Identify 3 different plant species using the scanner", targetCount: 3, xpPerAction: 10 },
  { key: "identify_5_species", title: "Botanist", description: "Identify 5 different plant species using the scanner", targetCount: 5, xpPerAction: 15 },
  { key: "identify_10_species", title: "Botanist Master", description: "Identify 10 different plant species using the scanner", targetCount: 10, xpPerAction: 25 },
  { key: "identify_25_species", title: "Plant Whisperer", description: "Identify 25 different plant species using the scanner", targetCount: 25, xpPerAction: 50 },
];

const PHOTO_QUESTS: QuestDef[] = [
  { key: "capture_5_photos", title: "Photo Curator", description: "Capture 5 plant photos with the scanner", targetCount: 5, xpPerAction: 5 },
  { key: "capture_10_photos", title: "Green Photographer", description: "Capture 10 plant photos with the scanner", targetCount: 10, xpPerAction: 8 },
  { key: "capture_25_photos", title: "Nature Archivist", description: "Capture 25 plant photos with the scanner", targetCount: 25, xpPerAction: 15 },
  { key: "capture_50_photos", title: "Plant Historian", description: "Capture 50 plant photos with the scanner", targetCount: 50, xpPerAction: 25 },
];

function buildQuestProgress(def: QuestDef): QuestProgress {
  return {
    questId: def.key,
    questKey: def.key,
    progress: 0,
    targetCount: def.targetCount,
    isCompleted: false,
    claimed: false,
  };
}

// ─── PlantIdentificationQuest service ───────────────────────────────────────

export const plantIdQuest = {
  /**
   * Check if this species is new for the user, award XP, and update quest progress.
   * Returns the XP awarded and whether this was a first-time identification.
   */
  async checkAndAwardIdentificationQuest(
    speciesId: string,
    speciesName: string,
    confidence: number,
  ): Promise<{ xpAwarded: number; isNewSpecies: boolean; questProgress: QuestProgress[] }> {
    const speciesSet = new Set<string>(await loadJson<string[]>(STORAGE_KEYS.SPECIES_SET, []));
    const progress = await loadJson<QuestProgress[]>(
      STORAGE_KEYS.QUEST_PROGRESS,
      [...IDENTIFICATION_QUESTS, ...PHOTO_QUESTS].map(buildQuestProgress),
    );

    const isNew = !speciesSet.has(speciesId);
    let xpAwarded = 0;

    if (isNew) {
      speciesSet.add(speciesId);
      xpAwarded = XP.FIRST_IDENTIFICATION;
      await saveJson(STORAGE_KEYS.SPECIES_SET, Array.from(speciesSet));
    } else {
      xpAwarded = XP.REPEAT_IDENTIFICATION;
    }

    // Update identification quests
    const updatedProgress = progress.map((q) => {
      const def = IDENTIFICATION_QUESTS.find((d) => d.key === q.questKey);
      if (def && !q.claimed) {
        const newProgress = isNew ? q.progress + 1 : q.progress;
        const isCompleted = newProgress >= q.targetCount && !q.isCompleted;
        if (isCompleted) {
          xpAwarded += def.xpPerAction;
        }
        return {
          ...q,
          progress: Math.min(newProgress, q.targetCount),
          isCompleted: q.isCompleted || isCompleted,
        };
      }
      return q;
    });

    await saveJson(STORAGE_KEYS.QUEST_PROGRESS, updatedProgress);

    logger.info(
      `[PlantIdQuest] Identified "${speciesName}" (${speciesId}) — new=${isNew}, xp=${xpAwarded}`,
      { source: "plantIdQuest", context: "identification" },
    );

    // Fire-and-forget server sync
    this.syncQuestProgress().catch(() => {});

    return { xpAwarded, isNewSpecies: isNew, questProgress: updatedProgress };
  },

  /**
   * Save photo metadata locally, award XP, and update photo-based quest progress.
   */
  async checkAndAwardPhotoQuest(
    imageUri: string,
    speciesId: string,
    speciesName: string,
    confidence: number,
  ): Promise<{ xpAwarded: number; photo: IdentifiedPlantPhoto; questProgress: QuestProgress[] }> {
    const photos = await loadJson<IdentifiedPlantPhoto[]>(STORAGE_KEYS.PHOTOS, []);
    const progress = await loadJson<QuestProgress[]>(
      STORAGE_KEYS.QUEST_PROGRESS,
      [...IDENTIFICATION_QUESTS, ...PHOTO_QUESTS].map(buildQuestProgress),
    );

    const photo: IdentifiedPlantPhoto = {
      id: generateId(),
      speciesId,
      speciesName,
      imageUrl: imageUri,
      confidence,
      capturedAt: new Date().toISOString(),
      xpAwarded: XP.PHOTO_CAPTURED,
      usedForTraining: false,
    };

    photos.unshift(photo);
    // Keep last 200 photos locally
    const trimmed = photos.slice(0, 200);
    await saveJson(STORAGE_KEYS.PHOTOS, trimmed);

    let xpAwarded = XP.PHOTO_CAPTURED;

    // Update photo quests
    const updatedProgress = progress.map((q) => {
      const def = PHOTO_QUESTS.find((d) => d.key === q.questKey);
      if (def && !q.claimed) {
        const newProgress = q.progress + 1;
        const isCompleted = newProgress >= q.targetCount && !q.isCompleted;
        if (isCompleted) {
          xpAwarded += def.xpPerAction;
        }
        return {
          ...q,
          progress: Math.min(newProgress, q.targetCount),
          isCompleted: q.isCompleted || isCompleted,
        };
      }
      return q;
    });

    await saveJson(STORAGE_KEYS.QUEST_PROGRESS, updatedProgress);

    logger.info(
      `[PlantIdQuest] Photo captured for "${speciesName}" (${speciesId}), xp=${xpAwarded}`,
      { source: "plantIdQuest", context: "photo" },
    );

    // Fire-and-forget server sync
    this.syncQuestProgress().catch(() => {});

    return { xpAwarded, photo, questProgress: updatedProgress };
  },

  /**
   * Mark the given photo as used for AI training.
   */
  async markPhotoUsedForTraining(photoId: string): Promise<void> {
    const photos = await loadJson<IdentifiedPlantPhoto[]>(STORAGE_KEYS.PHOTOS, []);
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, usedForTraining: true } : p,
    );
    await saveJson(STORAGE_KEYS.PHOTOS, updated);
  },

  /**
   * Return current quest progress for all plant-id quests.
   */
  async getUserQuestProgress(): Promise<QuestProgress[]> {
    return loadJson<QuestProgress[]>(
      STORAGE_KEYS.QUEST_PROGRESS,
      [...IDENTIFICATION_QUESTS, ...PHOTO_QUESTS].map(buildQuestProgress),
    );
  },

  /**
   * Return all captured plant photos.
   */
  async getPlantPhotoCollection(): Promise<IdentifiedPlantPhoto[]> {
    return loadJson<IdentifiedPlantPhoto[]>(STORAGE_KEYS.PHOTOS, []);
  },

  /**
   * Return the number of unique species identified.
   */
  async getSpeciesIdentifiedCount(): Promise<number> {
    const set = await loadJson<string[]>(STORAGE_KEYS.SPECIES_SET, []);
    return set.length;
  },

  /**
   * Return total XP earned from photo captures.
   */
  async getTotalPhotoXp(): Promise<number> {
    const photos = await loadJson<IdentifiedPlantPhoto[]>(STORAGE_KEYS.PHOTOS, []);
    return photos.reduce((sum, p) => sum + (p.xpAwarded || 0), 0);
  },

  /**
   * Claim a completed quest on the server and locally mark it claimed.
   */
  async claimQuest(
    questId: string,
  ): Promise<{ success: boolean; xpAwarded: number; creditsAwarded: number }> {
    try {
      const res = await api.post("/mobile/sync", {
        type: "quest_claim",
        questId,
      });

      const xpAwarded = res.data?.xpAwarded ?? 0;
      const creditsAwarded = res.data?.creditsAwarded ?? 0;

      // Mark as claimed locally
      const progress = await loadJson<QuestProgress[]>(STORAGE_KEYS.QUEST_PROGRESS, []);
      const updated = progress.map((q) =>
        q.questId === questId
          ? { ...q, claimed: true, claimedAt: new Date().toISOString() }
          : q,
      );
      await saveJson(STORAGE_KEYS.QUEST_PROGRESS, updated);

      return { success: true, xpAwarded, creditsAwarded };
    } catch (err) {
      logger.warn("[PlantIdQuest] Failed to claim quest on server", {
        source: "plantIdQuest",
        context: "claim",
        metadata: { questId },
      });
      // Still mark as claimed locally so UX isn't blocked
      const progress = await loadJson<QuestProgress[]>(STORAGE_KEYS.QUEST_PROGRESS, []);
      const updated = progress.map((q) =>
        q.questId === questId
          ? { ...q, claimed: true, claimedAt: new Date().toISOString() }
          : q,
      );
      await saveJson(STORAGE_KEYS.QUEST_PROGRESS, updated);
      return { success: false, xpAwarded: 0, creditsAwarded: 0 };
    }
  },

  /**
   * Sync quest progress with the server via POST /api/v1/mobile/sync.
   */
  async syncQuestProgress(): Promise<void> {
    try {
      const progress = await this.getUserQuestProgress();
      const photos = await this.getPlantPhotoCollection();
      const speciesCount = await this.getSpeciesIdentifiedCount();

      await api.post("/mobile/sync", {
        type: "plant_id_quest_sync",
        payload: {
          progress: progress.filter((q) => q.isCompleted),
          photos: photos.filter((p) => !p.usedForTraining).slice(0, 10),
          speciesIdentified: speciesCount,
        },
      });
    } catch {
      // Silent fail — data is persisted locally
    }
  },
};

export default plantIdQuest;
