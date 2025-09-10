-- Migration for cascading user deletion
-- This migration adds functionality to delete user profiles with proper admin checks
-- Auth user deletion should be handled separately via admin API or Edge Functions

-- Create a function to safely delete a user profile with admin validation
CREATE OR REPLACE FUNCTION public.admin_delete_user_profile(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  calling_user_id uuid;
  is_admin boolean := false;
  user_exists boolean := false;
  user_email text;
  result json;
BEGIN
  -- Get the current user
  calling_user_id := auth.uid();
  
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if the calling user is an admin
  SELECT profiles.is_admin INTO is_admin 
  FROM public.profiles 
  WHERE user_id = calling_user_id;
  
  -- Only allow admins to delete users
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;
  
  -- Prevent admins from deleting themselves
  IF calling_user_id = target_user_id THEN
    RAISE EXCEPTION 'Administrators cannot delete their own account';
  END IF;
  
  -- Check if the target user exists and get their email
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE user_id = target_user_id
  ), email INTO user_exists, user_email
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % not found', target_user_id;
  END IF;
  
  -- Delete related data first (orders, addresses, etc.)
  DELETE FROM public.addresses WHERE user_id = target_user_id;
  DELETE FROM public.orders WHERE user_id = target_user_id;
  DELETE FROM public.sellers WHERE user_id = target_user_id;
  
  -- Delete the profile
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Return success info
  result := json_build_object(
    'success', true,
    'deleted_user_id', target_user_id,
    'user_email', user_email,
    'message', 'Profile deleted successfully. Auth user deletion requires separate admin action.'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error info
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to delete user profile'
    );
    RAISE EXCEPTION '%', result->>'message';
END;
$$;

-- Create a trigger function to clean up profiles when auth users are deleted
-- This ensures bidirectional consistency
CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete the corresponding profile when an auth user is deleted
  DELETE FROM public.profiles WHERE user_id = OLD.id;
  -- Also clean up related data
  DELETE FROM public.addresses WHERE user_id = OLD.id;
  DELETE FROM public.orders WHERE user_id = OLD.id;
  DELETE FROM public.sellers WHERE user_id = OLD.id;
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the auth deletion if profile cleanup fails
    -- Just log the error
    RAISE WARNING 'Failed to clean up profile for deleted user %: %', OLD.id, SQLERRM;
    RETURN OLD;
END;
$$;

-- Create trigger on auth.users for cleanup
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_delete();

-- Grant necessary permissions
REVOKE ALL ON FUNCTION public.admin_delete_user_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user_profile(uuid) TO authenticated;