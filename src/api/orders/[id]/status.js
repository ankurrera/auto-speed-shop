// API endpoint for order status tracking
// GET /orders/:id/status - Returns current status and history
// PATCH /orders/:id/status - Admin updates status

import { supabaseAdmin } from "../utils.js";

export default async function handler(req, res) {
  const { id: orderId } = req.query;

  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  try {
    if (req.method === "GET") {
      return await handleGetOrderStatus(req, res, orderId);
    } else if (req.method === "PATCH") {
      return await handleUpdateOrderStatus(req, res, orderId);
    } else {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Order status API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /orders/:id/status
async function handleGetOrderStatus(req, res, orderId) {
  try {
    // Use the existing database function for secure access
    const { data, error } = await supabaseAdmin.rpc('get_order_status', {
      target_order_id: orderId,
      requesting_user_id: null // Allow public access for tracking
    });

    if (error) {
      console.error("Database error:", error);
      return res.status(404).json({ error: "Order not found or access denied" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = data[0];

    // Generate status history (simplified version for MVP)
    const statusHistory = generateStatusHistory(order);

    return res.status(200).json({
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        updated_at: order.updated_at
      },
      status_history: statusHistory
    });
  } catch (error) {
    console.error("Get order status error:", error);
    return res.status(500).json({ error: "Failed to get order status" });
  }
}

// PATCH /orders/:id/status
async function handleUpdateOrderStatus(req, res, orderId) {
  const { status, payment_status, admin_user_id } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  if (!admin_user_id) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  // Validate status values according to problem statement requirements
  const validStatuses = [
    'checkout_request', 'invoice_generated', 'accepted', 'declined', 
    'paypal_shared', 'payment_submitted', 'verified', 'confirmed', 'cancelled',
    // Also allow existing system statuses for backward compatibility
    'pending_admin_review', 'invoice_sent', 'invoice_accepted', 'invoice_declined',
    'paypal_credentials_shared', 'payment_pending', 'payment_verified'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    // Map problem statement statuses to system statuses
    const systemStatus = mapToSystemStatus(status);

    // Use the existing database function for secure admin updates
    const { data, error } = await supabaseAdmin.rpc('admin_update_order_status', {
      requesting_user_id: admin_user_id,
      target_order_id: orderId,
      new_status: systemStatus,
      new_payment_status: payment_status
    });

    if (error) {
      console.error("Database error:", error);
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: "Admin privileges required" });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: "Order not found" });
      }
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updatedOrder = data[0];

    return res.status(200).json({
      order: {
        id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        status: updatedOrder.status,
        payment_status: updatedOrder.payment_status,
        updated_at: updatedOrder.updated_at
      },
      message: "Order status updated successfully"
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({ error: "Failed to update order status" });
  }
}

// Map problem statement statuses to existing system statuses
function mapToSystemStatus(status) {
  const statusMap = {
    'checkout_request': 'pending_admin_review',
    'invoice_generated': 'invoice_sent',
    'accepted': 'invoice_accepted',
    'declined': 'invoice_declined',
    'paypal_shared': 'paypal_credentials_shared',
    'payment_submitted': 'payment_submitted',
    'verified': 'payment_verified',
    'confirmed': 'confirmed',
    'cancelled': 'cancelled'
  };

  return statusMap[status] || status;
}

// Generate a simple status history based on current status
function generateStatusHistory(order) {
  const history = [
    {
      status: 'checkout_request',
      timestamp: order.created_at,
      description: 'Checkout request placed',
      step: 1
    }
  ];

  // Add progression based on current status
  const statusProgression = [
    { status: 'invoice_generated', description: 'Invoice generated by admin', step: 2 },
    { status: 'accepted', description: 'User accepted invoice', step: 3 },
    { status: 'paypal_shared', description: 'PayPal credentials shared', step: 4 },
    { status: 'payment_submitted', description: 'User payment submitted', step: 5 },
    { status: 'verified', description: 'Admin verification completed', step: 6 },
    { status: 'confirmed', description: 'Order confirmed', step: 7 }
  ];

  // Map system status back to problem statement format
  const currentMappedStatus = mapFromSystemStatus(order.status);
  
  for (const step of statusProgression) {
    if (hasReachedStatus(currentMappedStatus, step.status)) {
      history.push({
        status: step.status,
        timestamp: order.updated_at,
        description: step.description,
        step: step.step
      });
    } else {
      break;
    }
  }

  return history;
}

// Map system statuses back to problem statement format
function mapFromSystemStatus(systemStatus) {
  const reverseMap = {
    'pending_admin_review': 'checkout_request',
    'invoice_sent': 'invoice_generated',
    'invoice_accepted': 'accepted',
    'invoice_declined': 'declined',
    'paypal_credentials_shared': 'paypal_shared',
    'payment_submitted': 'payment_submitted',
    'payment_verified': 'verified',
    'confirmed': 'confirmed',
    'cancelled': 'cancelled'
  };

  return reverseMap[systemStatus] || systemStatus;
}

// Determine if order has reached a certain status
function hasReachedStatus(currentStatus, targetStatus) {
  const statusOrder = [
    'checkout_request', 'invoice_generated', 'accepted', 'paypal_shared',
    'payment_submitted', 'verified', 'confirmed'
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);
  const targetIndex = statusOrder.indexOf(targetStatus);

  return currentIndex >= targetIndex;
}