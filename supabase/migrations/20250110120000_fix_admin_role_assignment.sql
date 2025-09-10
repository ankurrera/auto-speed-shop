-- Fix the handle_new_user function to properly handle admin role assignment
-- This migration ensures that when profiles are updated with is_admin=true, the role is also set to 'admin'

-- Update the handle_new_user function to not override role if it's set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  insert into public.profiles (
    user_id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    role
  ) values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'user'  -- Default role, can be updated later via profile updates
  ) on conflict (user_id) do update set 
    email = excluded.email,
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    phone = coalesce(excluded.phone, public.profiles.phone);
    -- Note: We don't update role here to allow explicit role updates
  return new;
end;
$$;

-- Create a trigger function to sync role with is_admin field
CREATE OR REPLACE FUNCTION public.sync_role_with_is_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  -- Automatically set role based on is_admin field
  IF NEW.is_admin = true THEN
    NEW.role = 'admin';
  ELSIF NEW.is_admin = false THEN
    NEW.role = 'user';
  END IF;
  
  return NEW;
end;
$$;

-- Create trigger to sync role with is_admin on profile updates
DROP TRIGGER IF EXISTS sync_role_on_profile_update ON public.profiles;
CREATE TRIGGER sync_role_on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
  EXECUTE FUNCTION public.sync_role_with_is_admin();

-- Also sync role on insert if is_admin is set
DROP TRIGGER IF EXISTS sync_role_on_profile_insert ON public.profiles;
CREATE TRIGGER sync_role_on_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW 
  WHEN (NEW.is_admin IS NOT NULL)
  EXECUTE FUNCTION public.sync_role_with_is_admin();

-- Update existing profiles to sync role with is_admin
UPDATE public.profiles 
SET role = CASE 
  WHEN is_admin = true THEN 'admin'
  WHEN is_admin = false THEN 'user'
  ELSE role
END
WHERE role IS DISTINCT FROM (
  CASE 
    WHEN is_admin = true THEN 'admin'
    WHEN is_admin = false THEN 'user'
    ELSE role
  END
);