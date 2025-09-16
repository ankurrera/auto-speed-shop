-- Fix admin profile data population in chat_messages
-- This ensures admin messages show the admin's name/email instead of the user's data

-- Update the function to handle both user and admin profile data correctly
CREATE OR REPLACE FUNCTION populate_chat_message_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an admin message or user message
  IF NEW.is_from_admin = true AND NEW.admin_id IS NOT NULL THEN
    -- For admin messages, populate with admin's profile data from admin_id
    SELECT 
      COALESCE(p.first_name, '') as first_name,
      COALESCE(p.last_name, '') as last_name,
      COALESCE(p.email, '') as email
    INTO 
      NEW.first_name,
      NEW.last_name,
      NEW.email
    FROM profiles p 
    WHERE p.user_id = NEW.admin_id;
  ELSE
    -- For user messages, populate with user's profile data from user_id
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
  END IF;
  
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

-- Update existing admin messages to have proper admin profile data
-- This fixes any existing admin messages that currently show user data instead of admin data
UPDATE chat_messages 
SET 
  first_name = admin_profiles.first_name,
  last_name = admin_profiles.last_name,
  email = admin_profiles.email
FROM profiles admin_profiles 
WHERE chat_messages.is_from_admin = true 
  AND chat_messages.admin_id IS NOT NULL
  AND admin_profiles.user_id = chat_messages.admin_id;

-- Also update the profile sync function to handle admin messages correctly
CREATE OR REPLACE FUNCTION sync_profile_to_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Update chat messages where this user is the sender (regular user messages)
  UPDATE chat_messages 
  SET 
    first_name = COALESCE(NEW.first_name, ''),
    last_name = COALESCE(NEW.last_name, ''),
    email = COALESCE(NEW.email, '')
  WHERE user_id = NEW.user_id
    AND (is_from_admin = false OR admin_id IS NULL);
  
  -- Update chat messages where this user is the admin sender (admin messages)
  UPDATE chat_messages 
  SET 
    first_name = COALESCE(NEW.first_name, ''),
    last_name = COALESCE(NEW.last_name, ''),
    email = COALESCE(NEW.email, '')
  WHERE admin_id = NEW.user_id
    AND is_from_admin = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;