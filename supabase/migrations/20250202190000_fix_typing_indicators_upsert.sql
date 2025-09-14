-- Update typing indicators to use proper UPSERT logic to avoid duplicate key constraint errors
-- This addresses the "duplicate key value violates unique constraint typing_indicators_user_id_conversation_user_id_key" error

-- Update the setTypingIndicator function to use proper UPSERT
-- The chatService will call this through the supabase client, but we need to ensure the table supports UPSERT correctly

-- Make sure the unique constraint exists properly
DROP INDEX IF EXISTS idx_typing_indicators_unique_user_conversation;
CREATE UNIQUE INDEX IF NOT EXISTS idx_typing_indicators_unique_user_conversation 
ON typing_indicators(user_id, conversation_user_id);

-- Ensure proper cleanup function exists
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  -- Delete indicators older than 10 seconds or explicitly set to not typing
  DELETE FROM typing_indicators 
  WHERE last_typed_at < NOW() - INTERVAL '10 seconds'
  OR (is_typing = FALSE AND created_at < NOW() - INTERVAL '2 seconds');
END;
$$ LANGUAGE plpgsql;

-- Create a function to safely set typing indicator using UPSERT
CREATE OR REPLACE FUNCTION set_typing_indicator(
  p_user_id UUID,
  p_conversation_user_id UUID,
  p_is_typing BOOLEAN,
  p_is_admin BOOLEAN DEFAULT FALSE
)
RETURNS void AS $$
BEGIN
  INSERT INTO typing_indicators (user_id, conversation_user_id, is_typing, is_admin, last_typed_at)
  VALUES (p_user_id, p_conversation_user_id, p_is_typing, p_is_admin, NOW())
  ON CONFLICT (user_id, conversation_user_id)
  DO UPDATE SET 
    is_typing = EXCLUDED.is_typing,
    is_admin = EXCLUDED.is_admin,
    last_typed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_typing_indicator TO authenticated;