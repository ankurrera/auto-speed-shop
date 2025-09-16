-- Add denormalized user profile data to chat_messages table
-- This allows direct access to user information without JOINs for better performance

-- Add the new columns to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create indexes for the new columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_first_name ON chat_messages(first_name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_last_name ON chat_messages(last_name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_email ON chat_messages(email);

-- Backfill existing chat messages with user profile data from profiles table
-- This handles all existing messages to ensure consistency
UPDATE chat_messages 
SET 
  first_name = profiles.first_name,
  last_name = profiles.last_name,
  email = profiles.email
FROM profiles 
WHERE chat_messages.user_id = profiles.user_id
  AND (chat_messages.first_name IS NULL OR chat_messages.last_name IS NULL OR chat_messages.email IS NULL);

-- Create or replace function to automatically populate user profile data on INSERT
CREATE OR REPLACE FUNCTION populate_chat_message_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user profile data and populate the denormalized fields
  SELECT 
    COALESCE(p.first_name, '') as first_name,
    COALESCE(p.last_name, '') as last_name,
    COALESCE(p.email, '') as email
  INTO 
    NEW.first_name,
    NEW.last_name,
    NEW.email
  FROM profiles p 
  WHERE p.user_id = NEW.user_id;
  
  -- If no profile found, use empty strings to avoid NULL values
  IF NEW.first_name IS NULL THEN
    NEW.first_name := '';
  END IF;
  IF NEW.last_name IS NULL THEN
    NEW.last_name := '';
  END IF;
  IF NEW.email IS NULL THEN
    NEW.email := '';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate user data on INSERT
DROP TRIGGER IF EXISTS trigger_populate_chat_message_user_data ON chat_messages;
CREATE TRIGGER trigger_populate_chat_message_user_data
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION populate_chat_message_user_data();

-- Create function to handle profile updates and sync to chat_messages
-- This ensures chat_messages stay in sync when profile data changes
CREATE OR REPLACE FUNCTION sync_profile_to_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all chat messages for this user when profile changes
  UPDATE chat_messages 
  SET 
    first_name = COALESCE(NEW.first_name, ''),
    last_name = COALESCE(NEW.last_name, ''),
    email = COALESCE(NEW.email, '')
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync profile changes to chat_messages
DROP TRIGGER IF EXISTS trigger_sync_profile_to_chat_messages ON profiles;
CREATE TRIGGER trigger_sync_profile_to_chat_messages
  AFTER UPDATE OF first_name, last_name, email ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_chat_messages();