-- Update the get_invoice_orders_for_admin function to include all payment-related orders
-- This fixes the issue where payment management shows zero counts

CREATE OR REPLACE FUNCTION public.get_invoice_orders_for_admin(requesting_user_id uuid)
RETURNS TABLE(
  id uuid,
  order_number text,
  user_id uuid,
  status text,
  payment_status text,
  payment_method text,
  subtotal numeric,
  shipping_amount numeric,
  tax_amount numeric,
  total_amount numeric,
  convenience_fee numeric,
  delivery_charge numeric,
  currency text,
  notes text,
  shipping_address jsonb,
  billing_address jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  customer_first_name text,
  customer_last_name text,
  customer_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return orders requiring invoice management AND payment management with customer information
  -- Include all orders that have any payment-related data or status
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.user_id,
    o.status,
    o.payment_status,
    o.payment_method,
    o.subtotal,
    o.shipping_amount,
    o.tax_amount,
    o.total_amount,
    o.convenience_fee,
    o.delivery_charge,
    o.currency,
    o.notes,
    o.shipping_address,
    o.billing_address,
    o.created_at,
    o.updated_at,
    o.shipped_at,
    o.delivered_at,
    p.first_name as customer_first_name,
    p.last_name as customer_last_name,
    p.email as customer_email
  FROM public.orders o
  LEFT JOIN public.profiles p ON o.user_id = p.user_id
  WHERE 
    -- Include all invoice and payment related orders
    o.status IN (
      'pending_admin_review',
      'invoice_sent',
      'invoice_accepted', 
      'payment_pending',
      'payment_submitted',
      'payment_verified',
      'confirmed',
      'cancelled',
      'shipped',
      'delivered'
    )
    OR 
    -- Include orders with any payment status
    (o.payment_status IS NOT NULL AND o.payment_status != '')
    OR
    -- Include orders with payment-related notes
    (o.notes IS NOT NULL AND (
      o.notes LIKE '%transaction_id%' OR
      o.notes LIKE '%payment%' OR  
      o.notes LIKE '%verified%' OR
      o.notes LIKE '%rejected%'
    ))
  ORDER BY o.created_at DESC;
END;
$$;