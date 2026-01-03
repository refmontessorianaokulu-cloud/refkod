/*
  # Fix Profiles RLS Infinite Recursion
  
  ## Problem
  The admin policies are causing infinite recursion because they query the profiles 
  table while checking permissions on the profiles table itself.
  
  ## Solution
  - Drop the problematic admin policies that cause recursion
  - Keep simple "users can view own profile" policy
  - Admins can still view their own profile through this policy
  - For admin operations viewing other profiles, we'll use service role or different approach
  
  ## Changes
  1. Drop recursive admin policies
  2. Keep basic user policies that work without recursion
*/

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- The basic "Users can view own profile" and "Users can update own profile" 
-- policies remain and work fine without recursion
