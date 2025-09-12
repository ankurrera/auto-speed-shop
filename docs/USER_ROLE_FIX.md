# User Role Consistency Fix

## Problem
Users were reporting that the admin dashboard showed "Total user = 0" even when users existed in the database. This happened because the user counting queries filter for users with:
- `is_admin = false`
- `is_seller = false`  
- `role = 'user'`

However, existing user profiles in the database had inconsistent `role` values (NULL, empty, or incorrect values), making them invisible to the counting queries.

## Solution
The migration `20250911120000_fix_user_role_consistency.sql` fixes this by:

1. **Setting column default**: Ensures new profiles default to `role = 'user'`
2. **Updating NULL/empty roles for regular users**: Sets `role = 'user'` for users with `is_admin = false` and `is_seller = false`
3. **Fixing admin user roles**: Ensures admin users have `role = 'admin'`
4. **Fixing seller user roles**: Ensures sellers have `role = 'user'` (sellers are users with `is_seller = true`)
5. **Correcting wrong role values**: Fixes regular users who had incorrect role values
6. **Fallback protection**: Ensures all profiles have a role value

## Expected Impact
After applying this migration:
- Users who were previously uncounted due to NULL/empty/incorrect role values will be included in user count queries
- Admin dashboard will show correct user counts
- All user filtering in the application will work consistently
- No existing functionality is broken - this is purely a data consistency fix

## Files Changed
- `supabase/migrations/20250911120000_fix_user_role_consistency.sql` - New migration file
- `docs/USER_ROLE_FIX.md` - This documentation file

## Testing
The migration logic was validated with a test script that simulates various profile states and verifies all edge cases are handled correctly.