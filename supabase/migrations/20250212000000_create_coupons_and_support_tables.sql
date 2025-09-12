-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code varchar(50) UNIQUE NOT NULL,
    description text,
    discount_type varchar(20) CHECK (discount_type IN ('percentage', 'fixed_amount')) NOT NULL,
    discount_value decimal(10,2) NOT NULL,
    min_order_amount decimal(10,2) DEFAULT 0,
    max_uses integer DEFAULT NULL,
    uses_count integer DEFAULT 0,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_coupons table
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
    assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    used_at timestamp with time zone DEFAULT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, coupon_id)
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number varchar(20) UNIQUE NOT NULL DEFAULT 'TKT-' || EXTRACT(EPOCH FROM NOW())::bigint,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject varchar(200) NOT NULL,
    description text NOT NULL,
    status varchar(20) CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    priority varchar(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    category varchar(50),
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create support_ticket_messages table for ticket responses
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    is_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON public.user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON public.user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Users can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all coupons" ON public.coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for user_coupons
CREATE POLICY "Users can view their own coupons" ON public.user_coupons
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user coupons" ON public.user_coupons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage user coupons" ON public.user_coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets" ON public.support_tickets
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets" ON public.support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for support_ticket_messages
CREATE POLICY "Users can view messages for their tickets" ON public.support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE id = support_ticket_messages.ticket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages for their tickets" ON public.support_ticket_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE id = support_ticket_messages.ticket_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all ticket messages" ON public.support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create messages on any ticket" ON public.support_ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create functions for statistics
CREATE OR REPLACE FUNCTION get_coupon_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_coupons', (SELECT COUNT(*) FROM public.coupons),
        'active_coupons', (SELECT COUNT(*) FROM public.coupons WHERE is_active = true),
        'used_coupons', (SELECT COUNT(*) FROM public.user_coupons WHERE used_at IS NOT NULL),
        'total_uses', (SELECT COALESCE(SUM(uses_count), 0) FROM public.coupons)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.coupons TO authenticated;
GRANT ALL ON public.user_coupons TO authenticated;
GRANT ALL ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_ticket_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_coupon_stats() TO authenticated;