// API endpoint for order status history
import { supabase } from "@/integrations/supabase/client";

export interface OrderStatusHistoryEntry {
  status: string;
  timestamp: string;
  description: string;
  updatedBy?: string;
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