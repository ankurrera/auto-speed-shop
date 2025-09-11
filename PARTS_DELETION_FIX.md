# Fix for Parts Deletion Issue

## Problem
Users were experiencing a 409 Conflict error when trying to delete parts from the website using the Supabase REST API endpoint:
```
DELETE https://dkopohqiihhxmbjhzark.supabase.co/rest/v1/parts?id=eq.9a50ff58-268e-40f4-a4cb-e31ff538ada8
```

The error indicated that while products could be deleted successfully, parts deletion was failing.

## Root Cause
The issue was caused by missing Row Level Security (RLS) policies for the `parts` table in Supabase. The table had RLS enabled (which is the default) but lacked the necessary policies to allow sellers to delete their own parts.

## Solution
Created two new migration files:

1. **20250911100000_fix_parts_rls_policies.sql** - Adds comprehensive RLS policies for the `parts` table
2. **20250911100100_fix_products_rls_policies.sql** - Adds comprehensive RLS policies for the `products` table (for consistency)

### Policies Added

For both tables, the following policies were created:

1. **Public Read Access**: Everyone can view active products/parts
2. **Seller Management**: Sellers can view, insert, update, and delete their own products/parts
3. **Admin Access**: Admins can manage all products/parts
4. **Service Role Access**: Allows server-side operations

The key policy that fixes the deletion issue:
```sql
CREATE POLICY "Sellers can delete their own parts" ON public.parts
    FOR DELETE USING (
        seller_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.sellers 
            WHERE sellers.id = parts.seller_id 
            AND sellers.user_id = auth.uid()
        )
    );
```

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)
```bash
supabase db push
```

### Option 2: Using Supabase Dashboard
1. Go to the Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the content of each migration file
4. Run them in order (parts first, then products)

### Option 3: Using Database Migrations (if using a migration tool)
The migration files are timestamped and will be applied automatically by your migration system.

## Verification
After applying the migrations, sellers should be able to:
- Delete their own parts without getting a 409 Conflict error
- Continue to delete their own products as before
- View and manage only their own products/parts (not others')

## Notes
- The migrations include `DROP POLICY IF EXISTS` statements to prevent conflicts if policies already exist
- Admin users retain full access to manage all products and parts
- Public users can only view active (published) products and parts
- The service role can perform all operations for server-side functionality