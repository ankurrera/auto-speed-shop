// API endpoint for order status history with real-time updates
import { supabase } from "@/integrations/supabase/client";

export interface OrderStatusHistoryEntry {
  status: string;
  timestamp: string;
  description: string;
  updatedBy?: string;
}

export interface OrderStatusUpdate {
  order_id: string;
  status: string;
  payment_status?: string;
  updated_at: string;
}

export async function getOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
  try {
    // Handle development mode with sample orders
    const isDevelopment = import.meta.env.DEV;
    const isSampleOrder = orderId.startsWith('sample-');
    
    if (isDevelopment && isSampleOrder) {
      // Return mock status history for sample orders
      return [
        {
          status: 'pending_admin_review',
          timestamp: new Date().toISOString(),
          description: 'Order placed and waiting for admin review'
        },
        {
          status: 'invoice_sent',
          timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          description: 'Invoice generated and sent to customer'
        }
      ];
    }

    // For real orders, we could query an order_status_history table if it existed
    // Since we're making minimal changes, we'll derive history from the current order status
    const { data: order, error } = await supabase
      .from("orders")
      .select("status, created_at, updated_at")
      .eq("id", orderId)
      .single();

    if (error) {
      throw new Error(`Failed to get order status: ${error.message}`);
    }

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Create a simple history based on current status
    const history: OrderStatusHistoryEntry[] = [
      {
        status: 'pending_admin_review',
        timestamp: order.created_at,
        description: 'Order placed and waiting for admin review'
      }
    ];

    // Add additional entries based on current status
    if (order.status !== 'pending_admin_review') {
      history.push({
        status: order.status,
        timestamp: order.updated_at,
        description: getStatusDescription(order.status)
      });
    }

    return history;
  } catch (error) {
    console.error("Get order status history error:", error);
    throw error;
  }
}

function getStatusDescription(status: string): string {
  switch (status) {
    case 'invoice_sent':
      return 'Invoice generated and sent to customer';
    case 'invoice_accepted':
      return 'Customer accepted the invoice';
    case 'invoice_declined':
      return 'Customer declined the invoice';
    case 'payment_pending':
      return 'Waiting for customer payment';
    case 'payment_submitted':
      return 'Customer submitted payment details';
    case 'payment_verified':
      return 'Payment verified by admin';
    case 'confirmed':
      return 'Order confirmed and processing';
    case 'cancelled':
      return 'Order was cancelled';
    case 'shipped':
      return 'Order has been shipped';
    case 'delivered':
      return 'Order has been delivered';
    default:
      return `Order status updated to ${status}`;
  }
}

/**
 * Subscribe to real-time order status updates for a specific order
 * Similar pattern to ChatService for consistency
 */
export function subscribeToOrderStatusUpdates(
  orderId: string,
  onStatusUpdate: (update: OrderStatusUpdate) => void
) {
  console.log('[OrderStatusService] Setting up order status subscription for order:', orderId);
  const channelName = `order_status:${orderId}:${Date.now()}`;
  const channel = supabase.channel(channelName);

  // Subscribe to order status changes
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    },
    async (payload) => {
      console.log('[OrderStatusService] Order status update received:', {
        orderId: payload.new.id,
        newStatus: payload.new.status,
        paymentStatus: payload.new.payment_status
      });

      const update: OrderStatusUpdate = {
        order_id: payload.new.id,
        status: payload.new.status,
        payment_status: payload.new.payment_status,
        updated_at: payload.new.updated_at
      };

      onStatusUpdate(update);
    }
  );

  // Subscribe the channel
  channel.subscribe((status) => {
    console.log('[OrderStatusService] Order status subscription status:', status, 'for order:', orderId);
  });

  // Return unsubscribe function
  return () => {
    console.log('[OrderStatusService] Unsubscribing from order status updates for order:', orderId);
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to real-time order updates for all orders (admin dashboard)
 */
export function subscribeToAllOrderUpdates(
  onOrderUpdate: (update: OrderStatusUpdate) => void
) {
  console.log('[OrderStatusService] Setting up subscription for all order updates');
  const channelName = `all_orders:${Date.now()}`;
  const channel = supabase.channel(channelName);

  // Subscribe to all order status changes
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
    },
    async (payload) => {
      console.log('[OrderStatusService] Order update received:', {
        orderId: payload.new.id,
        newStatus: payload.new.status,
        paymentStatus: payload.new.payment_status
      });

      const update: OrderStatusUpdate = {
        order_id: payload.new.id,
        status: payload.new.status,
        payment_status: payload.new.payment_status,
        updated_at: payload.new.updated_at
      };

      onOrderUpdate(update);
    }
  );

  // Subscribe the channel
  channel.subscribe((status) => {
    console.log('[OrderStatusService] All orders subscription status:', status);
  });

  // Return unsubscribe function
  return () => {
    console.log('[OrderStatusService] Unsubscribing from all order updates');
    supabase.removeChannel(channel);
  };
}