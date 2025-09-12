-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id TEXT UNIQUE NOT NULL DEFAULT 'CPN-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTR(gen_random_uuid()::TEXT, 1, 6),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_amount DECIMAL(10,2) CHECK (min_order_amount >= 0),
    max_discount_amount DECIMAL(10,2) CHECK (max_discount_amount >= 0),
    usage_limit INTEGER CHECK (usage_limit > 0),
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_coupons table for assigned coupons
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'used', 'expired')),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, coupon_id)
);

-- Create RLS policies for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active coupons (for public promotions)
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (status = 'active' AND (valid_until IS NULL OR valid_until > NOW()));

-- Only admins can create/update/delete coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create RLS policies for user_coupons
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- Users can view their own assigned coupons
CREATE POLICY "Users can view their own coupons" ON public.user_coupons
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own coupons (mark as used)
CREATE POLICY "Users can update their own coupons" ON public.user_coupons
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view and manage all user coupons
CREATE POLICY "Admins can manage all user coupons" ON public.user_coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON public.user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON public.user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_status ON public.user_coupons(status);

-- Create updated_at triggers
CREATE TRIGGER update_coupons_updated_at 
    BEFORE UPDATE ON public.coupons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_coupons_updated_at 
    BEFORE UPDATE ON public.user_coupons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire coupons
CREATE OR REPLACE FUNCTION expire_old_coupons()
RETURNS void AS $$
BEGIN
    UPDATE public.coupons 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND valid_until IS NOT NULL 
    AND valid_until < NOW();
    
    UPDATE public.user_coupons 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'assigned' 
    AND coupon_id IN (
        SELECT id FROM public.coupons WHERE status = 'expired'
    );
END;
$$ LANGUAGE plpgsql;