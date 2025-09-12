-- Create tables for coupon management and notification system
-- This supports discount/coupon management and user notifications

-- Coupons table for managing discount codes
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  minimum_order_amount numeric DEFAULT 0,
  maximum_discount_amount numeric,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User coupons table for tracking which users received which coupons
CREATE TABLE IF NOT EXISTS public.user_coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  used_at timestamptz,
  is_used boolean DEFAULT false,
  UNIQUE(user_id, coupon_id)
);

-- Notifications table for user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('coupon', 'order', 'system', 'support')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- RLS policies for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- RLS policies for user_coupons
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coupons" ON public.user_coupons
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user coupons" ON public.user_coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Function to send coupon to user
CREATE OR REPLACE FUNCTION public.admin_send_coupon_to_user(
  requesting_user_id uuid,
  target_user_id uuid,
  coupon_id uuid
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
  coupon_record RECORD;
  existing_coupon_count integer := 0;
BEGIN
  -- Check if the requesting user is an admin
  SELECT profiles.is_admin INTO is_admin 
  FROM public.profiles 
  WHERE profiles.user_id = requesting_user_id;

  IF NOT COALESCE(is_admin, false) THEN
    RETURN QUERY SELECT false, 'Access denied: Admin privileges required';
    RETURN;
  END IF;

  -- Check if coupon exists and is active
  SELECT * INTO coupon_record 
  FROM public.coupons 
  WHERE id = coupon_id AND is_active = true;

  IF coupon_record IS NULL THEN
    RETURN QUERY SELECT false, 'Coupon not found or inactive';
    RETURN;
  END IF;

  -- Check if user already has this coupon
  SELECT COUNT(*) INTO existing_coupon_count
  FROM public.user_coupons
  WHERE user_id = target_user_id AND coupon_id = coupon_id;

  IF existing_coupon_count > 0 THEN
    RETURN QUERY SELECT false, 'User already has this coupon';
    RETURN;
  END IF;

  -- Insert coupon for user
  INSERT INTO public.user_coupons (user_id, coupon_id)
  VALUES (target_user_id, coupon_id);

  -- Create notification for user
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    target_user_id,
    'coupon',
    'New Coupon Received!',
    format('You have received a new discount coupon: %s', coupon_record.name),
    jsonb_build_object(
      'coupon_id', coupon_id,
      'coupon_code', coupon_record.code,
      'discount_type', coupon_record.discount_type,
      'discount_value', coupon_record.discount_value
    )
  );

  RETURN QUERY SELECT true, 'Coupon sent successfully';
END;
$$;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  requesting_user_id uuid,
  limit_count integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  type text,
  title text,
  message text,
  data jsonb,
  is_read boolean,
  created_at timestamptz,
  read_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.data,
    n.is_read,
    n.created_at,
    n.read_at
  FROM public.notifications n
  WHERE n.user_id = requesting_user_id
  ORDER BY n.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  requesting_user_id uuid,
  notification_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE id = notification_id AND user_id = requesting_user_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_send_coupon_to_user(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid, uuid) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON public.user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);