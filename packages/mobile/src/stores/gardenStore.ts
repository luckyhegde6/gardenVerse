import { create } from 'zustand';
import api from '../services/api';
import { Garden, Crop, CropStatus } from '../types';

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
    seedId: string,
    plotX: number,
    plotY: number
  ) => Promise<Crop>;
  waterCrop: (cropId: string) => Promise<void>;
  fertilizeCrop: (cropId: string) => Promise<void>;
  harvestCrop: (cropId: string) => Promise<void>;
  updateCropGrowth: (cropId: string, growthStage: number) => void;
  clearError: () => void;
}

export const useGardenStore = create<GardenState>((set, get) => ({
  gardens: [],
  selectedGardenId: null,
  crops: [],
  isLoading: false,
  error: null,

  fetchGardens: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Garden[]>('/gardens');
      const gardens = response.data;
      const selectedGardenId = gardens[0]?.id ?? null;
      set({
        gardens,
        selectedGardenId,
        crops: gardens[0]?.crops ?? [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch gardens',
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
    seedId: string,
    plotX: number,
    plotY: number
  ) => {
    set({ isLoading: true });
    try {
      const response = await api.post<Crop>(`/gardens/${gardenId}/crops`, {
        seedId,
        plotX,
        plotY,
      });
      const newCrop = response.data;
      set((state) => ({
        crops: [...state.crops, newCrop],
        isLoading: false,
      }));
      return newCrop;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to plant crop',
        isLoading: false,
      });
      throw error;
    }
  },

  waterCrop: async (cropId: string) => {
    try {
      await api.post(`/crops/${cropId}/water`);
      set((state) => ({
        crops: state.crops.map((c) =>
          c.id === cropId
            ? { ...c, hydration: Math.min(c.hydration + 20, 100) }
            : c
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to water crop',
      });
    }
  },

  fertilizeCrop: async (cropId: string) => {
    try {
      await api.post(`/crops/${cropId}/fertilize`);
      set((state) => ({
        crops: state.crops.map((c) =>
          c.id === cropId
            ? { ...c, nutrientLevel: Math.min(c.nutrientLevel + 30, 100) }
            : c
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fertilize crop',
      });
    }
  },

  harvestCrop: async (cropId: string) => {
    try {
      await api.post(`/crops/${cropId}/harvest`);
      set((state) => ({
        crops: state.crops.map((c) =>
          c.id === cropId ? { ...c, status: CropStatus.HARVESTED } : c
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to harvest crop',
      });
    }
  },

  updateCropGrowth: (cropId: string, growthStage: number) => {
    set((state) => ({
      crops: state.crops.map((c) =>
        c.id === cropId ? { ...c, growthStage } : c
      ),
    }));
  },

  clearError: () => set({ error: null }),
}));
