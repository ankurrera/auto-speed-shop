-- Analytics Dashboard Functions
-- This migration adds RPC functions to support the analytics dashboard

-- Function to get key performance indicators (KPI) for analytics dashboard
CREATE OR REPLACE FUNCTION public.get_analytics_kpis(requesting_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kpi_data jsonb;
  total_sales numeric;
  total_revenue numeric;
  total_orders integer;
  previous_sales numeric;
  previous_revenue numeric;
  previous_orders integer;
  sales_change numeric;
  revenue_change numeric;
  orders_change numeric;
  current_month_start date;
  previous_month_start date;
  previous_month_end date;
BEGIN
  -- Check if the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Calculate date ranges
  current_month_start := date_trunc('month', CURRENT_DATE);
  previous_month_start := date_trunc('month', CURRENT_DATE - interval '1 month');
  previous_month_end := current_month_start - interval '1 day';

  -- Calculate current month metrics
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(convenience_fee + COALESCE(delivery_charge, 0)), 0),
    COUNT(*)
  INTO total_sales, total_revenue, total_orders
  FROM public.orders
  WHERE created_at >= current_month_start
    AND status = 'confirmed';

  -- Calculate previous month metrics for comparison
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(convenience_fee + COALESCE(delivery_charge, 0)), 0),
    COUNT(*)
  INTO previous_sales, previous_revenue, previous_orders
  FROM public.orders
  WHERE created_at >= previous_month_start
    AND created_at <= previous_month_end
    AND status = 'confirmed';

  -- Calculate percentage changes
  sales_change := CASE 
    WHEN previous_sales > 0 THEN ((total_sales - previous_sales) / previous_sales) * 100
    ELSE 0
  END;
  
  revenue_change := CASE 
    WHEN previous_revenue > 0 THEN ((total_revenue - previous_revenue) / previous_revenue) * 100
    ELSE 0
  END;
  
  orders_change := CASE 
    WHEN previous_orders > 0 THEN ((total_orders - previous_orders)::numeric / previous_orders) * 100
    ELSE 0
  END;

  -- Build the response JSON
  kpi_data := jsonb_build_object(
    'totalSales', total_sales,
    'totalRevenue', total_revenue,
    'totalOrders', total_orders,
    'salesChange', sales_change,
    'revenueChange', revenue_change,
    'ordersChange', orders_change
  );

  RETURN kpi_data;
END;
$$;

-- Function to get sales data over time for charts
CREATE OR REPLACE FUNCTION public.get_analytics_sales_chart(requesting_user_id uuid, days_back integer DEFAULT 30)
RETURNS TABLE(
  date date,
  sales numeric,
  orders integer
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

  -- Return sales data grouped by date
  RETURN QUERY
  SELECT 
    created_at::date as date,
    COALESCE(SUM(total_amount), 0) as sales,
    COUNT(*)::integer as orders
  FROM public.orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    AND status = 'confirmed'
  GROUP BY created_at::date
  ORDER BY date DESC;
END;
$$;

-- Function to get best selling products
CREATE OR REPLACE FUNCTION public.get_analytics_best_products(requesting_user_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(
  product_name text,
  total_quantity integer,
  total_sales numeric,
  average_price numeric,
  order_count integer
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

  -- Return best selling products
  RETURN QUERY
  SELECT 
    oi.product_name,
    SUM(oi.quantity)::integer as total_quantity,
    SUM(oi.total_price) as total_sales,
    AVG(oi.unit_price) as average_price,
    COUNT(DISTINCT oi.order_id)::integer as order_count
  FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE o.status = 'confirmed'
    AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY oi.product_name
  ORDER BY total_sales DESC
  LIMIT limit_count;
END;
$$;

-- Function to get recent orders for dashboard
CREATE OR REPLACE FUNCTION public.get_analytics_recent_orders(requesting_user_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(
  order_number text,
  customer_name text,
  customer_location text,
  total_amount numeric,
  status text,
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

  -- Return recent orders with customer info
  RETURN QUERY
  SELECT 
    o.order_number,
    CONCAT(p.first_name, ' ', p.last_name) as customer_name,
    CASE 
      WHEN o.shipping_address ? 'city' AND o.shipping_address ? 'state' THEN
        CONCAT(o.shipping_address->>'city', ', ', o.shipping_address->>'state')
      ELSE 'N/A'
    END as customer_location,
    o.total_amount,
    o.status,
    o.created_at
  FROM public.orders o
  LEFT JOIN public.profiles p ON o.user_id = p.user_id
  ORDER BY o.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get user analytics (new users, locations)
CREATE OR REPLACE FUNCTION public.get_analytics_users(requesting_user_id uuid)
RETURNS TABLE(
  total_users integer,
  new_users_this_month integer,
  new_users_change numeric,
  top_locations jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month_start date;
  previous_month_start date;
  previous_month_end date;
  previous_new_users integer;
BEGIN
  -- Check if the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Calculate date ranges
  current_month_start := date_trunc('month', CURRENT_DATE);
  previous_month_start := date_trunc('month', CURRENT_DATE - interval '1 month');
  previous_month_end := current_month_start - interval '1 day';

  -- Get previous month new users for comparison
  SELECT COUNT(*)::integer
  INTO previous_new_users
  FROM public.profiles
  WHERE created_at >= previous_month_start
    AND created_at <= previous_month_end
    AND is_admin = false;

  -- Return user analytics
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM public.profiles WHERE is_admin = false) as total_users,
    (SELECT COUNT(*)::integer FROM public.profiles WHERE created_at >= current_month_start AND is_admin = false) as new_users_this_month,
    CASE 
      WHEN previous_new_users > 0 THEN 
        (((SELECT COUNT(*)::integer FROM public.profiles WHERE created_at >= current_month_start AND is_admin = false) - previous_new_users)::numeric / previous_new_users) * 100
      ELSE 0
    END as new_users_change,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'location', location,
          'count', count
        ) ORDER BY count DESC
      )
      FROM (
        SELECT 
          CASE 
            WHEN a.city IS NOT NULL AND a.state IS NOT NULL THEN
              CONCAT(a.city, ', ', a.state)
            ELSE 'Unknown'
          END as location,
          COUNT(*) as count
        FROM public.addresses a
        WHERE a.is_default = true
        GROUP BY location
        ORDER BY count DESC
        LIMIT 5
      ) location_counts
    ) as top_locations;
END;
$$;

-- Grant execute permissions to authenticated users (functions check admin status internally)
GRANT EXECUTE ON FUNCTION public.get_analytics_kpis(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_sales_chart(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_best_products(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_recent_orders(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_users(uuid) TO authenticated;