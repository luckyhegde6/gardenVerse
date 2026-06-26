import api from './api';
import type { RealGardenerStatus, EncouragementTip } from '../types';

const RealGardenerService = {
  /**
   * Get the user's real gardener verification status.
   */
  async getStatus(): Promise<RealGardenerStatus> {
    try {
      const res = await api.get('/real-gardener');
      return res.data;
    } catch {
      return {
        isRealGardener: false,
        gardenCount: 0,
        soilCheckCount: 0,
      };
    }
  },

  /**
   * Submit verification to become a real gardener.
   */
  async verify(data?: Record<string, unknown>): Promise<RealGardenerStatus> {
    try {
      const res = await api.post('/real-gardener/verify', data ?? {});
      return res.data;
    } catch {
      throw new Error('Failed to submit verification');
    }
  },

  /**
   * Get daily encouragement tips for the gardener.
   */
  async getEncouragement(): Promise<EncouragementTip[]> {
    try {
      const res = await api.get('/real-gardener/encouragement');
      return res.data;
    } catch {
      return [];
    }
  },
};

export default RealGardenerService;
