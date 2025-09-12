-- Add stock decrement functionality when orders are confirmed
-- This modifies the admin_verify_payment function to also decrement stock from products and parts tables

-- First, create a helper function to decrement stock
CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(order_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- Loop through all order items for this order
  FOR item_record IN
    SELECT 
      oi.product_id,
      oi.part_id,
      oi.is_part,
      oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = order_id_param
  LOOP
    -- If it's a product, decrement from products table
    IF NOT item_record.is_part AND item_record.product_id IS NOT NULL THEN
      UPDATE public.products 
      SET 
        stock_quantity = GREATEST(0, stock_quantity - item_record.quantity),
        updated_at = now()
      WHERE id = item_record.product_id;
      
      -- Log if the update affected no rows (product not found)
      IF NOT FOUND THEN
        RAISE NOTICE 'Product with ID % not found for stock decrement', item_record.product_id;
      END IF;
      
    -- If it's a part, decrement from parts table
    ELSIF item_record.is_part AND item_record.part_id IS NOT NULL THEN
      UPDATE public.parts 
      SET 
        stock_quantity = GREATEST(0, stock_quantity - item_record.quantity),
        updated_at = now()
      WHERE id = item_record.part_id;
      
      -- Log if the update affected no rows (part not found)
      IF NOT FOUND THEN
        RAISE NOTICE 'Part with ID % not found for stock decrement', item_record.part_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Now update the admin_verify_payment function to include stock decrement
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

  -- If payment is verified (order confirmed), decrement stock
  IF verified THEN
    PERFORM public.decrement_stock_for_order(target_order_id);
  END IF;

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
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, uuid, boolean) TO authenticated;