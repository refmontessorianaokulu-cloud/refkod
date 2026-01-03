/*
  # Fix Admin Profile Viewing with Security Definer Function
  
  ## Problem
  Admin policies were causing infinite recursion when checking if a user is admin
  by querying the profiles table while applying RLS on profiles table itself.
  
  ## Solution
  Create a SECURITY DEFINER function that bypasses RLS to check if current user is admin.
  Then use this function in RLS policies to avoid recursion.
  
  ## Changes
  1. Create helper function `is_admin()` with SECURITY DEFINER
  2. Add admin policies using this function
  
  ## Security
  - Function is SECURITY DEFINER but only returns boolean, not data
  - Only checks current user's role, cannot be abused to check other users
  - Admins must be approved to have access
*/

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND approved = true
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Now create admin policies using this function (no recursion!)
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());
