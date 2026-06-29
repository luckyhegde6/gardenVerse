import { create } from "zustand";
import ShopService from "@services/shop";
import CouponService from "@services/coupons";
import { ShopItem, Fertilizer, InventoryItem, CouponRedemption } from "@/types";
import { getItem, StorageKeys } from "@services/storage";

interface ShopState {
  items: ShopItem[];
  fertilizers: Fertilizer[];
  tools: ShopItem[];
  inventory: InventoryItem[];
  isLoading: boolean;
  isBuying: boolean;
  error: string | null;

  fetchItems: (category?: string) => Promise<void>;
  fetchFertilizers: () => Promise<void>;
  fetchTools: () => Promise<void>;
  buyItem: (
    itemId: string,
    quantity?: number,
    couponCode?: string,
    gardenId?: string,
  ) => Promise<any>;
  redeemCoupon: (
    code: string,
    purchaseAmount: number,
  ) => Promise<CouponRedemption>;
  loadInventory: () => Promise<void>;
  clearError: () => void;
}

export const useShopStore = create<ShopState>()((set) => ({
  items: [],
  fertilizers: [],
  tools: [],
  inventory: [],
  isLoading: false,
  isBuying: false,
  error: null,

  fetchItems: async (category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ShopService.getShopItems(category);
      set({ items: result.data ?? [], isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch shop items",
        isLoading: false,
      });
    }
  },

  fetchFertilizers: async () => {
    try {
      const result = await ShopService.getFertilizers();
      set({ fertilizers: result });
    } catch {
      // Silently fail — fertilizers are supplementary
    }
  },

  fetchTools: async () => {
    try {
      const result = await ShopService.getTools();
      set({ tools: result });
    } catch {
      // Silently fail — tools are supplementary
    }
  },

  buyItem: async (
    itemId: string,
    quantity = 1,
    couponCode?: string,
    gardenId?: string,
  ) => {
    set({ isBuying: true, error: null });
    try {
      const result = await ShopService.buyItem(
        itemId,
        quantity,
        couponCode,
        gardenId,
      );
      set({ isBuying: false });
      return result;
    } catch (error: any) {
      set({
        error: error.message || "Purchase failed",
        isBuying: false,
      });
      throw error;
    }
  },

  redeemCoupon: async (code: string, purchaseAmount: number) => {
    try {
      return await CouponService.redeemCoupon(code, purchaseAmount);
    } catch {
      return {
        valid: false,
        code,
        discountType: "PERCENTAGE",
        discountValue: 0,
        discountAmount: 0,
        originalAmount: purchaseAmount,
        finalAmount: purchaseAmount,
        errors: ["Failed to validate coupon"],
      };
    }
  },

  loadInventory: async () => {
    try {
      const cached = await getItem(StorageKeys.INVENTORY_ITEMS);
      if (cached) {
        set({ inventory: JSON.parse(cached) });
      }
    } catch {
      // Silently fail — inventory is cached data
    }
  },

  clearError: () => set({ error: null }),
}));
