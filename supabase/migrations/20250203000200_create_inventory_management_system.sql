-- Create inventory management system with stock alerts
-- This adds functions to manage inventory and auto-disable out-of-stock products

-- Function to check and auto-disable out-of-stock products
CREATE OR REPLACE FUNCTION public.auto_disable_out_of_stock_products()
RETURNS TABLE(
  disabled_products integer,
  disabled_parts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  products_count integer := 0;
  parts_count integer := 0;
BEGIN
  -- Disable products with zero stock
  UPDATE public.products 
  SET is_active = false, updated_at = now()
  WHERE stock_quantity <= 0 AND is_active = true;
  
  GET DIAGNOSTICS products_count = ROW_COUNT;

  -- Disable parts with zero stock
  UPDATE public.parts 
  SET is_active = false, updated_at = now()
  WHERE stock_quantity <= 0 AND is_active = true;
  
  GET DIAGNOSTICS parts_count = ROW_COUNT;

  RETURN QUERY SELECT products_count, parts_count;
END;
$$;

-- Function to get low stock items
CREATE OR REPLACE FUNCTION public.get_low_stock_items(
  requesting_user_id uuid,
  threshold_percentage numeric DEFAULT 20.0
)
RETURNS TABLE(
  item_type text,
  id uuid,
  name text,
  current_stock integer,
  min_stock_level integer,
  seller_name text,
  seller_email text
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

  -- Return low stock products
  RETURN QUERY
  SELECT 
    'product'::text as item_type,
    p.id,
    p.name,
    p.stock_quantity as current_stock,
    COALESCE(p.min_stock_level, 10) as min_stock_level,
    COALESCE(s.name, 'Unknown') as seller_name,
    COALESCE(prof.email, 'Unknown') as seller_email
  FROM public.products p
  LEFT JOIN public.sellers s ON p.seller_id = s.id
  LEFT JOIN public.profiles prof ON s.user_id = prof.user_id
  WHERE p.is_active = true 
    AND p.stock_quantity <= COALESCE(p.min_stock_level, 10)
  
  UNION ALL
  
  -- Return low stock parts
  SELECT 
    'part'::text as item_type,
    pt.id,
    pt.name,
    pt.stock_quantity as current_stock,
    10 as min_stock_level, -- Default min stock for parts
    COALESCE(s.name, 'Unknown') as seller_name,
    COALESCE(prof.email, 'Unknown') as seller_email
  FROM public.parts pt
  LEFT JOIN public.sellers s ON pt.seller_id = s.id
  LEFT JOIN public.profiles prof ON s.user_id = prof.user_id
  WHERE pt.is_active = true 
    AND pt.stock_quantity <= 10
  
  ORDER BY current_stock ASC;
END;
$$;

-- Function to send stock alert notifications
CREATE OR REPLACE FUNCTION public.send_stock_alert_notifications(
  requesting_user_id uuid
)
RETURNS TABLE(
  notifications_sent integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  low_stock_item RECORD;
  notification_count integer := 0;
BEGIN
  -- Check if the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Send notifications for low stock items
  FOR low_stock_item IN 
    SELECT * FROM public.get_low_stock_items(requesting_user_id)
  LOOP
    -- Find the seller's user_id
    DECLARE
      seller_user_id uuid;
    BEGIN
      IF low_stock_item.item_type = 'product' THEN
        SELECT s.user_id INTO seller_user_id
        FROM public.products p
        JOIN public.sellers s ON p.seller_id = s.id
        WHERE p.id = low_stock_item.id;
      ELSE
        SELECT s.user_id INTO seller_user_id
        FROM public.parts pt
        JOIN public.sellers s ON pt.seller_id = s.id
        WHERE pt.id = low_stock_item.id;
      END IF;

      -- Insert notification if seller found
      IF seller_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
          seller_user_id,
          'system',
          'Low Stock Alert',
          format('Your %s "%s" is running low on stock. Current stock: %s', 
                 low_stock_item.item_type, 
                 low_stock_item.name, 
                 low_stock_item.current_stock),
          jsonb_build_object(
            'item_type', low_stock_item.item_type,
            'item_id', low_stock_item.id,
            'current_stock', low_stock_item.current_stock,
            'min_stock_level', low_stock_item.min_stock_level
          )
        );
        notification_count := notification_count + 1;
      END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT notification_count;
END;
$$;

-- Function to update stock levels
CREATE OR REPLACE FUNCTION public.admin_update_stock(
  requesting_user_id uuid,
  item_type text,
  item_id uuid,
  new_stock_quantity integer
)
RETURNS TABLE(
  success boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  -- Check if the requesting user is an admin
  SELECT profiles.is_admin INTO is_admin 
  FROM public.profiles 
  WHERE profiles.user_id = requesting_user_id;

  IF NOT COALESCE(is_admin, false) THEN
    RETURN QUERY SELECT false, 'Access denied: Admin privileges required';
    RETURN;
  END IF;

  -- Update stock based on item type
  IF item_type = 'product' THEN
    UPDATE public.products 
    SET stock_quantity = new_stock_quantity, updated_at = now()
    WHERE id = item_id;
    
    IF FOUND THEN
      RETURN QUERY SELECT true, 'Product stock updated successfully';
    ELSE
      RETURN QUERY SELECT false, 'Product not found';
    END IF;
  ELSIF item_type = 'part' THEN
    UPDATE public.parts 
    SET stock_quantity = new_stock_quantity, updated_at = now()
    WHERE id = item_id;
    
    IF FOUND THEN
      RETURN QUERY SELECT true, 'Part stock updated successfully';
    ELSE
      RETURN QUERY SELECT false, 'Part not found';
    END IF;
  ELSE
    RETURN QUERY SELECT false, 'Invalid item type';
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.auto_disable_out_of_stock_products() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_items(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_stock_alert_notifications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_stock(uuid, text, uuid, integer) TO authenticated;