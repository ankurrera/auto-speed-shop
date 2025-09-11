-- Fix user role consistency for existing profiles
-- This migration ensures all existing users have the correct role value
-- to make them visible in user count queries

-- First, let's ensure the role column exists and has proper defaults
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user';

-- Update any profiles with NULL or missing role values
-- Set role to 'user' for regular users (is_admin=false and is_seller=false)
UPDATE public.profiles 
SET role = 'user'
WHERE (role IS NULL OR role = '')
  AND is_admin = false 
  AND is_seller = false;

-- Update any profiles that should be admin but aren't marked as such
UPDATE public.profiles 
SET role = 'admin'
WHERE is_admin = true 
  AND (role IS NULL OR role != 'admin');

-- Update any profiles that should be seller but don't have proper role
UPDATE public.profiles 
SET role = 'user'  -- sellers are still users, just with is_seller=true
WHERE is_seller = true 
  AND is_admin = false
  AND (role IS NULL OR role = '');

-- Ensure all profiles have a role value (fallback to 'user')
UPDATE public.profiles 
SET role = 'user'
WHERE role IS NULL OR role = '';

-- Add a comment to track this fix
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, user. Updated by migration 20250911120000 to fix user count consistency.';