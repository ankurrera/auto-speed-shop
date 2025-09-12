-- Fix wishlist table to add unique constraints for ON CONFLICT operations
-- This fixes the error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- First, drop any existing constraints that might conflict (safe with IF EXISTS)
ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_user_product_unique;
ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_user_part_unique;

-- Add unique constraint for user_id + product_id combination (for products)
-- This handles the case where part_id is NULL and product_id is NOT NULL
ALTER TABLE public.wishlist 
ADD CONSTRAINT wishlist_user_product_unique 
UNIQUE (user_id, product_id);

-- Add unique constraint for user_id + part_id combination (for parts)  
-- This handles the case where product_id is NULL and part_id is NOT NULL
ALTER TABLE public.wishlist 
ADD CONSTRAINT wishlist_user_part_unique 
UNIQUE (user_id, part_id);

-- Note: These constraints will allow the upsert operations in WishlistContext.tsx to work properly
-- when using onConflict: 'user_id,product_id' or onConflict: 'user_id,part_id'
-- PostgreSQL unique constraints treat NULL values as distinct, so this works correctly