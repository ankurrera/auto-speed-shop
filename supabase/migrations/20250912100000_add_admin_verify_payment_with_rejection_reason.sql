-- Add admin function to verify payment with rejection reason
-- This provides a 4-parameter version for when rejection reasons are needed

CREATE OR REPLACE FUNCTION public.admin_verify_payment(
  requesting_user_id uuid,
  target_order_id uuid,
  verified boolean,
  rejection_reason text
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
    updated_notes := COALESCE((SELECT orders.notes FROM public.orders WHERE orders.id = target_order_id), '');
  ELSE
    new_status := 'payment_pending';
    new_payment_status := 'failed';
    -- Append rejection reason to existing notes
    updated_notes := COALESCE((SELECT orders.notes FROM public.orders WHERE orders.id = target_order_id), '') || 
                    CASE 
                      WHEN COALESCE((SELECT orders.notes FROM public.orders WHERE orders.id = target_order_id), '') != '' 
                      THEN E'\n\nRejection Reason: ' || rejection_reason
                      ELSE 'Rejection Reason: ' || rejection_reason
                    END;
  END IF;

  -- Update the order with payment verification
  UPDATE public.orders 
  SET 
    status = new_status,
    payment_status = new_payment_status,
    notes = updated_notes,
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

-- Grant execute permissions to authenticated users (the function checks permissions internally)
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, uuid, boolean, text) TO authenticated;