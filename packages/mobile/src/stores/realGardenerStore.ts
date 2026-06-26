import { create } from "zustand";
import RealGardenerService from "../services/realGardener";
import { RealGardenerStatus, EncouragementTip } from "../types";

interface RealGardenerState {
  status: RealGardenerStatus | null;
  encouragement: EncouragementTip[];
  isVerifying: boolean;
  isLoading: boolean;
  error: string | null;

  fetchStatus: () => Promise<void>;
  verify: (data?: {
    gardenPhotoUrl?: string;
    description?: string;
    location?: string;
  }) => Promise<any>;
  fetchEncouragement: () => Promise<void>;
  clearError: () => void;
}

export const useRealGardenerStore = create<RealGardenerState>()((set) => ({
  status: null,
  encouragement: [],
  isVerifying: false,
  isLoading: false,
  error: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await RealGardenerService.getStatus();
      set({ status, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch gardener status",
        isLoading: false,
      });
    }
  },

  verify: async (data) => {
    set({ isVerifying: true, error: null });
    try {
      const result = await RealGardenerService.verify(data ?? {});
      if (result.isRealGardener) {
        set((state) => ({
          status: state.status
            ? {
                ...state.status,
                isRealGardener: true,
                badge: result.badge,
                verifiedAt: result.verifiedAt,
              }
            : result,
        }));
      }
      set({ isVerifying: false });
      return result;
    } catch (error: any) {
      set({
        error: error.message || "Verification failed",
        isVerifying: false,
      });
      throw error;
    }
  },

  fetchEncouragement: async () => {
    try {
      const tips = await RealGardenerService.getEncouragement();
      set({ encouragement: tips ?? [] });
    } catch {
      // Silently fail — encouragement is supplementary
    }
  },

  clearError: () => set({ error: null }),
}));
