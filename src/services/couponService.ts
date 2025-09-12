import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/database.types';

export type Coupon = Database['public']['Tables']['coupons']['Row'] & {
  created_by_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

export type UserCoupon = Database['public']['Tables']['user_coupons']['Row'] & {
  coupon?: Coupon;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

export type CouponInsert = Database['public']['Tables']['coupons']['Insert'];
export type CouponUpdate = Database['public']['Tables']['coupons']['Update'];
export type UserCouponInsert = Database['public']['Tables']['user_coupons']['Insert'];

export class CouponService {
  /**
   * Create a new coupon
   */
  static async createCoupon(data: {
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    valid_until?: string;
    created_by: string;
  }): Promise<Coupon> {
    const couponData: CouponInsert = {
      code: data.code.toUpperCase(),
      description: data.description,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_order_amount: data.min_order_amount,
      max_discount_amount: data.max_discount_amount,
      usage_limit: data.usage_limit,
      valid_until: data.valid_until,
      created_by: data.created_by,
      status: 'active',
    };

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert(couponData)
      .select(`
        *,
        created_by_user:profiles!coupons_created_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create coupon: ${error.message}`);
    }

    return coupon as Coupon;
  }

  /**
   * Get all coupons (admin view)
   */
  static async getAllCoupons(filters?: {
    status?: string;
    discount_type?: string;
  }): Promise<Coupon[]> {
    let query = supabase
      .from('coupons')
      .select(`
        *,
        created_by_user:profiles!coupons_created_by_fkey(
          first_name,
          last_name,
          email
        )
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.discount_type) {
      query = query.eq('discount_type', filters.discount_type);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch coupons: ${error.message}`);
    }

    return data as Coupon[];
  }

  /**
   * Update a coupon
   */
  static async updateCoupon(
    couponId: string,
    updates: CouponUpdate
  ): Promise<Coupon> {
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', couponId)
      .select(`
        *,
        created_by_user:profiles!coupons_created_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update coupon: ${error.message}`);
    }

    return coupon as Coupon;
  }

  /**
   * Delete a coupon
   */
  static async deleteCoupon(couponId: string): Promise<void> {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) {
      throw new Error(`Failed to delete coupon: ${error.message}`);
    }
  }

  /**
   * Assign coupon to users
   */
  static async assignCouponToUsers(
    couponId: string,
    userIds: string[]
  ): Promise<UserCoupon[]> {
    const assignments = userIds.map(userId => ({
      user_id: userId,
      coupon_id: couponId,
      status: 'assigned' as const,
    }));

    const { data, error } = await supabase
      .from('user_coupons')
      .insert(assignments)
      .select(`
        *,
        coupon:coupons(*),
        user:profiles!user_coupons_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `);

    if (error) {
      throw new Error(`Failed to assign coupons: ${error.message}`);
    }

    return data as UserCoupon[];
  }

  /**
   * Get user's assigned coupons
   */
  static async getUserCoupons(
    userId: string,
    status?: 'assigned' | 'used' | 'expired'
  ): Promise<UserCoupon[]> {
    let query = supabase
      .from('user_coupons')
      .select(`
        *,
        coupon:coupons(*)
      `)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user coupons: ${error.message}`);
    }

    return data as UserCoupon[];
  }

  /**
   * Validate and apply coupon at checkout
   */
  static async validateCoupon(
    code: string,
    userId: string,
    orderAmount: number
  ): Promise<{
    valid: boolean;
    coupon?: Coupon;
    userCoupon?: UserCoupon;
    discount?: number;
    error?: string;
  }> {
    // First, check if coupon exists and is active
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (couponError || !coupon) {
      return { valid: false, error: 'Invalid or inactive coupon code' };
    }

    // Check if coupon is expired
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { valid: false, error: 'Coupon has expired' };
    }

    // Check if user has this coupon assigned
    const { data: userCoupon, error: userCouponError } = await supabase
      .from('user_coupons')
      .select('*')
      .eq('user_id', userId)
      .eq('coupon_id', coupon.id)
      .eq('status', 'assigned')
      .single();

    if (userCouponError || !userCoupon) {
      return { valid: false, error: 'Coupon not available for your account' };
    }

    // Check minimum order amount
    if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
      return {
        valid: false,
        error: `Minimum order amount of $${coupon.min_order_amount} required`,
      };
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, error: 'Coupon usage limit exceeded' };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (orderAmount * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = coupon.discount_value;
    }

    return {
      valid: true,
      coupon: coupon as Coupon,
      userCoupon: userCoupon as UserCoupon,
      discount,
    };
  }

  /**
   * Mark coupon as used
   */
  static async useCoupon(
    userCouponId: string,
    orderId: string
  ): Promise<UserCoupon> {
    const { data: userCoupon, error } = await supabase
      .from('user_coupons')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        order_id: orderId,
      })
      .eq('id', userCouponId)
      .select(`
        *,
        coupon:coupons(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to mark coupon as used: ${error.message}`);
    }

    // Increment used_count on the coupon
    await supabase.rpc('increment_coupon_usage', {
      coupon_id: userCoupon.coupon_id,
    });

    return userCoupon as UserCoupon;
  }

  /**
   * Get coupon usage statistics
   */
  static async getCouponStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    totalAssigned: number;
    totalUsed: number;
  }> {
    try {
      const [couponsResult, userCouponsResult] = await Promise.all([
        supabase.from('coupons').select('status'),
        supabase.from('user_coupons').select('status'),
      ]);

      if (couponsResult.error) {
        console.error('Error fetching coupons:', couponsResult.error);
        throw new Error(`Failed to fetch coupon statistics: ${couponsResult.error.message}`);
      }

      if (userCouponsResult.error) {
        console.error('Error fetching user coupons:', userCouponsResult.error);
        throw new Error(`Failed to fetch coupon statistics: ${userCouponsResult.error.message}`);
      }

      const stats = {
        total: couponsResult.data?.length || 0,
        active: 0,
        expired: 0,
        totalAssigned: userCouponsResult.data?.length || 0,
        totalUsed: 0,
      };

      couponsResult.data?.forEach((coupon) => {
        if (coupon.status === 'active') stats.active++;
        else if (coupon.status === 'expired') stats.expired++;
      });

      userCouponsResult.data?.forEach((userCoupon) => {
        if (userCoupon.status === 'used') stats.totalUsed++;
      });

      return stats;
    } catch (error) {
      console.error('Error in getCouponStats:', error);
      throw error;
    }
  }
}