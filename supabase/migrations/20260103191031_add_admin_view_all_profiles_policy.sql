/*
  # Add Admin View All Profiles Policy
  
  ## Problem
  After enabling RLS on profiles table, users can only see their own profiles.
  Admins need to view all profiles to manage users.
  
  ## Changes
  Add policies to allow admins to:
  - View all profiles
  - Update any profile (for approval)
  - Delete profiles if needed
  
  ## Security
  These policies ensure only approved admins can manage all profiles.
*/

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Admin can update any profile (for approvals, role changes, etc.)
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Admin can delete profiles if needed
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );
