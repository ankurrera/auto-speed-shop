-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;

-- Add index for performance when querying users who want notifications
CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications 
ON public.profiles(email_notifications) 
WHERE email_notifications = true;

-- Create table to track sent notifications (prevents duplicates)
CREATE TABLE IF NOT EXISTS public.product_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID,
    part_id UUID,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_type TEXT DEFAULT 'new_product',
    CONSTRAINT product_notifications_check CHECK (
        (product_id IS NOT NULL AND part_id IS NULL) OR 
        (product_id IS NULL AND part_id IS NOT NULL)
    )
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_product_notifications_user_id 
ON public.product_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_product_notifications_product_id 
ON public.product_notifications(product_id);

CREATE INDEX IF NOT EXISTS idx_product_notifications_part_id 
ON public.product_notifications(part_id);

-- Enable RLS on product_notifications table
ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_notifications
CREATE POLICY "Users can view their own notifications" ON public.product_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.product_notifications
    FOR INSERT
    WITH CHECK (true);

-- Update the existing RLS policy on profiles to allow notification updates
-- (assuming RLS is already enabled on profiles)
DO $$
BEGIN
    -- Check if the policy exists and create/update it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile notification preferences'
    ) THEN
        CREATE POLICY "Users can update their own profile notification preferences" ON public.profiles
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Add comment explaining the notification system
COMMENT ON COLUMN public.profiles.email_notifications IS 
'Whether the user wants to receive email notifications for new products and parts';

COMMENT ON TABLE public.product_notifications IS 
'Tracks email notifications sent to users to prevent duplicates and provide audit trail';