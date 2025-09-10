# Manual Testing Guide for User Deletion Feature

## Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Ensure you have access to a Supabase project with the migration applied

## Test Scenarios

### Test 1: Admin User Deletion (Profile Only)

**Prerequisites:**
- Have an admin account
- Have a regular user account to delete

**Steps:**
1. Log in as an admin user
2. Navigate to the admin panel/user management section
3. Find a regular user in the user list
4. Click the delete button (trash icon)
5. Confirm the deletion in the toast dialog
6. Verify the user is removed from the list
7. Check the Supabase dashboard - profile should be deleted, auth user should remain

**Expected Results:**
- User profile is deleted from the database
- Related data (addresses, orders) are cleaned up
- User no longer appears in admin user list
- Success toast message appears
- Auth user record still exists (until manually cleaned up)

### Test 2: Self-Deletion Prevention

**Steps:**
1. Log in as an admin user
2. Try to delete your own admin account
3. Observe the error message

**Expected Results:**
- Deletion should fail with "Administrators cannot delete their own account" error

### Test 3: Non-Admin Access Prevention

**Steps:**
1. Log in as a regular (non-admin) user
2. Try to access the admin user management interface
3. If accessible, try to delete a user

**Expected Results:**
- Should not be able to access admin functions
- Any RPC call should fail with permission error

### Test 4: Recreating Account with Same Email

**Prerequisites:**
- Complete Test 1 successfully
- Access to Supabase auth admin or Edge Function for auth deletion

**Steps:**
1. Complete the auth user deletion (manually via Supabase dashboard or admin script)
2. Go to the signup page
3. Try to create a new account with the same email as the deleted user
4. Complete the signup process

**Expected Results:**
- Account creation should succeed without "email already exists" error
- New user profile should be created
- User should be able to log in

### Test 5: Database Trigger Testing

**Prerequisites:**
- Direct access to Supabase dashboard or SQL editor

**Steps:**
1. Create a test user account normally
2. Go to Supabase dashboard → Authentication → Users
3. Manually delete the auth user from the authentication panel
4. Check the profiles table to see if the profile was automatically deleted

**Expected Results:**
- Profile and related data should be automatically cleaned up
- No orphaned profile records should remain

## Database Verification Queries

Run these in the Supabase SQL editor to verify functionality:

```sql
-- Check if the RPC function exists
SELECT routines.routine_name 
FROM information_schema.routines 
WHERE routines.routine_schema = 'public' 
  AND routines.routine_name = 'admin_delete_user_profile';

-- Check if the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_deleted';

-- Count profiles vs auth users (should be equal or profiles should be less)
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.profiles) as profiles;
```

## Troubleshooting

### Common Issues

1. **RPC Function Not Found**: Apply the migration file to your Supabase project
2. **Permission Denied**: Ensure the user is properly authenticated and has admin status
3. **Build Errors**: Run `npm run build` to check for TypeScript errors

### Debug Information

The AdminUserManagement component logs errors to the console. Check browser developer tools for detailed error messages.

## Production Testing Notes

For full production testing (including auth user deletion), you'll need to:

1. Deploy the Edge Function provided in the documentation
2. Update the frontend to call the Edge Function instead of just the RPC
3. Test the complete deletion flow including auth user removal