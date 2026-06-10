import { useState, useEffect, useCallback, useRef } from "react";
import { plantIdQuest } from "../services/plantIdentificationQuest";
import type { QuestProgress, IdentifiedPlantPhoto } from "../types";

export interface UsePlantIdQuestReturn {
  questProgress: QuestProgress[];
  photos: IdentifiedPlantPhoto[];
  totalXpAwarded: number;
  speciesIdentified: number;
  loading: boolean;
  newlyCompletedQuest: QuestProgress | null;
  onPlantIdentified: (
    speciesId: string,
    speciesName: string,
    confidence: number,
  ) => Promise<{ xpAwarded: number; isNewSpecies: boolean }>;
  onPhotoCaptured: (
    imageUri: string,
    speciesId: string,
    speciesName: string,
    confidence: number,
  ) => Promise<{ xpAwarded: number }>;
  claimQuestReward: (
    questId: string,
  ) => Promise<{ success: boolean; xpAwarded: number; creditsAwarded: number }>;
  clearNewlyCompleted: () => void;
  refresh: () => Promise<void>;
}

export function usePlantIdQuest(): UsePlantIdQuestReturn {
  const [questProgress, setQuestProgress] = useState<QuestProgress[]>([]);
  const [photos, setPhotos] = useState<IdentifiedPlantPhoto[]>([]);
  const [totalXpAwarded, setTotalXpAwarded] = useState(0);
  const [speciesIdentified, setSpeciesIdentified] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newlyCompletedQuest, setNewlyCompletedQuest] =
    useState<QuestProgress | null>(null);

  // Track previous progress to detect newly completed quests
  const prevProgressRef = useRef<QuestProgress[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [progress, photoCollection, speciesCount, xp] = await Promise.all([
        plantIdQuest.getUserQuestProgress(),
        plantIdQuest.getPlantPhotoCollection(),
        plantIdQuest.getSpeciesIdentifiedCount(),
        plantIdQuest.getTotalPhotoXp(),
      ]);
      setQuestProgress(progress);
      setPhotos(photoCollection);
      setSpeciesIdentified(speciesCount);
      setTotalXpAwarded(xp);
    } catch {
      // Silent fail — data is persisted locally
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Detect newly completed quests
  useEffect(() => {
    if (prevProgressRef.current.length === 0) {
      prevProgressRef.current = questProgress;
      return;
    }
    const prev = prevProgressRef.current;
    const newlyCompleted = questProgress.find(
      (q) =>
        q.isCompleted &&
        !q.claimed &&
        !prev.find((p) => p.questId === q.questId)?.isCompleted,
    );
    if (newlyCompleted) {
      setNewlyCompletedQuest(newlyCompleted);
    }
    prevProgressRef.current = questProgress;
  }, [questProgress]);

  const onPlantIdentified = useCallback(
    async (
      speciesId: string,
      speciesName: string,
      confidence: number,
    ): Promise<{ xpAwarded: number; isNewSpecies: boolean }> => {
      const result = await plantIdQuest.checkAndAwardIdentificationQuest(
        speciesId,
        speciesName,
        confidence,
      );
      setQuestProgress(result.questProgress);
      setSpeciesIdentified(await plantIdQuest.getSpeciesIdentifiedCount());
      return { xpAwarded: result.xpAwarded, isNewSpecies: result.isNewSpecies };
    },
    [],
  );

  const onPhotoCaptured = useCallback(
    async (
      imageUri: string,
      speciesId: string,
      speciesName: string,
      confidence: number,
    ): Promise<{ xpAwarded: number }> => {
      const result = await plantIdQuest.checkAndAwardPhotoQuest(
        imageUri,
        speciesId,
        speciesName,
        confidence,
      );
      setQuestProgress(result.questProgress);
      setPhotos(await plantIdQuest.getPlantPhotoCollection());
      setTotalXpAwarded(await plantIdQuest.getTotalPhotoXp());
      return { xpAwarded: result.xpAwarded };
    },
    [],
  );

  const claimQuestReward = useCallback(
    async (
      questId: string,
    ): Promise<{ success: boolean; xpAwarded: number; creditsAwarded: number }> => {
      const result = await plantIdQuest.claimQuest(questId);
      if (result.success) {
        setQuestProgress(await plantIdQuest.getUserQuestProgress());
      }
      return result;
    },
    [],
  );

  const clearNewlyCompleted = useCallback(() => {
    setNewlyCompletedQuest(null);
  }, []);

  return {
    questProgress,
    photos,
    totalXpAwarded,
    speciesIdentified,
    loading,
    newlyCompletedQuest,
    onPlantIdentified,
    onPhotoCaptured,
    claimQuestReward,
    clearNewlyCompleted,
    refresh,
  };
}

export default usePlantIdQuest;
