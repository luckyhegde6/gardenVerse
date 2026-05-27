import { useEffect, useCallback } from 'react';
import { useGardenStore } from '../stores/gardenStore';
import { Crop } from '../types';

export function useGarden() {
  const {
    gardens,
    selectedGardenId,
    crops,
    isLoading,
    error,
    fetchGardens,
    selectGarden,
    plantCrop,
    waterCrop,
    fertilizeCrop,
    harvestCrop,
    clearError,
  } = useGardenStore();

  useEffect(() => {
    if (gardens.length === 0) {
      fetchGardens();
    }
  }, [gardens.length, fetchGardens]);

  const selectedGarden = gardens.find((g) => g.id === selectedGardenId);

  const handlePlantCrop = useCallback(
    async (seedId: string, plotX: number, plotY: number) => {
      if (!selectedGardenId) return null;
      return plantCrop(selectedGardenId, seedId, plotX, plotY);
    },
    [selectedGardenId, plantCrop]
  );

  const handleWaterCrop = useCallback(
    async (cropId: string) => {
      await waterCrop(cropId);
    },
    [waterCrop]
  );

  const handleFertilizeCrop = useCallback(
    async (cropId: string) => {
      await fertilizeCrop(cropId);
    },
    [fertilizeCrop]
  );

  const handleHarvestCrop = useCallback(
    async (cropId: string) => {
      await harvestCrop(cropId);
    },
    [harvestCrop]
  );

  const getCropById = useCallback(
    (cropId: string): Crop | undefined => {
      return crops.find((c) => c.id === cropId);
    },
    [crops]
  );

  return {
    gardens,
    selectedGarden,
    selectedGardenId,
    crops,
    isLoading,
    error,
    refreshGardens: fetchGardens,
    selectGarden,
    plantCrop: handlePlantCrop,
    waterCrop: handleWaterCrop,
    fertilizeCrop: handleFertilizeCrop,
    harvestCrop: handleHarvestCrop,
    getCropById,
    clearError,
  };
}
