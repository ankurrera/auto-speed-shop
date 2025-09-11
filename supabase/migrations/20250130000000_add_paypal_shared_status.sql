-- Add paypal_shared status to support the track order feature workflow
-- This extends the existing custom order flow with the missing status

-- Drop existing status constraint to add new status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add updated status constraint that includes paypal_shared status
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending',
  'processing', 
  'completed',
  'failed',
  'cancelled',
  'shipped',
  'delivered',
  'pending_admin_review',
  'invoice_sent',
  'invoice_accepted', 
  'invoice_declined',
  'payment_pending',
  'paypal_shared',
  'payment_submitted',
  'payment_verified',
  'confirmed'
));