# Wishlist Constraint Fix

## Problem
Users experienced an error when trying to add parts from the parts table to their wishlist:

```
Error adding to wishlist: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

While products were successfully added to the wishlist, parts were failing with this database constraint error.

## Root Cause
The `wishlist` table was missing unique constraints required for the `upsert` operation with `onConflict` that the `WishlistContext.tsx` uses:

- For products: `onConflict: 'user_id,product_id'`
- For parts: `onConflict: 'user_id,part_id'`

The Supabase `upsert` operation with `onConflict` requires matching unique constraints to exist on the table.

## Solution
Created migration `supabase/migrations/20250125130000_fix_wishlist_unique_constraints.sql` that adds:

1. **`wishlist_user_product_unique (user_id, product_id)`** - Allows products to be upserted
2. **`wishlist_user_part_unique (user_id, part_id)`** - Allows parts to be upserted

### Migration Details
- Safely drops any existing constraints using `DROP CONSTRAINT IF EXISTS`
- Adds new unique constraints for both product and part combinations
- PostgreSQL handles NULL values correctly (NULLs are treated as distinct)
- Works with existing payload structure where either `product_id` OR `part_id` is NULL

## Code Context
The fix addresses this pattern in `src/contexts/WishlistContext.tsx`:

```typescript
const payload = item.is_part
  ? { user_id: userId, part_id: item.id, product_id: null }
  : { user_id: userId, product_id: item.id, part_id: null };

const onConflictColumns = item.is_part ? 'user_id,part_id' : 'user_id,product_id';

const { data, error } = await supabase
  .from('wishlist')
  .upsert(payload, { onConflict: onConflictColumns })
  .select();
```

## How to Apply
1. Run the migration using Supabase CLI: `supabase db push`
2. Or apply manually in Supabase Dashboard SQL Editor

## Verification
After applying the migration:
- ✅ Parts can be added to wishlist without errors
- ✅ Products continue to work as before  
- ✅ Duplicate wishlist entries are prevented via unique constraints
- ✅ Users can toggle items in/out of wishlist repeatedly

## Related Code
- `src/contexts/WishlistContext.tsx` - Main wishlist logic
- `src/contexts/CartContext.tsx` - Similar pattern (likely already has constraints)
- `src/integrations/supabase/types.ts` - Database types