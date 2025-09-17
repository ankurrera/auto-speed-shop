// Track Order API service
// Provides functions to interact with order status tracking
import { supabase } from "@/integrations/supabase/client";

export interface OrderStatusResponse {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface OrderStatusUpdateRequest {
  status: string;
  payment_status?: string;
}

export interface OrderStatusUpdateResponse {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  updated_at: string;
}

/**
 * Get order status and history for tracking
 * Corresponds to GET /orders/:id/status
 */
export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    const { data, error } = await supabase.rpc('get_order_status', {
      target_order_id: orderId,
      requesting_user_id: userId
    });

    if (error) {
      throw new Error(`Failed to get order status: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    return data[0];
  } catch (error) {
    console.error("Get order status error:", error);
    throw error;
  }
}

/**
 * Update order status (admin only)
 * Corresponds to PATCH /orders/:id/status
 */
export async function updateOrderStatus(
  orderId: string, 
  updateData: OrderStatusUpdateRequest
): Promise<OrderStatusUpdateResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const { data, error } = await supabase.rpc('admin_update_order_status', {
      requesting_user_id: session.user.id,
      target_order_id: orderId,
      new_status: updateData.status,
      new_payment_status: updateData.payment_status || null
    });

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`Failed to update order ${orderId}`);
    }

    return data[0];
  } catch (error) {
    console.error("Update order status error:", error);
    throw error;
  }
}

/**
 * Helper function to validate status transitions
 * Ensures status updates follow the logical flow
 */
export function validateStatusTransition(currentStatus: string, newStatus: string): boolean {
  const statusFlow = {
    'pending_admin_review': ['invoice_sent', 'cancelled'],
    'invoice_sent': ['invoice_accepted', 'invoice_declined', 'cancelled'],
    'invoice_accepted': ['paypal_credentials_shared', 'cancelled'],
    'invoice_declined': ['cancelled'],
    'paypal_credentials_shared': ['payment_pending', 'cancelled'],
    'payment_pending': ['payment_submitted', 'cancelled'],
    'payment_submitted': ['payment_verified', 'cancelled'],
    'payment_verified': ['confirmed', 'cancelled'],
    'confirmed': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': [],
    'cancelled': []
  };

  const allowedTransitions = statusFlow[currentStatus as keyof typeof statusFlow];
  return allowedTransitions ? allowedTransitions.includes(newStatus) : false;
}