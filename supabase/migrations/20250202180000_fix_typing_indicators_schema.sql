-- Fix typing_indicators table by adding missing is_typing column and last_typed_at
-- This resolves the PGRST204 error: "Could not find the 'is_typing' column"

-- Add the missing columns to typing_indicators table
ALTER TABLE typing_indicators 
ADD COLUMN IF NOT EXISTS is_typing BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE typing_indicators 
ADD COLUMN IF NOT EXISTS last_typed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Update existing records to have the new columns
UPDATE typing_indicators 
SET is_typing = TRUE, last_typed_at = created_at 
WHERE is_typing IS NULL OR last_typed_at IS NULL;

-- Create function to automatically update last_typed_at timestamp
CREATE OR REPLACE FUNCTION update_typing_indicators_last_typed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_typed_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_typed_at
DROP TRIGGER IF EXISTS trigger_update_typing_indicators_last_typed_at ON typing_indicators;
CREATE TRIGGER trigger_update_typing_indicators_last_typed_at
  BEFORE UPDATE ON typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_typing_indicators_last_typed_at();

-- Update the cleanup function to use the new columns
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE last_typed_at < NOW() - INTERVAL '10 seconds'
  OR (is_typing = FALSE AND created_at < NOW() - INTERVAL '1 second');
END;
$$ LANGUAGE plpgsql;