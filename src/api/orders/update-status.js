// API endpoint for updating order status (admin only)
import { supabase } from '../../integrations/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { orderId } = req.query;
    const { status, notes } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({ message: 'Order ID and status are required' });
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Validate status value
    const validStatuses = [
      'pending_admin_review',
      'invoice_sent',
      'invoice_accepted',
      'invoice_declined',
      'payment_pending',
      'paypal_shared',
      'payment_submitted',
      'payment_verified',
      'confirmed',
      'cancelled',
      'shipped',
      'delivered'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Update order status
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    // Set payment status based on order status
    if (status === 'payment_verified') {
      updateData.payment_status = 'verified';
    } else if (status === 'confirmed') {
      updateData.payment_status = 'completed';
    } else if (status === 'cancelled' || status === 'invoice_declined') {
      updateData.payment_status = 'failed';
    }

    // Set shipped_at timestamp if status is shipped
    if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    }

    // Set delivered_at timestamp if status is delivered
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return res.status(500).json({ message: 'Failed to update order status' });
    }

    return res.status(200).json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}