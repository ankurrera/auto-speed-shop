-- Fix products table RLS policies
-- This migration adds Row Level Security policies for the products table
-- to ensure sellers can manage their own products consistently

-- Enable RLS on products table (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Create policy for public to view active products
CREATE POLICY "Everyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Create policy for sellers to view their own products (including inactive ones)
CREATE POLICY "Sellers can view their own products" ON public.products
    FOR SELECT USING (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = products.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Create policy for sellers to insert their own products
CREATE POLICY "Sellers can insert their own products" ON public.products
    FOR INSERT WITH CHECK (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = products.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Create policy for sellers to update their own products
CREATE POLICY "Sellers can update their own products" ON public.products
    FOR UPDATE USING (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = products.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Create policy for sellers to delete their own products
CREATE POLICY "Sellers can delete their own products" ON public.products
    FOR DELETE USING (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = products.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Create policy for admins to manage all products
CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow service role to manage products (for server-side operations)
CREATE POLICY "Service role can manage all products" ON public.products
    FOR ALL USING (
        current_setting('role', true) = 'service_role'
    );