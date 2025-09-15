-- Add admin function to cancel orders
-- This allows admins and order owners to cancel orders even with RLS enabled

CREATE OR REPLACE FUNCTION public.admin_cancel_order(
  requesting_user_id uuid,
  target_order_id uuid,
  cancellation_reason text DEFAULT 'Order cancelled'
)
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
  delivered_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  order_user_id uuid;
BEGIN
  -- Get the current user's admin status
  SELECT profiles.is_admin INTO is_admin 
  FROM public.profiles 
  WHERE profiles.user_id = requesting_user_id;
  
  -- Get the order's user_id to check ownership
  SELECT orders.user_id INTO order_user_id 
  FROM public.orders 
  WHERE orders.id = target_order_id;

  -- Check if the order exists
  IF order_user_id IS NULL THEN
    RAISE EXCEPTION 'Order with ID % not found', target_order_id;
  END IF;

  -- Allow access if user is admin OR if user owns the order
  IF NOT (COALESCE(is_admin, false) OR requesting_user_id = order_user_id) THEN
    RAISE EXCEPTION 'Access denied: You can only cancel your own orders or must have admin privileges';
  END IF;

  -- Update the order to cancelled status
  UPDATE public.orders 
  SET 
    status = 'cancelled',
    payment_status = 'failed',
    notes = COALESCE(cancellation_reason, 'Order cancelled'),
    updated_at = now()
  WHERE orders.id = target_order_id;

  -- Return the updated order
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
    o.delivered_at
  FROM public.orders o
  WHERE o.id = target_order_id;
END;
$$;

-- Grant execute permission to authenticated users (the function checks permissions internally)
GRANT EXECUTE ON FUNCTION public.admin_cancel_order(uuid, uuid, text) TO authenticated;