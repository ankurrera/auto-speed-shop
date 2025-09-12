-- Add updated_at column to parts table if it doesn't exist
-- This fixes the payment verification error that occurs when admin_verify_payment
-- tries to update the updated_at column on parts during stock decrement

-- Check if updated_at column exists and add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'parts' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.parts 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
        
        -- Create an index on updated_at for better query performance
        CREATE INDEX IF NOT EXISTS idx_parts_updated_at ON public.parts(updated_at);
        
        -- Add a comment explaining the column
        COMMENT ON COLUMN public.parts.updated_at IS 'Timestamp when the part record was last updated';
    END IF;
END $$;