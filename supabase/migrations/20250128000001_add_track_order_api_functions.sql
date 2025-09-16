-- Add functions for Track Order API endpoints
-- These functions provide secure access to order status information and admin-only status updates

-- Function to get order status and history for a specific order
-- This supports GET /orders/:id/status endpoint
CREATE OR REPLACE FUNCTION public.get_order_status(
  target_order_id uuid,
  requesting_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  order_number text,
  status text,
  payment_status text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the order exists and user has access
  IF NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = target_order_id
    AND (
      requesting_user_id IS NULL OR -- Allow public access for tracking (like shipping tracking)
      o.user_id = requesting_user_id OR -- User can access their own orders
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = requesting_user_id 
        AND p.is_admin = true
      ) -- Admins can access any order
    )
  ) THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;

  -- Return order status information
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.payment_status,
    o.created_at,
    o.updated_at,
    o.user_id
  FROM public.orders o
  WHERE o.id = target_order_id;
END;
$$;

-- Function to update order status (admin only)
-- This supports PATCH /orders/:id/status endpoint
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  requesting_user_id uuid,
  target_order_id uuid,
  new_status text,
  new_payment_status text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  order_number text,
  status text,
  payment_status text,
  updated_at timestamptz
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

  -- Check if the order exists
  IF NOT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = target_order_id
  ) THEN
    RAISE EXCEPTION 'Order with ID % not found', target_order_id;
  END IF;

  -- Validate status values
  IF new_status NOT IN (
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
  ) THEN
    RAISE EXCEPTION 'Invalid status value: %', new_status;
  END IF;

  IF new_payment_status IS NOT NULL AND new_payment_status NOT IN (
    'initiated',
    'pending',
    'submitted',
    'verified', 
    'completed',
    'failed'
  ) THEN
    RAISE EXCEPTION 'Invalid payment status value: %', new_payment_status;
  END IF;

  -- Update the order status
  UPDATE public.orders 
  SET 
    status = new_status,
    payment_status = COALESCE(new_payment_status, payment_status),
    updated_at = now()
  WHERE orders.id = target_order_id;

  -- Return the updated order information
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.payment_status,
    o.updated_at
  FROM public.orders o
  WHERE o.id = target_order_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid, uuid) TO anon; -- Allow anonymous access for public tracking
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, uuid, text, text) TO authenticated;