# Database Migration Instructions

## Overview
This document provides step-by-step instructions to apply the database migration that fixes all the errors mentioned in the problem statement.

## Errors Being Fixed
1. **AdminDiscountCouponManagement.tsx:95** - `Error: Failed to fetch coupon statistics`
2. **AdminCustomerSupportTools.tsx:89** - `Could not find a relationship between 'support_tickets' and 'profiles'`
3. **UserCoupons.tsx:35** - `column user_coupons.assigned_at does not exist`
4. **UserSupportTickets.tsx:116** - `Could not find a relationship between 'support_tickets' and 'profiles'`
5. **UserSupportTickets.tsx:167** - `null value in column "ticket_number" violates not-null constraint`

## Migration Files Created
- `supabase/migrations/20250212000000_create_coupons_and_support_tables.sql`

## Steps to Apply Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Navigate to project directory
cd /home/runner/work/auto-speed-shop/auto-speed-shop

# Login to Supabase (you'll need the project access token)
npx supabase login

# Link to your project
npx supabase link --project-ref dkopohqiihhxmbjhzark

# Apply the migration
npx supabase db push
```

### Option 2: Using Supabase Dashboard (Alternative)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `dkopohqiihhxmbjhzark`
3. Go to SQL Editor
4. Copy and paste the entire contents of `supabase/migrations/20250212000000_create_coupons_and_support_tables.sql`
5. Execute the SQL

### Option 3: Manual SQL Execution
If you have direct database access:
```sql
-- Copy the entire content from the migration file
-- supabase/migrations/20250212000000_create_coupons_and_support_tables.sql
-- and execute it in your PostgreSQL client
```

## Verification After Migration

### 1. Test Component Pages
After applying the migration, visit these URLs to verify functionality:
- `http://localhost:8080/admin/coupons` - Should load coupon management interface
- `http://localhost:8080/admin/support` - Should load support ticket management
- `http://localhost:8080/user/coupons` - Should show user coupons (empty state is OK)
- `http://localhost:8080/user/support` - Should show user support tickets

### 2. Test Database Tables
Verify tables were created:
```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('coupons', 'user_coupons', 'support_tickets', 'support_ticket_messages');

-- Verify table structures
\d coupons
\d user_coupons  
\d support_tickets
\d support_ticket_messages
```

### 3. Test Functions
```sql
-- Test the coupon stats function
SELECT get_coupon_stats();
```

## Expected Results After Migration

### Before Migration (Current Errors):
- ❌ `Failed to fetch coupon statistics`
- ❌ `Could not find relationship between 'support_tickets' and 'profiles'`
- ❌ `column user_coupons.assigned_at does not exist`
- ❌ `null value in column "ticket_number" violates not-null constraint`

### After Migration (Fixed):
- ✅ Coupon statistics load successfully with `{total_coupons: 0, active_coupons: 0, used_coupons: 0, total_uses: 0}`
- ✅ Support tickets query works with proper profile relationships
- ✅ User coupons table has `assigned_at` column
- ✅ Support tickets auto-generate `ticket_number` values

## Testing with Provided Credentials

Once migration is applied, you can test with:
- **ADMIN_EMAIL**: ankurr.era@gmail.com
- **ADMIN_PASS**: 700028
- **USER_EMAIL**: ankurrera@gmail.com  
- **USER_PASS**: 741101

### Test Flow:
1. Login as admin and test coupon/support management
2. Login as user and test coupon viewing/support ticket creation
3. Verify all CRUD operations work without the original errors

## Rollback (If Needed)
If you need to rollback the migration:
```sql
-- Drop in reverse order due to foreign key constraints
DROP TABLE IF EXISTS support_ticket_messages;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS user_coupons;
DROP TABLE IF EXISTS coupons;
DROP FUNCTION IF EXISTS get_coupon_stats();
```

## Additional Notes
- All tables include RLS (Row Level Security) policies
- Proper indexes are created for performance
- Foreign key relationships ensure data integrity
- The migration is idempotent (safe to run multiple times)

## Support
If you encounter any issues during migration, the error messages should now be much more specific and actionable.