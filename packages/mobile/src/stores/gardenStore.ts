import { create } from "zustand";
import api from "@services/api";
import PlotsService from "@services/plots";
import { Garden, Crop, CropStatus } from "@/types";
import { HapticFeedback } from "@utils/haptics";

interface GardenState {
  gardens: Garden[];
  selectedGardenId: string | null;
  crops: Crop[];
  isLoading: boolean;
  error: string | null;

  fetchGardens: () => Promise<void>;
  selectGarden: (gardenId: string) => void;
  plantCrop: (
    gardenId: string,
    name: string,
    species: string,
    plotX: number,
    plotY: number,
  ) => Promise<Crop>;
  waterCrop: (cropId: string) => Promise<void>;
  fertilizeCrop: (cropId: string) => Promise<void>;
  harvestCrop: (cropId: string) => Promise<void>;
  updateCropGrowth: (cropId: string, growthStage: number) => void;
  syncCrops: (crops: Crop[]) => void;
  fetchPlots: () => Promise<void>;
  purchasePlot: () => Promise<any>;
  clearError: () => void;
}

export const useGardenStore = create<GardenState>()(
  (set, get) => ({
    gardens: [],
    selectedGardenId: null,
    crops: [],
    isLoading: false,
    error: null,

    fetchGardens: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get("/gardens");
        const gardens = response.data.data ?? [];
        const selectedGardenId = gardens[0]?.id ?? null;
        set({
          gardens,
          selectedGardenId,
          crops: gardens[0]?.crops ?? [],
          isLoading: false,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.message || "Failed to fetch gardens",
          isLoading: false,
        });
      }
    },

    selectGarden: (gardenId: string) => {
      const garden = get().gardens.find((g) => g.id === gardenId);
      set({
        selectedGardenId: gardenId,
        crops: garden?.crops ?? [],
      });
    },

    plantCrop: async (
      gardenId: string,
      name: string,
      species: string,
      plotX: number,
      plotY: number,
    ) => {
      set({ isLoading: true });
      try {
        const response = await api.post<Crop>(`/crops`, {
          name,
          species,
          plotX,
          plotY,
          gardenId,
        });
        const newCrop = response.data;
        set((state) => ({
          crops: [...state.crops, newCrop],
          isLoading: false,
        }));
        return newCrop;
      } catch (error: any) {
        set({
          error: error.response?.data?.message || "Failed to plant crop",
          isLoading: false,
        });
        throw error;
      }
    },

    waterCrop: async (cropId: string) => {
      try {
        HapticFeedback.action();
        const now = new Date().toISOString();
        await api.patch(`/crops/${cropId}`, { action: "water" });
        set((state) => ({
          crops: state.crops.map((c) =>
            c.id === cropId
              ? { ...c, hydration: Math.min(c.hydration + 20, 100), lastWateredAt: now }
              : c,
          ),
        }));
      } catch (error: any) {
        set({
          error: error.response?.data?.message || "Failed to water crop",
        });
      }
    },

    fertilizeCrop: async (cropId: string) => {
      try {
        HapticFeedback.action();
        const now = new Date().toISOString();
        await api.patch(`/crops/${cropId}`, { action: "fertilize" });
        set((state) => ({
          crops: state.crops.map((c) =>
            c.id === cropId
              ? { ...c, nutrientLevel: Math.min(c.nutrientLevel + 30, 100), lastFertilizedAt: now }
              : c,
          ),
        }));
      } catch (error: any) {
        set({
          error: error.response?.data?.message || "Failed to fertilize crop",
        });
      }
    },

    harvestCrop: async (cropId: string) => {
      try {
        await api.patch(`/crops/${cropId}`, { action: "harvest" });
        set((state) => ({
          crops: state.crops.map((c) =>
            c.id === cropId ? { ...c, status: CropStatus.HARVESTED } : c,
          ),
        }));
      } catch (error: any) {
        set({
          error: error.response?.data?.message || "Failed to harvest crop",
        });
      }
    },

    updateCropGrowth: (cropId: string, growthStage: number) => {
      set((state) => ({
        crops: state.crops.map((c) =>
          c.id === cropId ? { ...c, growthStage } : c,
        ),
      }));
    },

    syncCrops: (crops: Crop[]) => {
      set({ crops });
    },

    fetchPlots: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await PlotsService.getPlots();
        const plots = result.data ?? [];
        set((state) => {
          // Merge plot data into existing gardens, preferring server data
          const plotMap = new Map(plots.map((p: Garden) => [p.id, p]));
          const merged = state.gardens.map((g) =>
            plotMap.has(g.id) ? { ...g, ...(plotMap.get(g.id) as Garden) } : g,
          );
          // Add any new plots not already in gardens
          const existingIds = new Set(state.gardens.map((g) => g.id));
          const newPlots = plots.filter((p: Garden) => !existingIds.has(p.id));
          return {
            gardens: [...merged, ...newPlots],
            isLoading: false,
          };
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.message || "Failed to fetch plots",
          isLoading: false,
        });
      }
    },

    purchasePlot: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await PlotsService.purchasePlot();
        set((state) => ({
          gardens: [...state.gardens, result.garden],
          isLoading: false,
        }));
        return result;
      } catch (error: any) {
        set({
          error: error.response?.data?.message || "Failed to purchase plot",
          isLoading: false,
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  })
);
