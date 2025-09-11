-- Add support for parts in order_items table
-- This allows orders to contain both products and parts

-- Add new columns to support parts
ALTER TABLE order_items 
ADD COLUMN part_id UUID REFERENCES parts(id),
ADD COLUMN is_part BOOLEAN DEFAULT false;

-- Make product_id nullable since we now support parts too
ALTER TABLE order_items 
ALTER COLUMN product_id DROP NOT NULL;

-- Add constraint to ensure either product_id or part_id is set, but not both
ALTER TABLE order_items 
ADD CONSTRAINT order_items_product_or_part_check 
CHECK (
  (product_id IS NOT NULL AND part_id IS NULL AND is_part = false) OR
  (part_id IS NOT NULL AND product_id IS NULL AND is_part = true)
);

-- Update the getOrderDetails function to handle both products and parts
-- Update order_items RLS policies to handle parts
DROP POLICY IF EXISTS "Users can view order items for their own orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their own orders" ON public.order_items;

-- Recreate policies that work with both products and parts
CREATE POLICY "Users can view order items for their own orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert order items for their own orders" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );