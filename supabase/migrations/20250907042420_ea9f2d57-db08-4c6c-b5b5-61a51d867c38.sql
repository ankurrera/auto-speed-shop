-- Create a function to get users with their order counts, ranked by order count
CREATE OR REPLACE FUNCTION public.get_users_with_order_count()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  is_admin boolean,
  is_seller boolean,
  order_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.is_admin,
    p.is_seller,
    COALESCE(o.order_count, 0) as order_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      orders.user_id,
      COUNT(*) as order_count
    FROM public.orders
    GROUP BY orders.user_id
  ) o ON p.user_id = o.user_id
  WHERE p.is_admin = false AND p.is_seller = false
  ORDER BY COALESCE(o.order_count, 0) DESC, p.created_at DESC;
END;
$$;