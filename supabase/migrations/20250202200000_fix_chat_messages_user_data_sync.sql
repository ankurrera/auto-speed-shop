-- Comprehensive fix for chat messages user data synchronization issues
-- This migration addresses the problem where chat messages sometimes show "Unknown User"

-- First, let's improve the trigger function to handle edge cases better
CREATE OR REPLACE FUNCTION populate_chat_message_user_data()
RETURNS TRIGGER AS $$
DECLARE
  profile_record profiles%ROWTYPE;
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'populate_chat_message_user_data: Processing message for user_id: %', NEW.user_id;
  
  -- Get user profile data - use explicit query for better control
  SELECT * INTO profile_record
  FROM profiles 
  WHERE user_id = NEW.user_id
  LIMIT 1;
  
  -- If profile found, use profile data
  IF FOUND THEN
    NEW.first_name := COALESCE(profile_record.first_name, '');
    NEW.last_name := COALESCE(profile_record.last_name, '');
    NEW.email := COALESCE(profile_record.email, '');
    
    RAISE LOG 'populate_chat_message_user_data: Found profile for user %, set name: "% %", email: %', 
      NEW.user_id, NEW.first_name, NEW.last_name, NEW.email;
  ELSE
    -- If no profile found, try to get basic info from auth.users
    SELECT 
      COALESCE(raw_user_meta_data->>'first_name', ''),
      COALESCE(raw_user_meta_data->>'last_name', ''),
      COALESCE(email, '')
    INTO 
      NEW.first_name,
      NEW.last_name,
      NEW.email
    FROM auth.users 
    WHERE id = NEW.user_id;
    
    -- If still no data found, set fallback values
    IF NOT FOUND THEN
      NEW.first_name := '';
      NEW.last_name := '';
      NEW.email := '';
      RAISE LOG 'populate_chat_message_user_data: No profile or auth data found for user %, using empty defaults', NEW.user_id;
    ELSE
      RAISE LOG 'populate_chat_message_user_data: Used auth.users fallback for user %, set name: "% %", email: %', 
        NEW.user_id, NEW.first_name, NEW.last_name, NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS trigger_populate_chat_message_user_data ON chat_messages;
CREATE TRIGGER trigger_populate_chat_message_user_data
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION populate_chat_message_user_data();

-- Improve the profile sync function to handle updates better
CREATE OR REPLACE FUNCTION sync_profile_to_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the sync operation
  RAISE LOG 'sync_profile_to_chat_messages: Syncing profile changes for user % to chat messages', NEW.user_id;
  
  -- Update all chat messages for this user when profile changes
  UPDATE chat_messages 
  SET 
    first_name = COALESCE(NEW.first_name, ''),
    last_name = COALESCE(NEW.last_name, ''),
    email = COALESCE(NEW.email, '')
  WHERE user_id = NEW.user_id;
  
  -- Log how many messages were updated
  RAISE LOG 'sync_profile_to_chat_messages: Updated % chat messages for user %', 
    GET DIAGNOSTICS n = ROW_COUNT, NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the profile sync trigger
DROP TRIGGER IF EXISTS trigger_sync_profile_to_chat_messages ON profiles;
CREATE TRIGGER trigger_sync_profile_to_chat_messages
  AFTER UPDATE OF first_name, last_name, email ON profiles
  FOR EACH ROW
  WHEN (OLD.first_name IS DISTINCT FROM NEW.first_name OR 
        OLD.last_name IS DISTINCT FROM NEW.last_name OR 
        OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_profile_to_chat_messages();

-- Create a function to backfill missing user data in existing chat messages
CREATE OR REPLACE FUNCTION backfill_chat_messages_user_data()
RETURNS TABLE(
  messages_processed INTEGER,
  messages_updated INTEGER,
  messages_with_missing_data INTEGER
) AS $$
DECLARE
  total_processed INTEGER := 0;
  total_updated INTEGER := 0;
  total_missing INTEGER := 0;
  message_record chat_messages%ROWTYPE;
  profile_record profiles%ROWTYPE;
  update_needed BOOLEAN;
BEGIN
  -- Count messages with missing data first
  SELECT COUNT(*) INTO total_missing
  FROM chat_messages 
  WHERE (first_name IS NULL OR first_name = '') 
    AND (last_name IS NULL OR last_name = '') 
    AND (email IS NULL OR email = '');

  RAISE LOG 'backfill_chat_messages_user_data: Found % messages with missing user data', total_missing;

  -- Process each message that has missing user data
  FOR message_record IN 
    SELECT * FROM chat_messages 
    WHERE (first_name IS NULL OR first_name = '') 
      AND (last_name IS NULL OR last_name = '') 
      AND (email IS NULL OR email = '')
    ORDER BY created_at ASC
  LOOP
    total_processed := total_processed + 1;
    update_needed := FALSE;
    
    -- Try to get profile data for this user
    SELECT * INTO profile_record
    FROM profiles 
    WHERE user_id = message_record.user_id
    LIMIT 1;
    
    IF FOUND THEN
      -- Update the message with profile data
      UPDATE chat_messages 
      SET 
        first_name = COALESCE(profile_record.first_name, ''),
        last_name = COALESCE(profile_record.last_name, ''),
        email = COALESCE(profile_record.email, '')
      WHERE id = message_record.id;
      
      total_updated := total_updated + 1;
      update_needed := TRUE;
      
      RAISE LOG 'backfill_chat_messages_user_data: Updated message % with profile data for user %', 
        message_record.id, message_record.user_id;
    ELSE
      -- Try to get data from auth.users as fallback
      UPDATE chat_messages 
      SET 
        first_name = COALESCE((
          SELECT COALESCE(raw_user_meta_data->>'first_name', '') 
          FROM auth.users 
          WHERE id = message_record.user_id
        ), ''),
        last_name = COALESCE((
          SELECT COALESCE(raw_user_meta_data->>'last_name', '') 
          FROM auth.users 
          WHERE id = message_record.user_id
        ), ''),
        email = COALESCE((
          SELECT COALESCE(email, '') 
          FROM auth.users 
          WHERE id = message_record.user_id
        ), '')
      WHERE id = message_record.id;
      
      IF FOUND THEN
        total_updated := total_updated + 1;
        update_needed := TRUE;
        RAISE LOG 'backfill_chat_messages_user_data: Updated message % with auth.users fallback for user %', 
          message_record.id, message_record.user_id;
      END IF;
    END IF;
    
    -- If we couldn't find any data, log it
    IF NOT update_needed THEN
      RAISE LOG 'backfill_chat_messages_user_data: No user data found for message % (user %)', 
        message_record.id, message_record.user_id;
    END IF;
  END LOOP;

  -- Return summary statistics
  messages_processed := total_processed;
  messages_updated := total_updated;
  messages_with_missing_data := total_missing;
  
  RAISE LOG 'backfill_chat_messages_user_data: Completed. Processed: %, Updated: %, Originally Missing: %', 
    total_processed, total_updated, total_missing;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Run the backfill function to fix existing data
DO $$
DECLARE
  backfill_result RECORD;
BEGIN
  -- Execute the backfill
  SELECT * INTO backfill_result FROM backfill_chat_messages_user_data();
  
  RAISE NOTICE 'Chat messages user data backfill completed:';
  RAISE NOTICE '  Messages processed: %', backfill_result.messages_processed;
  RAISE NOTICE '  Messages updated: %', backfill_result.messages_updated;
  RAISE NOTICE '  Messages originally missing data: %', backfill_result.messages_with_missing_data;
END;
$$;

-- Create a view for easier debugging of chat message user data
CREATE OR REPLACE VIEW chat_messages_with_user_info AS
SELECT 
  cm.id,
  cm.user_id,
  cm.message,
  cm.sender_type,
  cm.is_from_admin,
  cm.created_at,
  -- Denormalized data from chat_messages
  cm.first_name as chat_first_name,
  cm.last_name as chat_last_name,
  cm.email as chat_email,
  -- Profile data for comparison
  p.first_name as profile_first_name,
  p.last_name as profile_last_name,
  p.email as profile_email,
  p.is_admin,
  -- Computed display values
  CASE 
    WHEN cm.first_name IS NOT NULL AND cm.first_name != '' 
      THEN cm.first_name || ' ' || COALESCE(cm.last_name, '')
    WHEN p.first_name IS NOT NULL AND p.first_name != ''
      THEN p.first_name || ' ' || COALESCE(p.last_name, '')
    ELSE 'Unknown User'
  END as display_name,
  CASE 
    WHEN cm.email IS NOT NULL AND cm.email != '' 
      THEN cm.email
    WHEN p.email IS NOT NULL AND p.email != ''
      THEN p.email
    ELSE 'user-' || LEFT(cm.user_id::text, 8) || '@unknown.com'
  END as display_email
FROM chat_messages cm
LEFT JOIN profiles p ON cm.user_id = p.user_id
ORDER BY cm.created_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON chat_messages_with_user_info TO authenticated;

-- Create a function to verify chat message user data integrity
CREATE OR REPLACE FUNCTION verify_chat_messages_user_data()
RETURNS TABLE(
  total_messages INTEGER,
  messages_with_complete_data INTEGER,
  messages_with_missing_names INTEGER,
  messages_with_missing_emails INTEGER,
  messages_with_all_missing INTEGER,
  data_integrity_score NUMERIC
) AS $$
DECLARE
  total_count INTEGER;
  complete_count INTEGER;
  missing_names_count INTEGER;
  missing_emails_count INTEGER;
  all_missing_count INTEGER;
  integrity_score NUMERIC;
BEGIN
  -- Get total message count
  SELECT COUNT(*) INTO total_count FROM chat_messages;
  
  -- Count messages with complete data
  SELECT COUNT(*) INTO complete_count
  FROM chat_messages 
  WHERE first_name IS NOT NULL AND first_name != ''
    AND last_name IS NOT NULL AND last_name != ''
    AND email IS NOT NULL AND email != '';
  
  -- Count messages with missing names
  SELECT COUNT(*) INTO missing_names_count
  FROM chat_messages 
  WHERE (first_name IS NULL OR first_name = '')
    AND (last_name IS NULL OR last_name = '');
  
  -- Count messages with missing emails
  SELECT COUNT(*) INTO missing_emails_count
  FROM chat_messages 
  WHERE email IS NULL OR email = '';
  
  -- Count messages with all data missing
  SELECT COUNT(*) INTO all_missing_count
  FROM chat_messages 
  WHERE (first_name IS NULL OR first_name = '')
    AND (last_name IS NULL OR last_name = '')
    AND (email IS NULL OR email = '');
  
  -- Calculate integrity score (percentage of messages with complete data)
  IF total_count > 0 THEN
    integrity_score := ROUND((complete_count::NUMERIC / total_count::NUMERIC) * 100, 2);
  ELSE
    integrity_score := 100.0;
  END IF;
  
  -- Return results
  total_messages := total_count;
  messages_with_complete_data := complete_count;
  messages_with_missing_names := missing_names_count;
  messages_with_missing_emails := missing_emails_count;
  messages_with_all_missing := all_missing_count;
  data_integrity_score := integrity_score;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Log the current state after the migration
DO $$
DECLARE
  verification_result RECORD;
BEGIN
  SELECT * INTO verification_result FROM verify_chat_messages_user_data();
  
  RAISE NOTICE 'Chat messages user data verification after migration:';
  RAISE NOTICE '  Total messages: %', verification_result.total_messages;
  RAISE NOTICE '  Messages with complete data: %', verification_result.messages_with_complete_data;
  RAISE NOTICE '  Messages with missing names: %', verification_result.messages_with_missing_names;
  RAISE NOTICE '  Messages with missing emails: %', verification_result.messages_with_missing_emails;
  RAISE NOTICE '  Messages with all data missing: %', verification_result.messages_with_all_missing;
  RAISE NOTICE '  Data integrity score: %', verification_result.data_integrity_score;
END;
$$;