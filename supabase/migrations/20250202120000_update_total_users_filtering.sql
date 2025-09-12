-- Update get_analytics_users function to implement simplified user counting
-- Changes total_users filtering from complex multi-condition to simple is_admin=FALSE
-- This matches the requirement: "show the count of users from profiles table who's is_admin=FALSE"

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

  -- Get previous month new users for comparison (using simplified filtering)
  SELECT COUNT(*)::integer
  INTO previous_new_users
  FROM public.profiles
  WHERE created_at >= previous_month_start
    AND created_at <= previous_month_end
    AND is_admin = false;

  -- Return user analytics with simplified filtering
  RETURN QUERY
  SELECT 
    -- Updated: Simple filtering - only exclude admins (is_admin = false)
    (SELECT COUNT(*)::integer FROM public.profiles WHERE is_admin = false) as total_users,
    -- Updated: New users this month - also use simplified filtering
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