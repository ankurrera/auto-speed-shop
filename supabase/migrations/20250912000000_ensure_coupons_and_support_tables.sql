-- Ensure all required tables and columns exist for coupons and support tickets functionality
-- This migration is defensive and creates tables/columns only if they don't exist

-- Ensure support_tickets table exists
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id TEXT UNIQUE NOT NULL DEFAULT 'TKT-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTR(gen_random_uuid()::TEXT, 1, 6),
    user_id UUID NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'general',
    admin_response TEXT,
    admin_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure coupons table exists
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
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_coupons table exists
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    coupon_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'used', 'expired')),
    order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints if they don't exist (these will fail silently if they already exist)
DO $$ 
BEGIN
    -- Support tickets foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'support_tickets_user_id_fkey'
    ) THEN
        ALTER TABLE public.support_tickets 
        ADD CONSTRAINT support_tickets_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'support_tickets_admin_id_fkey'
    ) THEN
        ALTER TABLE public.support_tickets 
        ADD CONSTRAINT support_tickets_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;

    -- Coupons foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'coupons_created_by_fkey'
    ) THEN
        ALTER TABLE public.coupons 
        ADD CONSTRAINT coupons_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;

    -- User coupons foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_coupons_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_coupons 
        ADD CONSTRAINT user_coupons_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_coupons_coupon_id_fkey'
    ) THEN
        ALTER TABLE public.user_coupons 
        ADD CONSTRAINT user_coupons_coupon_id_fkey 
        FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_coupons_order_id_fkey'
    ) THEN
        -- Only add this constraint if orders table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
            ALTER TABLE public.user_coupons 
            ADD CONSTRAINT user_coupons_order_id_fkey 
            FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Add unique constraint on user_coupons if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_coupons_user_id_coupon_id_key'
    ) THEN
        ALTER TABLE public.user_coupons 
        ADD CONSTRAINT user_coupons_user_id_coupon_id_key 
        UNIQUE (user_id, coupon_id);
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (these will not error if they already exist)
DO $$
BEGIN
    -- Support tickets policies
    DROP POLICY IF EXISTS "Users can view their own support tickets" ON public.support_tickets;
    CREATE POLICY "Users can view their own support tickets" ON public.support_tickets
        FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can create their own support tickets" ON public.support_tickets
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can view all support tickets" ON public.support_tickets;
    CREATE POLICY "Admins can view all support tickets" ON public.support_tickets
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.user_id = auth.uid() 
                AND profiles.is_admin = true
            )
        );

    DROP POLICY IF EXISTS "Admins can update all support tickets" ON public.support_tickets;
    CREATE POLICY "Admins can update all support tickets" ON public.support_tickets
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.user_id = auth.uid() 
                AND profiles.is_admin = true
            )
        );

    -- Coupons policies
    DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
    CREATE POLICY "Anyone can view active coupons" ON public.coupons
        FOR SELECT USING (status = 'active' AND (valid_until IS NULL OR valid_until > NOW()));

    DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
    CREATE POLICY "Admins can manage coupons" ON public.coupons
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.user_id = auth.uid() 
                AND profiles.is_admin = true
            )
        );

    -- User coupons policies
    DROP POLICY IF EXISTS "Users can view their own coupons" ON public.user_coupons;
    CREATE POLICY "Users can view their own coupons" ON public.user_coupons
        FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own coupons" ON public.user_coupons;
    CREATE POLICY "Users can update their own coupons" ON public.user_coupons
        FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can manage all user coupons" ON public.user_coupons;
    CREATE POLICY "Admins can manage all user coupons" ON public.user_coupons
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.user_id = auth.uid() 
                AND profiles.is_admin = true
            )
        );
END $$;

-- Create indexes for better performance (will not error if they already exist)
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON public.user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON public.user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_status ON public.user_coupons(status);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (will not error if they already exist)
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON public.support_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at 
    BEFORE UPDATE ON public.coupons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_coupons_updated_at ON public.user_coupons;
CREATE TRIGGER update_user_coupons_updated_at 
    BEFORE UPDATE ON public.user_coupons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create or replace coupon utility functions
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.coupons 
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_coupon_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_coupons() TO authenticated;