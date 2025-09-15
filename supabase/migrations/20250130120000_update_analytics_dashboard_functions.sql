-- Update Analytics Dashboard Functions
-- This migration updates the existing analytics functions to meet new requirements

-- Function to get user analytics (new users, locations) - Updated to use shipping_address from orders
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
  -- Check if the requesting user is an admin or has shared admin access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
    AND (
      -- Standard admin access
      profiles.role = 'admin' 
      OR 
      -- Shared admin access for sellers with admin role
      (profiles.is_seller = true AND profiles.role = 'admin')
    )
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
    AND is_admin = false
    AND is_seller = false
    AND role = 'user';

  -- Return user analytics
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM public.profiles WHERE is_admin = false AND is_seller = false AND role = 'user') as total_users,
    (SELECT COUNT(*)::integer FROM public.profiles WHERE created_at >= current_month_start AND is_admin = false AND is_seller = false AND role = 'user') as new_users_this_month,
    CASE 
      WHEN previous_new_users > 0 THEN 
        (((SELECT COUNT(*)::integer FROM public.profiles WHERE created_at >= current_month_start AND is_admin = false AND is_seller = false AND role = 'user') - previous_new_users)::numeric / previous_new_users) * 100
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
            WHEN o.shipping_address ? 'city' AND o.shipping_address ? 'state' THEN
              CONCAT(o.shipping_address->>'city', ', ', o.shipping_address->>'state')
            ELSE 'Unknown'
          END as location,
          COUNT(*) as count
        FROM public.orders o
        WHERE o.shipping_address IS NOT NULL
        GROUP BY location
        ORDER BY count DESC
        LIMIT 5
      ) location_counts
    ) as top_locations;
END;
$$;

-- Function to get best selling products - Updated with new Sale/Revenue definitions
CREATE OR REPLACE FUNCTION public.get_analytics_best_products(requesting_user_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(
  product_name text,
  total_quantity integer,
  sale numeric,
  revenue numeric,
  order_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the requesting user is an admin or has shared admin access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
    AND (
      -- Standard admin access
      profiles.role = 'admin' 
      OR 
      -- Shared admin access for sellers with admin role
      (profiles.is_seller = true AND profiles.role = 'admin')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return best selling products with updated Sale/Revenue definitions
  RETURN QUERY
  SELECT 
    oi.product_name,
    SUM(oi.quantity)::integer as total_quantity,
    -- Sale = product/parts price + convenience fees
    SUM(oi.total_price + COALESCE(o.convenience_fee, 0)) as sale,
    -- Revenue = convenience fees only
    SUM(COALESCE(o.convenience_fee, 0)) as revenue,
    COUNT(DISTINCT oi.order_id)::integer as order_count
  FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE o.status = 'confirmed'
    AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY oi.product_name
  ORDER BY sale DESC
  LIMIT limit_count;
END;
$$;

-- Update KPIs function with shared admin access
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
  -- Check if the requesting user is an admin or has shared admin access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
    AND (
      -- Standard admin access
      profiles.role = 'admin' 
      OR 
      -- Shared admin access for sellers with admin role
      (profiles.is_seller = true AND profiles.role = 'admin')
    )
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

-- Update sales chart function with shared admin access
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
  -- Check if the requesting user is an admin or has shared admin access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
    AND (
      -- Standard admin access
      profiles.role = 'admin' 
      OR 
      -- Shared admin access for sellers with admin role
      (profiles.is_seller = true AND profiles.role = 'admin')
    )
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

-- Update recent orders function with shared admin access
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
  -- Check if the requesting user is an admin or has shared admin access
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
    AND (
      -- Standard admin access
      profiles.role = 'admin' 
      OR 
      -- Shared admin access for sellers with admin role
      (profiles.is_seller = true AND profiles.role = 'admin')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return recent orders with customer info using shipping_address from orders
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