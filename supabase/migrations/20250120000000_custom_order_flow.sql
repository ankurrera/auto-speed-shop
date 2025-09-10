-- Add custom order flow fields to orders table
-- Add convenience_fee and delivery_charge columns
ALTER TABLE orders 
ADD COLUMN convenience_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN delivery_charge DECIMAL(10,2) DEFAULT 0;

-- Add payment screenshot storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for payment screenshots
CREATE POLICY "Enable all operations for payment screenshots" ON storage.objects
FOR ALL USING (bucket_id = 'payment-screenshots');

-- Create an admin PayPal credentials table (for storing admin's PayPal email)
CREATE TABLE IF NOT EXISTS admin_paypal_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paypal_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default admin PayPal email
INSERT INTO admin_paypal_credentials (paypal_email, is_active)
VALUES ('admin@autospeedshop.com', true)
ON CONFLICT DO NOTHING;

-- RLS policies for admin credentials
ALTER TABLE admin_paypal_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can manage PayPal credentials
CREATE POLICY "Admins can manage PayPal credentials" ON admin_paypal_credentials
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- Regular users can view active PayPal email when they have accepted an invoice
CREATE POLICY "Users can view PayPal email for accepted invoices" ON admin_paypal_credentials
FOR SELECT USING (
    is_active = true AND
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.user_id = auth.uid() 
        AND orders.status IN ('invoice_accepted', 'payment_pending', 'payment_submitted')
    )
);