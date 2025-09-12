-- Add function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.coupons 
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;