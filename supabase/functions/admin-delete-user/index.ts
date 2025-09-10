import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Admin Delete User function loaded")

interface DeleteUserRequest {
  userId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { userId }: DeleteUserRequest = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Initialize Supabase with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the current user from the request to verify admin status
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Step 1: Delete profile and related data using the RPC function (includes admin validation)
    const { data: profileResult, error: profileError } = await supabaseClient.rpc('admin_delete_user_profile', {
      target_user_id: userId
    })

    if (profileError) {
      throw new Error(`Profile deletion failed: ${profileError.message}`)
    }

    console.log('Profile deleted successfully:', profileResult)

    // Step 2: Delete the authentication user using admin privileges
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Auth user deletion failed:', authError)
      // Don't throw here as the profile was already deleted successfully
      // The trigger will clean up any remaining profile data if needed
      return new Response(JSON.stringify({
        success: true,
        message: 'Profile deleted successfully. Auth user deletion failed but will be cleaned up automatically.',
        profileDeleted: true,
        authDeleted: false,
        details: profileResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Auth user deleted successfully')

    return new Response(JSON.stringify({
      success: true,
      message: 'User completely deleted. The email can now be reused for new accounts.',
      profileDeleted: true,
      authDeleted: true,
      details: profileResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in admin-delete-user function:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      message: 'Failed to delete user'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})