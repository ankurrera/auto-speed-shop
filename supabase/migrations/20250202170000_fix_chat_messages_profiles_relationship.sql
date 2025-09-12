-- Fix chat_messages table to properly reference profiles table instead of auth.users
-- This fixes the relationship error: "Could not find a relationship between 'chat_messages' and 'profiles' in the schema cache"

-- First, drop the existing foreign key constraints that reference auth.users
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS fk_chat_messages_user_id;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS fk_chat_messages_admin_id;

-- Add new foreign key constraints that reference profiles.user_id
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_admin_id 
FOREIGN KEY (admin_id) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Update the RLS policies to ensure they still work with the new relationships
-- The policies should still work as they reference profiles table directly