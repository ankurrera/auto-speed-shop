-- Fix column reference ambiguity in admin_verify_payment function
-- This fixes the "column reference 'notes' is ambiguous" error
-- Also adds support for rejection_reason parameter that the TypeScript code uses

CREATE OR REPLACE FUNCTION public.admin_verify_payment(
  requesting_user_id uuid,
  target_order_id uuid,
  verified boolean,
  rejection_reason text DEFAULT NULL
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
  updated_notes text;
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
    -- Keep existing notes for verified payments
    SELECT orders.notes INTO updated_notes 
    FROM public.orders 
    WHERE orders.id = target_order_id;
  ELSE
    new_status := 'payment_rejected';
    new_payment_status := 'rejected';
    -- Add rejection reason to notes for rejected payments
    IF rejection_reason IS NOT NULL THEN
      updated_notes := rejection_reason;
    ELSE
      updated_notes := 'Payment rejected by admin';
    END IF;
  END IF;

  -- Update the order with payment verification
  -- Fixed column reference ambiguity by qualifying with table name and using variables
  UPDATE public.orders 
  SET 
    status = new_status,
    payment_status = new_payment_status,
    notes = updated_notes,
    updated_at = now()
  WHERE orders.id = target_order_id;

  -- Return the updated order
  -- Fixed column reference ambiguity by qualifying all columns with table alias
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

-- Grant execute permission to authenticated users (the function checks admin status internally)
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, uuid, boolean, text) TO authenticated;