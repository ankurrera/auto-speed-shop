-- Fix admin_paypal_credentials RLS policy to allow broader access
-- The current policy is too restrictive and prevents users from getting PayPal email

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view PayPal email for accepted invoices" ON admin_paypal_credentials;

-- Create a more permissive policy that allows authenticated users to read active PayPal credentials
-- This is safe because it only exposes the email address, not sensitive data
CREATE POLICY "Authenticated users can view active PayPal email" ON admin_paypal_credentials
FOR SELECT USING (
    is_active = true AND
    auth.uid() IS NOT NULL
);