-- Fix orders status constraint to allow custom order flow status values
-- Drop existing status constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add updated status constraint that includes all required status values
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
  'payment_submitted',
  'payment_verified',
  'confirmed'
));

-- Similarly, ensure payment_status constraint allows all required values
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN (
  'initiated',
  'pending',
  'submitted',
  'verified', 
  'completed',
  'failed'
));

-- Ensure convenience_fee and delivery_charge columns exist for custom order flow
ALTER TABLE orders ADD COLUMN IF NOT EXISTS convenience_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0;