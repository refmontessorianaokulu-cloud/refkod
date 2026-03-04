/*
  # Create Automatic Profile Creation Trigger

  1. Purpose
    - Automatically create a profile in the `profiles` table when a new user signs up via OAuth (Google)
    - Fixes the issue where OAuth users don't get profiles created and get stuck on login screen
    
  2. Implementation
    - Creates a `handle_new_user()` function with SECURITY DEFINER to bypass RLS
    - Adds a trigger on `auth.users` table to call this function on INSERT
    - Extracts user metadata (full_name, email, avatar) from OAuth providers
    - Sets default role to 'atolye_user' for new OAuth users
    
  3. Security
    - Function runs with elevated privileges (SECURITY DEFINER) to insert into profiles table
    - Only creates profile if one doesn't already exist (prevents duplicates)
    - Uses authenticated user's ID from auth context
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_full_name text;
  user_email text;
  user_avatar text;
BEGIN
  -- Extract metadata from OAuth provider
  user_email := NEW.email;
  
  -- Get full_name from raw_user_meta_data (Google OAuth stores it here)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Get avatar URL if available
  user_avatar := NEW.raw_user_meta_data->>'avatar_url';
  
  -- Insert profile only if it doesn't exist
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    avatar_url,
    role,
    is_approved,
    created_at
  )
  VALUES (
    NEW.id,
    user_full_name,
    user_email,
    user_avatar,
    'atolye_user', -- Default role for OAuth users
    true, -- Auto-approve OAuth users
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;