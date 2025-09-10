# Production Deployment Guide

## Complete User Deletion with Edge Functions

This guide shows how to deploy the complete user deletion functionality including authentication user removal.

## Prerequisites

- Supabase CLI installed
- Access to your Supabase project
- Service role key configured

## Deployment Steps

### 1. Deploy the Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy admin-delete-user
```

### 2. Set Environment Variables

In your Supabase dashboard, go to Settings → Edge Functions → Environment Variables:

- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
- `SUPABASE_ANON_KEY`: Your anon public key

### 3. Update Frontend Code

Modify the `AdminUserManagement.tsx` component to use the Edge Function:

```typescript
const deleteUserMutation = useMutation({
  mutationFn: async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ userId })
    })

    const result = await response.json()
    if (!result.success) throw new Error(result.error)
    return result
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    toast({
      title: "Success",
      description: data.message || "User completely deleted. Email can be reused.",
    })
  },
  onError: (err: Error) => {
    console.error(err)
    toast({
      title: "Error",
      description: err.message || "Failed to delete user.",
      variant: "destructive",
    })
  },
})
```

### 4. Test the Complete Flow

1. Create a test user account
2. Delete the user through admin interface
3. Verify both profile and auth user are deleted
4. Try creating a new account with the same email - should succeed

## Environment Configuration

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Update your `src/integrations/supabase/client.ts` to use these:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Security Considerations

- The Edge Function validates admin permissions before deletion
- Service role key is only used server-side
- CORS is properly configured for your domain
- All deletions are logged for audit purposes

## Monitoring

Monitor function logs in Supabase dashboard:
1. Go to Edge Functions
2. Select `admin-delete-user`
3. View logs and metrics

## Rollback Plan

If issues occur:
1. Revert frontend changes to use RPC-only deletion
2. Manually clean up auth users via Supabase dashboard
3. Redeploy previous version of Edge Function

## Cost Considerations

Edge Function invocations are billed per execution. For high-volume user deletions, consider batch operations or background processing.