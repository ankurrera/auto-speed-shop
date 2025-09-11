-- Create email_subscriptions table for managing user email notification preferences
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    subscribed_to_new_products boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for email_subscriptions table
CREATE POLICY "Users can view their own email subscriptions" ON public.email_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email subscriptions" ON public.email_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email subscriptions" ON public.email_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email subscriptions" ON public.email_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Admin can view all email subscriptions for sending notifications
CREATE POLICY "Admins can view all email subscriptions" ON public.email_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_email_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_subscriptions_updated_at_trigger
    BEFORE UPDATE ON public.email_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_email_subscriptions_updated_at();

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_id ON public.email_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_subscribed ON public.email_subscriptions(subscribed_to_new_products) WHERE subscribed_to_new_products = true;