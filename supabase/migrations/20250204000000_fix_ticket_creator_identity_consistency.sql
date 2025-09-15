-- Fix ticket creator identity consistency in customer support
-- This ensures that ticket name and email always reflect the user who created the ticket,
-- regardless of who replies (admin or user)

-- Update the function to ALWAYS use the ticket creator's (user_id) profile data
-- for ALL messages in a conversation, not the message sender's data
CREATE OR REPLACE FUNCTION populate_chat_message_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- ALWAYS populate denormalized fields with the ticket creator's (user_id) profile data
  -- This ensures the ticket identity (name and email) remains consistent regardless of who sends the message
  SELECT 
    COALESCE(p.first_name, '') as first_name,
    COALESCE(p.last_name, '') as last_name,
    COALESCE(p.email, '') as email
  INTO 
    NEW.first_name,
    NEW.last_name,
    NEW.email
  FROM profiles p 
  WHERE p.user_id = NEW.user_id;  -- Always use the user_id (ticket creator), never admin_id
  
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

-- Update existing admin messages to use the ticket creator's profile data instead of admin data
-- This fixes any existing admin messages that currently show admin details instead of the ticket creator
UPDATE chat_messages 
SET 
  first_name = user_profiles.first_name,
  last_name = user_profiles.last_name,
  email = user_profiles.email
FROM profiles user_profiles 
WHERE chat_messages.is_from_admin = true 
  AND user_profiles.user_id = chat_messages.user_id  -- Use user_id (ticket creator), not admin_id
  AND (
    -- Only update messages that currently have admin data instead of user data
    chat_messages.first_name != user_profiles.first_name OR 
    chat_messages.last_name != user_profiles.last_name OR
    chat_messages.email != user_profiles.email OR
    chat_messages.first_name IS NULL OR 
    chat_messages.last_name IS NULL OR
    chat_messages.email IS NULL
  );