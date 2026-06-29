import api from '@services/api';
import type { ShopItem, Fertilizer, InventoryItem } from "@/types";

export interface BuyItemResponse {
  success: boolean;
  item: ShopItem | Fertilizer;
  inventory: InventoryItem;
  greenCredits: number;
  ecoPoints: number;
  message: string;
}

const ShopService = {
  /**
   * Get all shop items, optionally filtered by category.
   */
  async getShopItems(category?: string, page = 1, limit = 20): Promise<{ data: ShopItem[]; total: number }> {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (category) params.set('category', category);
      const res = await api.get(`/shop?${params.toString()}`);
      return res.data;
    } catch {
      return { data: [], total: 0 };
    }
  },

  /**
   * Buy an item from the shop.
   */
  async buyItem(
    itemId: string,
    quantity = 1,
    couponCode?: string,
    gardenId?: string,
  ): Promise<BuyItemResponse> {
    try {
      const body: Record<string, unknown> = { itemId, quantity };
      if (couponCode) body.couponCode = couponCode;
      if (gardenId) body.gardenId = gardenId;
      const res = await api.post('/shop/buy', body);
      return res.data;
    } catch {
      throw new Error('Failed to purchase item');
    }
  },

  /**
   * Get all available tools.
   */
  async getTools(): Promise<ShopItem[]> {
    try {
      const res = await api.get('/tools');
      return res.data;
    } catch {
      return [];
    }
  },

  /**
   * Get all available fertilizers.
   */
  async getFertilizers(): Promise<Fertilizer[]> {
    try {
      const res = await api.get('/fertilizers');
      return res.data;
    } catch {
      return [];
    }
  },
};

export default ShopService;
