import api from './api';

const PlotsService = {
  async getPlots(page = 1, limit = 20) {
    try {
      const res = await api.get(`/plots?page=${page}&limit=${limit}`);
      return res.data;
    } catch { return { data: [], total: 0 }; }
  },

  async getPricing() {
    try {
      const res = await api.get('/plots/pricing');
      return res.data;
    } catch { return { currentPlots: 0, maxPlots: 1, nextPlotPrice: 100, pricingTiers: [100], canPurchase: false, userLevel: 1 }; }
  },

  async purchasePlot() {
    try {
      const res = await api.post('/plots', {});
      return res.data;
    } catch { throw new Error('Failed to purchase plot'); }
  },

  async getPlot(id: string) {
    try {
      const res = await api.get(`/plots/${id}`);
      return res.data;
    } catch { return null; }
  },

  async updatePlot(id: string, data: Record<string, unknown>) {
    try {
      const res = await api.patch(`/plots/${id}`, data);
      return res.data;
    } catch { throw new Error('Failed to update plot'); }
  },

  async soilCheck(id: string, data: Record<string, unknown>) {
    try {
      const res = await api.post(`/plots/${id}/soil-check`, data);
      return res.data;
    } catch { throw new Error('Failed to check soil'); }
  },

  async moveCrop(plotId: string, cropId: string, targetPlotX: number, targetPlotY: number, targetGardenId?: string) {
    try {
      const res = await api.post(`/plots/${plotId}/move-crop`, { cropId, targetPlotX, targetPlotY, targetGardenId });
      return res.data;
    } catch { throw new Error('Failed to move crop'); }
  },
};

export default PlotsService;
