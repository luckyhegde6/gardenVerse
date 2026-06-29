import { create } from "zustand";
import PlotsService from "@services/plots";
import { Garden, PlotPricing } from "@/types";

interface PlotsState {
  plots: Garden[];
  selectedPlotId: string | null;
  pricing: PlotPricing | null;
  isPurchasing: boolean;
  isCheckingSoil: boolean;
  isLoading: boolean;
  error: string | null;

  fetchPlots: () => Promise<void>;
  selectPlot: (plotId: string) => void;
  fetchPricing: () => Promise<void>;
  purchasePlot: () => Promise<any>;
  soilCheck: (plotId: string, data: Record<string, unknown>) => Promise<any>;
  moveCrop: (
    plotId: string,
    cropId: string,
    targetPlotX: number,
    targetPlotY: number,
    targetGardenId?: string,
  ) => Promise<any>;
  clearError: () => void;
}

export const usePlotsStore = create<PlotsState>()((set, get) => ({
  plots: [],
  selectedPlotId: null,
  pricing: null,
  isPurchasing: false,
  isCheckingSoil: false,
  isLoading: false,
  error: null,

  fetchPlots: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await PlotsService.getPlots();
      const data = result.data ?? [];
      set({
        plots: data,
        isLoading: false,
        selectedPlotId: get().selectedPlotId || data[0]?.id || null,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch plots",
        isLoading: false,
      });
    }
  },

  selectPlot: (plotId: string) => set({ selectedPlotId: plotId }),

  fetchPricing: async () => {
    try {
      const pricing = await PlotsService.getPricing();
      set({ pricing });
    } catch {
      // Silently fail — pricing is not critical
    }
  },

  purchasePlot: async () => {
    set({ isPurchasing: true, error: null });
    try {
      const result = await PlotsService.purchasePlot();
      set((state) => ({
        plots: [...state.plots, result.garden],
        isPurchasing: false,
      }));
      return result;
    } catch (error: any) {
      set({
        error: error.message || "Failed to purchase plot",
        isPurchasing: false,
      });
      throw error;
    }
  },

  soilCheck: async (plotId: string, data: Record<string, unknown>) => {
    set({ isCheckingSoil: true, error: null });
    try {
      const result = await PlotsService.soilCheck(plotId, data);
      set({ isCheckingSoil: false });
      return result;
    } catch (error: any) {
      set({
        error: error.message || "Soil check failed",
        isCheckingSoil: false,
      });
      throw error;
    }
  },

  moveCrop: async (
    plotId: string,
    cropId: string,
    targetPlotX: number,
    targetPlotY: number,
    targetGardenId?: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await PlotsService.moveCrop(
        plotId,
        cropId,
        targetPlotX,
        targetPlotY,
        targetGardenId,
      );
      set({ isLoading: false });
      return result;
    } catch (error: any) {
      set({
        error: error.message || "Failed to move crop",
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
