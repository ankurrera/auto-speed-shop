-- Create email subscriptions table for product notifications
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscribed_to_new_products BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.email_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.email_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON public.email_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON public.email_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for admins to read all subscriptions (for sending notifications)
CREATE POLICY "Admins can read all subscriptions" ON public.email_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_email_subscriptions_updated_at 
  BEFORE UPDATE ON public.email_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.email_subscriptions TO authenticated;
GRANT ALL ON public.email_subscriptions TO service_role;