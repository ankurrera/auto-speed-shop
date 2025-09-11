-- Fix parts table RLS policies
-- This migration adds Row Level Security policies for the parts table
-- to allow sellers to manage their own parts

-- Enable RLS on parts table (if not already enabled)
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Everyone can view active parts" ON public.parts;
DROP POLICY IF EXISTS "Sellers can manage their own parts" ON public.parts;
DROP POLICY IF EXISTS "Sellers can insert their own parts" ON public.parts;
DROP POLICY IF EXISTS "Sellers can update their own parts" ON public.parts;
DROP POLICY IF EXISTS "Sellers can delete their own parts" ON public.parts;
DROP POLICY IF EXISTS "Admins can manage all parts" ON public.parts;

-- Create policy for public to view active parts
CREATE POLICY "Everyone can view active parts" ON public.parts
    FOR SELECT USING (is_active = true);

-- Create policy for sellers to view their own parts (including inactive ones)
CREATE POLICY "Sellers can view their own parts" ON public.parts
    FOR SELECT USING (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = parts.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Create policy for sellers to insert their own parts
CREATE POLICY "Sellers can insert their own parts" ON public.parts
    FOR INSERT WITH CHECK (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = parts.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Create policy for sellers to update their own parts
CREATE POLICY "Sellers can update their own parts" ON public.parts
    FOR UPDATE USING (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = parts.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Create policy for sellers to delete their own parts
CREATE POLICY "Sellers can delete their own parts" ON public.parts
    FOR DELETE USING (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = parts.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );

-- Create policy for admins to manage all parts
CREATE POLICY "Admins can manage all parts" ON public.parts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow service role to manage parts (for server-side operations)
CREATE POLICY "Service role can manage all parts" ON public.parts
    FOR ALL USING (
        current_setting('role', true) = 'service_role'
    );