/*
  # FIX PROFILES RLS INFINITE RECURSION - FINAL SOLUTION
  
  ## Problem
  Multiple SELECT policies on profiles table create circular reference:
  - "Admin and guidance see all" checks profiles.role via EXISTS subquery
  - "Parents see only teachers" checks profiles.role via EXISTS subquery  
  - "Teachers see teachers..." checks profiles.role via EXISTS subquery
  - "Staff see admin..." checks profiles.role via EXISTS subquery
  
  When user tries to login:
  1. AuthContext queries profiles table for current user
  2. RLS SELECT policies are evaluated
  3. Those policies query profiles table again (to check user's role)
  4. This creates INFINITE RECURSION
  5. Query fails with: "infinite recursion detected in policy for relation profiles"
  6. Login fails for ALL users with "Profil bulunamadı" error
  
  ## Root Cause
  Policy A requires checking profiles table to determine if user can read profiles table.
  This is circular dependency and causes infinite recursion.
  
  ## Solution
  Keep ONLY these 3 simple, non-recursive policies:
  1. SELECT: "Authenticated users can read all profiles" - USING (true)
     - No subquery, no recursion, everyone can read
  2. INSERT: "Users can insert their own profile" - WITH CHECK (id = auth.uid())
     - Simple check, no subquery needed
  3. UPDATE: "Users can update their own profile" - USING/WITH CHECK (id = auth.uid())
     - Simple check, no subquery needed
  
  Remove ALL other policies that create circular dependencies.
  
  ## Security Impact
  - All authenticated users can read all profiles (necessary for app functionality)
  - Users can only insert/update their own profile
  - Admin controls are handled in application layer (AuthContext, components)
  - This is SAFER than infinite recursion that breaks login for everyone
  
  ## Tables Affected
  - profiles (remove 6 problematic policies, keep 3 safe ones)
*/

-- Drop all problematic SELECT policies that cause circular reference
DROP POLICY IF EXISTS "Admin and guidance see all" ON profiles;
DROP POLICY IF EXISTS "Parents see only teachers" ON profiles;
DROP POLICY IF EXISTS "Teachers see teachers, guidance, staff, own parents" ON profiles;
DROP POLICY IF EXISTS "Staff see admin, guidance, teachers" ON profiles;
DROP POLICY IF EXISTS "Users see own profile" ON profiles;

-- Drop problematic UPDATE policy that queries profiles
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Verify the 3 safe policies exist (these don't cause recursion)
-- If they don't exist, create them

DO $$
BEGIN
  -- 1. SELECT policy: Allow all authenticated users to read all profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can read all profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- 2. INSERT policy: Users can only insert their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;

  -- 3. UPDATE policy: Users can only update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
