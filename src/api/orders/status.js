// API endpoint for getting order status and history
import { supabase } from '../../integrations/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Fetch order with status history
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        status,
        payment_status,
        created_at,
        updated_at,
        shipped_at,
        delivered_at
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order or is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || (!profile?.is_admin && order.user_id !== session.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate status history based on current status and timestamps
    const statusHistory = generateStatusHistory(order);

    return res.status(200).json({
      currentStatus: order.status,
      paymentStatus: order.payment_status,
      statusHistory,
      order: {
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        updated_at: order.updated_at,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at
      }
    });

  } catch (error) {
    console.error('Error fetching order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function generateStatusHistory(order) {
  const history = [];
  const baseDate = new Date(order.created_at);
  
  // Always include order placement
  history.push({
    status: 'pending_admin_review',
    timestamp: order.created_at,
    description: 'Order placed and awaiting admin review'
  });

  // Add subsequent statuses based on current order status
  const statusProgression = [
    'invoice_sent',
    'invoice_accepted', 
    'paypal_shared',
    'payment_submitted',
    'payment_verified',
    'confirmed',
    'shipped',
    'delivered'
  ];

  const currentStatusIndex = statusProgression.indexOf(order.status);
  
  for (let i = 0; i <= currentStatusIndex; i++) {
    const status = statusProgression[i];
    let timestamp = order.created_at;
    
    // Use actual timestamps where available
    if (status === 'shipped' && order.shipped_at) {
      timestamp = order.shipped_at;
    } else if (status === 'delivered' && order.delivered_at) {
      timestamp = order.delivered_at;
    } else if (i > 0) {
      // Estimate timestamp based on progression
      const estimatedDate = new Date(baseDate.getTime() + (i * 24 * 60 * 60 * 1000));
      timestamp = estimatedDate.toISOString();
    }

    if (status !== 'pending_admin_review') { // Already added above
      history.push({
        status,
        timestamp,
        description: getStatusDescription(status)
      });
    }
  }

  // Handle cancellation
  if (order.status === 'cancelled' || order.status === 'invoice_declined') {
    history.push({
      status: order.status,
      timestamp: order.updated_at,
      description: order.status === 'cancelled' ? 'Order cancelled' : 'Invoice declined by customer'
    });
  }

  return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function getStatusDescription(status) {
  const descriptions = {
    'pending_admin_review': 'Order placed and awaiting admin review',
    'invoice_sent': 'Invoice generated and sent to customer',
    'invoice_accepted': 'Customer accepted the invoice',
    'invoice_declined': 'Customer declined the invoice',
    'paypal_shared': 'PayPal payment credentials shared with customer',
    'payment_submitted': 'Customer submitted payment proof',
    'payment_verified': 'Payment verified by admin',
    'confirmed': 'Order confirmed and ready for fulfillment',
    'shipped': 'Order has been shipped',
    'delivered': 'Order has been delivered',
    'cancelled': 'Order was cancelled'
  };
  
  return descriptions[status] || status;
}