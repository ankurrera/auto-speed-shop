-- Create payout management system
-- This adds seller payout tracking and review functionality

-- Seller payouts table
CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  payout_number text UNIQUE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method text DEFAULT 'bank_transfer',
  payment_details jsonb,
  order_ids uuid[],
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES public.profiles(user_id)
);

-- Payout items table to track individual order commissions
CREATE TABLE IF NOT EXISTS public.payout_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id uuid REFERENCES public.seller_payouts(id) ON DELETE CASCADE,
  order_id uuid,
  order_number text,
  commission_rate numeric NOT NULL DEFAULT 0.15, -- 15% default commission
  order_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS policies for seller_payouts
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own payouts" ON public.seller_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = seller_payouts.seller_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payouts" ON public.seller_payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- RLS policies for payout_items
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own payout items" ON public.payout_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.seller_payouts sp
      JOIN public.sellers s ON sp.seller_id = s.id
      WHERE sp.id = payout_items.payout_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payout items" ON public.payout_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Function to generate payout numbers
CREATE OR REPLACE FUNCTION generate_payout_number()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'PAYOUT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval('payout_number_seq')::text, 4, '0');
END;
$$;

-- Create sequence for payout numbers
CREATE SEQUENCE IF NOT EXISTS payout_number_seq START 1;

-- Function to calculate seller payouts for a period
CREATE OR REPLACE FUNCTION public.admin_calculate_seller_payouts(
  requesting_user_id uuid,
  period_start_param timestamptz,
  period_end_param timestamptz
)
RETURNS TABLE(
  seller_id uuid,
  seller_name text,
  seller_email text,
  total_orders integer,
  total_revenue numeric,
  commission_rate numeric,
  payout_amount numeric
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

  RETURN QUERY
  WITH seller_orders AS (
    SELECT 
      s.id as seller_id,
      s.name as seller_name,
      p.email as seller_email,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
      0.15 as commission -- Default 15% commission
    FROM public.sellers s
    JOIN public.profiles p ON s.user_id = p.user_id
    LEFT JOIN public.products prod ON prod.seller_id = s.id
    LEFT JOIN public.parts pt ON pt.seller_id = s.id
    LEFT JOIN public.order_items oi ON (oi.product_id = prod.id OR oi.part_id = pt.id)
    LEFT JOIN public.orders o ON oi.order_id = o.id
    WHERE o.status = 'confirmed' 
      AND o.created_at >= period_start_param 
      AND o.created_at <= period_end_param
    GROUP BY s.id, s.name, p.email
  )
  SELECT 
    so.seller_id,
    so.seller_name,
    so.seller_email,
    so.order_count::integer,
    so.revenue,
    so.commission,
    (so.revenue * so.commission) as payout_amount
  FROM seller_orders so
  WHERE so.revenue > 0
  ORDER BY so.revenue DESC;
END;
$$;

-- Function to create seller payout
CREATE OR REPLACE FUNCTION public.admin_create_seller_payout(
  requesting_user_id uuid,
  target_seller_id uuid,
  period_start_param timestamptz,
  period_end_param timestamptz,
  payment_method_param text DEFAULT 'bank_transfer',
  payment_details_param jsonb DEFAULT NULL
)
RETURNS TABLE(
  payout_id uuid,
  payout_number text,
  amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_payout_id uuid;
  new_payout_number text;
  total_amount numeric := 0;
  commission_rate numeric := 0.15;
  order_record RECORD;
BEGIN
  -- Check if the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Generate payout number
  new_payout_number := generate_payout_number();

  -- Calculate total amount from seller's confirmed orders in period
  SELECT COALESCE(SUM(oi.price * oi.quantity * commission_rate), 0) INTO total_amount
  FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  LEFT JOIN public.products prod ON oi.product_id = prod.id
  LEFT JOIN public.parts pt ON oi.part_id = pt.id
  WHERE o.status = 'confirmed'
    AND o.created_at >= period_start_param 
    AND o.created_at <= period_end_param
    AND (prod.seller_id = target_seller_id OR pt.seller_id = target_seller_id);

  -- Create payout record
  INSERT INTO public.seller_payouts (
    seller_id, payout_number, amount, period_start, period_end, 
    payment_method, payment_details
  ) VALUES (
    target_seller_id, new_payout_number, total_amount, period_start_param, 
    period_end_param, payment_method_param, payment_details_param
  ) RETURNING id INTO new_payout_id;

  -- Create payout items for each order
  FOR order_record IN 
    SELECT DISTINCT o.id, o.order_number, SUM(oi.price * oi.quantity) as order_total
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products prod ON oi.product_id = prod.id
    LEFT JOIN public.parts pt ON oi.part_id = pt.id
    WHERE o.status = 'confirmed'
      AND o.created_at >= period_start_param 
      AND o.created_at <= period_end_param
      AND (prod.seller_id = target_seller_id OR pt.seller_id = target_seller_id)
    GROUP BY o.id, o.order_number
  LOOP
    INSERT INTO public.payout_items (
      payout_id, order_id, order_number, commission_rate, 
      order_amount, commission_amount
    ) VALUES (
      new_payout_id, order_record.id, order_record.order_number, 
      commission_rate, order_record.order_total, 
      order_record.order_total * commission_rate
    );
  END LOOP;

  -- Notify seller
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT 
    s.user_id,
    'system',
    'Payout Created',
    format('A new payout of $%.2f has been created for period %s to %s', 
           total_amount, period_start_param::date, period_end_param::date),
    jsonb_build_object(
      'payout_id', new_payout_id,
      'payout_number', new_payout_number,
      'amount', total_amount
    )
  FROM public.sellers s
  WHERE s.id = target_seller_id;

  RETURN QUERY SELECT new_payout_id, new_payout_number, total_amount;
END;
$$;

-- Function to get all payouts for admin review
CREATE OR REPLACE FUNCTION public.admin_get_all_payouts(
  requesting_user_id uuid,
  payout_status text DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  payout_number text,
  seller_name text,
  seller_email text,
  amount numeric,
  currency text,
  status text,
  payment_method text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz,
  processed_at timestamptz
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

  RETURN QUERY
  SELECT 
    sp.id,
    sp.payout_number,
    s.name as seller_name,
    p.email as seller_email,
    sp.amount,
    sp.currency,
    sp.status,
    sp.payment_method,
    sp.period_start,
    sp.period_end,
    sp.created_at,
    sp.processed_at
  FROM public.seller_payouts sp
  JOIN public.sellers s ON sp.seller_id = s.id
  JOIN public.profiles p ON s.user_id = p.user_id
  WHERE (payout_status IS NULL OR sp.status = payout_status)
  ORDER BY sp.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to update payout status
CREATE OR REPLACE FUNCTION public.admin_update_payout_status(
  requesting_user_id uuid,
  payout_id uuid,
  new_status text
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
  seller_user_id uuid;
  payout_number text;
  payout_amount numeric;
BEGIN
  -- Check if the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = requesting_user_id 
    AND profiles.is_admin = true
  ) THEN
    RETURN QUERY SELECT false, 'Access denied: Admin privileges required';
    RETURN;
  END IF;

  -- Get payout info
  SELECT s.user_id, sp.payout_number, sp.amount 
  INTO seller_user_id, payout_number, payout_amount
  FROM public.seller_payouts sp
  JOIN public.sellers s ON sp.seller_id = s.id
  WHERE sp.id = payout_id;

  IF seller_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Payout not found';
    RETURN;
  END IF;

  -- Update payout
  UPDATE public.seller_payouts 
  SET 
    status = new_status,
    updated_at = now(),
    processed_at = CASE WHEN new_status IN ('completed', 'failed', 'cancelled') THEN now() ELSE processed_at END,
    processed_by = requesting_user_id
  WHERE id = payout_id;

  -- Notify seller
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    seller_user_id,
    'system',
    'Payout Status Updated',
    format('Your payout %s (Amount: $%.2f) status has been updated to: %s', 
           payout_number, payout_amount, new_status),
    jsonb_build_object(
      'payout_id', payout_id,
      'payout_number', payout_number,
      'new_status', new_status,
      'amount', payout_amount
    )
  );

  RETURN QUERY SELECT true, 'Payout status updated successfully';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_calculate_seller_payouts(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_seller_payout(uuid, uuid, timestamptz, timestamptz, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_payouts(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_payout_status(uuid, uuid, text) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_id ON public.seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON public.seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_period ON public.seller_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payout_items_payout_id ON public.payout_items(payout_id);