import { useEffect, useCallback } from "react";
import { useGardenStore } from "@stores/gardenStore";
import { Crop } from "@/types";
import api from "@services/api";

export function useGarden() {
  const {
    gardens,
    selectedGardenId,
    crops,
    isLoading,
    error,
    fetchGardens,
    fetchPlots,
    purchasePlot,
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

  // Grant starter seeds on first garden creation
  const grantStarterSeeds = useCallback(async (gardenId: string) => {
    try {
      await api.post(`/garden/${gardenId}/starter-seeds`);
    } catch {
      // Silent fail - starter seeds are non-critical
    }
  }, []);

  const selectedGarden = gardens.find((g) => g.id === selectedGardenId);

  /** Number of purchased/owned plots */
  const plotCount = gardens.filter((g) => g.plotNumber).length;

  /** Whether the user can purchase additional plots */
  const canPurchaseMore = plotCount < 10;

  const handlePlantCrop = useCallback(
    async (name: string, species: string, plotX: number, plotY: number) => {
      if (!selectedGardenId) return null;
      return plantCrop(selectedGardenId, name, species, plotX, plotY);
    },
    [selectedGardenId, plantCrop],
  );

  const handleWaterCrop = useCallback(
    async (cropId: string) => {
      await waterCrop(cropId);
    },
    [waterCrop],
  );

  const handleFertilizeCrop = useCallback(
    async (cropId: string) => {
      await fertilizeCrop(cropId);
    },
    [fertilizeCrop],
  );

  const handleHarvestCrop = useCallback(
    async (cropId: string) => {
      await harvestCrop(cropId);
    },
    [harvestCrop],
  );

  const getCropById = useCallback(
    (cropId: string): Crop | undefined => {
      return crops.find((c) => c.id === cropId);
    },
    [crops],
  );

  return {
    gardens,
    selectedGarden,
    selectedGardenId,
    crops,
    isLoading,
    error,
    plotCount,
    canPurchaseMore,
    refreshGardens: fetchGardens,
    fetchPlots,
    purchasePlot,
    selectGarden,
    plantCrop: handlePlantCrop,
    waterCrop: handleWaterCrop,
    fertilizeCrop: handleFertilizeCrop,
    harvestCrop: handleHarvestCrop,
    getCropById,
    clearError,
    grantStarterSeeds,
  };
}
