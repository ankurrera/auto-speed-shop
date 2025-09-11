-- Create functions for admin users to access all orders
-- This allows admins to bypass RLS policies for order management

-- Function to get all orders for admin users
CREATE OR REPLACE FUNCTION public.get_all_orders_for_admin(requesting_user_id uuid)
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

  -- Return all orders with customer information
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
  ORDER BY o.created_at DESC;
END;
$$;

-- Function to get orders requiring invoice management for admin users
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

  -- Return orders requiring invoice management with customer information
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
  WHERE o.status IN (
    'pending_admin_review',
    'invoice_sent',
    'invoice_accepted', 
    'payment_submitted'
  )
  ORDER BY o.created_at DESC;
END;
$$;

-- Function to get order items for a specific order (for admin users)
CREATE OR REPLACE FUNCTION public.get_order_items_for_admin(requesting_user_id uuid, target_order_id uuid)
RETURNS TABLE(
  id uuid,
  order_id uuid,
  product_id uuid,
  part_id uuid,
  product_name text,
  product_sku text,
  quantity integer,
  unit_price numeric,
  total_price numeric,
  is_part boolean,
  created_at timestamptz
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

  -- Return order items for the specified order
  RETURN QUERY
  SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.part_id,
    oi.product_name,
    oi.product_sku,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    oi.is_part,
    oi.created_at
  FROM public.order_items oi
  WHERE oi.order_id = target_order_id
  ORDER BY oi.created_at;
END;
$$;

-- Grant execute permissions to authenticated users (the functions will check admin status internally)
GRANT EXECUTE ON FUNCTION public.get_all_orders_for_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invoice_orders_for_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_items_for_admin(uuid, uuid) TO authenticated;