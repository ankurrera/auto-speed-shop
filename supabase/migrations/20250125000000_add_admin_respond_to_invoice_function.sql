-- Add admin function to respond to invoices
-- This allows admins and users to respond to invoices even with RLS enabled

CREATE OR REPLACE FUNCTION public.admin_respond_to_invoice(
  requesting_user_id uuid,
  target_order_id uuid,
  accepted boolean
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
  new_status text;
  new_payment_status text;
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
    RAISE EXCEPTION 'Access denied: You can only respond to your own orders or must have admin privileges';
  END IF;

  -- Determine new status based on acceptance
  IF accepted THEN
    new_status := 'invoice_accepted';
    new_payment_status := 'pending';
  ELSE
    new_status := 'cancelled';
    new_payment_status := 'failed';
  END IF;

  -- Update the order
  UPDATE public.orders 
  SET 
    status = new_status,
    payment_status = new_payment_status,
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

-- Add admin function to submit payment for orders
-- This allows users to submit payment for their orders even with RLS enabled

CREATE OR REPLACE FUNCTION public.admin_submit_payment(
  requesting_user_id uuid,
  target_order_id uuid,
  payment_notes text
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
    RAISE EXCEPTION 'Access denied: You can only submit payment for your own orders or must have admin privileges';
  END IF;

  -- Update the order with payment submission
  UPDATE public.orders 
  SET 
    status = 'payment_submitted',
    payment_status = 'submitted',
    notes = payment_notes,
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

-- Add admin function to verify payment for orders
-- This allows admins to verify payment submissions

CREATE OR REPLACE FUNCTION public.admin_verify_payment(
  requesting_user_id uuid,
  target_order_id uuid,
  verified boolean
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
  new_status text;
  new_payment_status text;
BEGIN
  -- Get the current user's admin status
  SELECT profiles.is_admin INTO is_admin 
  FROM public.profiles 
  WHERE profiles.user_id = requesting_user_id;

  -- Check if the requesting user is an admin
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Check if the order exists
  IF NOT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = target_order_id
  ) THEN
    RAISE EXCEPTION 'Order with ID % not found', target_order_id;
  END IF;

  -- Determine new status based on verification
  IF verified THEN
    new_status := 'confirmed';
    new_payment_status := 'verified';
  ELSE
    new_status := 'payment_pending';
    new_payment_status := 'failed';
  END IF;

  -- Update the order with payment verification
  UPDATE public.orders 
  SET 
    status = new_status,
    payment_status = new_payment_status,
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

-- Grant execute permissions to authenticated users (the functions check permissions internally)
GRANT EXECUTE ON FUNCTION public.admin_respond_to_invoice(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_submit_payment(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, uuid, boolean) TO authenticated;