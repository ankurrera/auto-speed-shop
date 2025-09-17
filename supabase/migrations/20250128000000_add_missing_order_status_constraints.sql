-- Add missing order status values to support complete track order functionality
-- This migration adds the missing 'paypal_credentials_shared' status that is used in the frontend
-- but was missing from the database constraint

-- Drop existing status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add updated status constraint that includes all required status values
-- including the missing 'paypal_credentials_shared' status
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
  'paypal_credentials_shared',
  'payment_pending',
  'payment_submitted',
  'payment_verified',
  'confirmed'
));