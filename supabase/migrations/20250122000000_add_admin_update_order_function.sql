-- Add admin function to update orders for invoice creation
-- This allows admins to update orders even with RLS enabled

CREATE OR REPLACE FUNCTION public.admin_update_order_for_invoice(
  requesting_user_id uuid,
  target_order_id uuid,
  convenience_fee_param numeric DEFAULT NULL,
  delivery_charge_param numeric DEFAULT NULL,
  tax_amount_param numeric DEFAULT NULL,
  total_amount_param numeric DEFAULT NULL,
  notes_param text DEFAULT NULL
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

  -- Update the order with invoice details
  UPDATE public.orders 
  SET 
    convenience_fee = COALESCE(convenience_fee_param, orders.convenience_fee),
    delivery_charge = COALESCE(delivery_charge_param, orders.delivery_charge),
    tax_amount = COALESCE(tax_amount_param, orders.tax_amount),
    total_amount = COALESCE(total_amount_param, orders.total_amount),
    status = 'invoice_sent',
    notes = COALESCE(notes_param, orders.notes),
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

-- Grant execute permission to authenticated users (the function checks admin status internally)
GRANT EXECUTE ON FUNCTION public.admin_update_order_for_invoice(uuid, uuid, numeric, numeric, numeric, numeric, text) TO authenticated;