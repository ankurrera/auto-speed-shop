-- Fix order_items RLS policies
-- This migration adds Row Level Security policies for the order_items table
-- to allow users to create order items during checkout

-- Enable RLS on order_items table (if not already enabled)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view order items for their own orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their own orders" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;

-- Create policy for users to view order items for their own orders
CREATE POLICY "Users can view order items for their own orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Create policy for users to insert order items for their own orders
CREATE POLICY "Users can insert order items for their own orders" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Create policy for admins to manage all order items
CREATE POLICY "Admins can manage all order items" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow service role to manage order items (for server-side operations)
-- This is needed for API endpoints that create orders on behalf of users
CREATE POLICY "Service role can manage all order items" ON public.order_items
    FOR ALL USING (
        current_setting('role', true) = 'service_role'
    );