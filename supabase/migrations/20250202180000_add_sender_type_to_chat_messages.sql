-- Add sender_type field to chat_messages table to explicitly track message sender type
-- This addresses the requirement that messages should be saved with sender_type = 'user' or 'admin'

-- Create enum type for sender types
CREATE TYPE sender_type_enum AS ENUM ('user', 'admin');

-- Add the sender_type column
ALTER TABLE chat_messages ADD COLUMN sender_type sender_type_enum;

-- Update existing records to set sender_type based on is_from_admin
UPDATE chat_messages 
SET sender_type = CASE 
  WHEN is_from_admin = true THEN 'admin'::sender_type_enum
  ELSE 'user'::sender_type_enum
END;

-- Make the column NOT NULL after setting values
ALTER TABLE chat_messages ALTER COLUMN sender_type SET NOT NULL;

-- Create index for efficient querying by sender_type
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);

-- Update the RLS policies to work with sender_type as well
-- Note: We'll keep is_from_admin for backward compatibility but add sender_type support

-- Add policy for users to insert messages with sender_type = 'user'
CREATE POLICY "Users can insert user messages with sender_type" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    sender_type = 'user'::sender_type_enum
  );

-- Add policy for admins to insert messages with sender_type = 'admin'
CREATE POLICY "Admins can insert admin messages with sender_type" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    ) AND
    sender_type = 'admin'::sender_type_enum AND
    admin_id = auth.uid()
  );