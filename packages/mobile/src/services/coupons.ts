import api from './api';
import type { CouponRedemption } from '../types';

const CouponService = {
  /**
   * Redeem a coupon code for a discount on a purchase.
   */
  async redeemCoupon(code: string, purchaseAmount: number): Promise<CouponRedemption> {
    try {
      const res = await api.post('/coupons/redeem', { code, purchaseAmount });
      return res.data;
    } catch {
      return {
        valid: false,
        code,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        originalAmount: purchaseAmount,
        finalAmount: purchaseAmount,
        errors: ['Failed to redeem coupon. Please try again.'],
      };
    }
  },
};

export default CouponService;
