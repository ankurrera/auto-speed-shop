-- Add stock decrement functionality when admin confirms order
-- This modifies the admin_verify_payment function to automatically decrement stock

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
  order_item RECORD;
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
    
    -- Decrement stock for each order item when order is confirmed
    FOR order_item IN 
      SELECT oi.product_id, oi.part_id, oi.quantity 
      FROM public.order_items oi 
      WHERE oi.order_id = target_order_id
    LOOP
      -- Decrement product stock if it's a product
      IF order_item.product_id IS NOT NULL THEN
        UPDATE public.products 
        SET 
          stock_quantity = GREATEST(0, products.stock_quantity - order_item.quantity),
          updated_at = now()
        WHERE products.id = order_item.product_id;
      END IF;
      
      -- Decrement part stock if it's a part
      IF order_item.part_id IS NOT NULL THEN
        UPDATE public.parts 
        SET 
          stock_quantity = GREATEST(0, parts.stock_quantity - order_item.quantity),
          updated_at = now()
        WHERE parts.id = order_item.part_id;
      END IF;
    END LOOP;
  ELSE
    new_status := 'payment_rejected';
    new_payment_status := 'rejected';
  END IF;

  -- Update the order with payment verification
  UPDATE public.orders 
  SET 
    status = new_status,
    payment_status = new_payment_status,
    notes = CASE 
      WHEN verified THEN notes  -- Keep existing notes if verified
      WHEN rejection_reason IS NOT NULL THEN 
        CASE 
          WHEN notes IS NULL THEN rejection_reason
          ELSE notes || E'\n\nRejection Reason: ' || rejection_reason
        END
      ELSE notes
    END,
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
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, uuid, boolean, text) TO authenticated;