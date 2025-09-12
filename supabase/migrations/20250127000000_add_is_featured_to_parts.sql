-- Add is_featured column to parts table for feature products functionality
-- This allows parts to be marked as featured for display on the homepage

ALTER TABLE public.parts 
ADD COLUMN is_featured boolean DEFAULT FALSE NOT NULL;

-- Create an index on is_featured for better query performance
CREATE INDEX IF NOT EXISTS idx_parts_is_featured ON public.parts(is_featured) WHERE is_featured = true;

-- Update the database comment
COMMENT ON COLUMN public.parts.is_featured IS 'Boolean flag to mark parts as featured for homepage display';