-- Create chat_messages table for real-time user-admin chat functionality
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_id UUID,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Foreign key constraints
  CONSTRAINT fk_chat_messages_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_messages_admin_id 
    FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_admin_id ON chat_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own chat messages
CREATE POLICY "Users can view their own chat messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = user_id OR
    -- Allow admins to see all messages
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy for users to insert their own messages
CREATE POLICY "Users can insert their own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    is_from_admin = false
  );

-- Policy for admins to insert messages as admin
CREATE POLICY "Admins can insert admin messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    ) AND
    is_from_admin = true AND
    admin_id = auth.uid()
  );

-- Policy for admins to update messages (for editing/moderation)
CREATE POLICY "Admins can update chat messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Enable realtime subscriptions for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_messages_updated_at();

-- Create typing_indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_user_id UUID NOT NULL, -- The user this typing indicator is for
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Foreign key constraints
  CONSTRAINT fk_typing_indicators_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_typing_indicators_conversation_user_id 
    FOREIGN KEY (conversation_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
  -- Ensure one typing indicator per user per conversation
  UNIQUE(user_id, conversation_user_id)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_user_id, is_admin);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_created ON typing_indicators(created_at);

-- Enable Row Level Security for typing indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policy for users to see typing indicators in their conversations
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
  FOR SELECT USING (
    auth.uid() = conversation_user_id OR
    (auth.uid() = user_id) OR
    -- Allow admins to see all typing indicators
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy for users to manage their own typing indicators
CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);

-- Enable realtime subscriptions for typing_indicators
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Function to clean up old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE created_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;