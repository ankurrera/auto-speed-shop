import { supabase } from '../integrations/supabase/client';
import { Database } from '../database.types';

type Coupon = Database['public']['Tables']['coupons']['Row'];
type CouponInsert = Database['public']['Tables']['coupons']['Insert'];
type CouponUpdate = Database['public']['Tables']['coupons']['Update'];
type UserCoupon = Database['public']['Tables']['user_coupons']['Row'];
type UserCouponInsert = Database['public']['Tables']['user_coupons']['Insert'];

export interface CouponStats {
  total_coupons: number;
  active_coupons: number;
  used_coupons: number;
  total_uses: number;
}

export interface UserCouponWithDetails extends UserCoupon {
  coupons: Coupon;
}

export class CouponService {
  /**
   * Get all coupons (admin only)
   */
  static async getAllCoupons(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coupons:', error);
        throw new Error(`Failed to fetch coupons: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllCoupons:', error);
      throw error;
    }
  }

  /**
   * Get active coupons (for users)
   */
  static async getActiveCoupons(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active coupons:', error);
        throw new Error(`Failed to fetch active coupons: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveCoupons:', error);
      throw error;
    }
  }

  /**
   * Create a new coupon (admin only)
   */
  static async createCoupon(couponData: CouponInsert): Promise<Coupon> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert(couponData)
        .select()
        .single();

      if (error) {
        console.error('Error creating coupon:', error);
        throw new Error(`Failed to create coupon: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createCoupon:', error);
      throw error;
    }
  }

  /**
   * Update a coupon (admin only)
   */
  static async updateCoupon(id: string, updates: CouponUpdate): Promise<Coupon> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating coupon:', error);
        throw new Error(`Failed to update coupon: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateCoupon:', error);
      throw error;
    }
  }

  /**
   * Delete a coupon (admin only)
   */
  static async deleteCoupon(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting coupon:', error);
        throw new Error(`Failed to delete coupon: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteCoupon:', error);
      throw error;
    }
  }

  /**
   * Get coupon by code
   */
  static async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching coupon by code:', error);
        throw new Error(`Failed to fetch coupon: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getCouponByCode:', error);
      throw error;
    }
  }

  /**
   * Get user coupons
   */
  static async getUserCoupons(userId: string): Promise<UserCouponWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('user_coupons')
        .select(`
          *,
          coupons (*)
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching user coupons:', error);
        throw new Error(`Failed to fetch user coupons: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserCoupons:', error);
      throw error;
    }
  }

  /**
   * Assign coupon to user (admin only)
   */
  static async assignCouponToUser(userId: string, couponId: string): Promise<UserCoupon> {
    try {
      const { data, error } = await supabase
        .from('user_coupons')
        .insert({
          user_id: userId,
          coupon_id: couponId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error assigning coupon to user:', error);
        throw new Error(`Failed to assign coupon: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in assignCouponToUser:', error);
      throw error;
    }
  }

  /**
   * Use coupon (mark as used)
   */
  static async useCoupon(userId: string, couponId: string, orderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_coupons')
        .update({
          used_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq('user_id', userId)
        .eq('coupon_id', couponId)
        .is('used_at', null);

      if (error) {
        console.error('Error using coupon:', error);
        throw new Error(`Failed to use coupon: ${error.message}`);
      }

      // Increment uses count on the coupon
      const { error: updateError } = await supabase
        .from('coupons')
        .update({
          uses_count: supabase.sql`uses_count + 1`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', couponId);

      if (updateError) {
        console.error('Error updating coupon uses count:', updateError);
        // Don't throw here as the main operation succeeded
      }
    } catch (error) {
      console.error('Error in useCoupon:', error);
      throw error;
    }
  }

  /**
   * Validate coupon for use
   */
  static async validateCoupon(code: string, userId: string, orderAmount: number): Promise<{
    valid: boolean;
    coupon?: Coupon;
    userCoupon?: UserCoupon;
    error?: string;
  }> {
    try {
      // Get coupon by code
      const coupon = await this.getCouponByCode(code);
      if (!coupon) {
        return { valid: false, error: 'Coupon not found or inactive' };
      }

      // Check if coupon has expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, error: 'Coupon has expired' };
      }

      // Check if coupon has reached max uses
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        return { valid: false, error: 'Coupon has reached maximum uses' };
      }

      // Check minimum order amount
      if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
        return { 
          valid: false, 
          error: `Minimum order amount of $${coupon.min_order_amount} required` 
        };
      }

      // Check if user has this coupon assigned (if needed)
      const { data: userCoupon } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', userId)
        .eq('coupon_id', coupon.id)
        .is('used_at', null)
        .single();

      return {
        valid: true,
        coupon,
        userCoupon: userCoupon || undefined,
      };
    } catch (error) {
      console.error('Error in validateCoupon:', error);
      return { valid: false, error: 'Error validating coupon' };
    }
  }

  /**
   * Get coupon statistics (admin only)
   */
  static async getCouponStats(): Promise<CouponStats> {
    try {
      const { data, error } = await supabase.rpc('get_coupon_stats');

      if (error) {
        console.error('Error fetching coupon statistics:', error);
        throw new Error(`Failed to fetch coupon statistics: ${error.message}`);
      }

      return data as CouponStats;
    } catch (error) {
      console.error('Error in getCouponStats:', error);
      throw new Error('Failed to fetch coupon statistics');
    }
  }

  /**
   * Calculate discount amount
   */
  static calculateDiscount(coupon: Coupon, orderAmount: number): number {
    if (coupon.discount_type === 'percentage') {
      return Math.min((orderAmount * coupon.discount_value) / 100, orderAmount);
    } else {
      return Math.min(coupon.discount_value, orderAmount);
    }
  }
}