# User Deletion and Authentication Management

## Overview

This project implements a cascading user deletion system that handles the synchronization between user profiles and Supabase authentication records.

## Current Implementation

### Profile Deletion (Implemented)
- The `admin_delete_user_profile` RPC function handles profile deletion with proper admin validation
- Deletes related data: addresses, orders, sellers records
- Includes safety checks to prevent admins from deleting themselves
- Only administrators can delete user profiles

### Authentication User Cleanup (Requires Admin Setup)

The current implementation handles profile deletion but leaves authentication user cleanup for production deployment. Here's how to complete the setup:

#### Option 1: Edge Function (Recommended for Production)
Create a Supabase Edge Function with service role privileges:

```typescript
// supabase/functions/admin-delete-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { userId } = await req.json()
  
  // Initialize Supabase with service role key
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  try {
    // Delete profile first (handles validations)
    const { error: profileError } = await supabaseAdmin.rpc('admin_delete_user_profile', {
      target_user_id: userId
    })
    
    if (profileError) throw profileError
    
    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) throw authError
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

#### Option 2: Backend Service
Create a backend service with admin credentials that handles the complete deletion flow.

#### Option 3: Manual Cleanup
For smaller deployments, auth users can be manually deleted from the Supabase dashboard or via admin scripts.

## Database Triggers

The system includes a trigger that automatically cleans up profile data when auth users are deleted externally:

- `handle_auth_user_delete()` function cleans up profiles, addresses, orders, and sellers when auth users are deleted
- This ensures bidirectional consistency

## Testing the Implementation

1. Create a test user account through the normal signup flow
2. Verify the user appears in the admin user management interface
3. Delete the user through the admin interface
4. Verify the profile and related data are removed
5. Attempt to create a new account with the same email - this should work after implementing auth user deletion

## Security Notes

- Only authenticated administrators can delete user profiles
- Admins cannot delete their own accounts
- All related user data is properly cleaned up
- The system prevents orphaned authentication records through triggers