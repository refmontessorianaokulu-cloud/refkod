/*
  # Nuclear Fix for Profiles RLS - Complete Reset
  
  ## Problem
  Security definer functions still cause infinite recursion
  
  ## Solution
  Remove ALL policies. Create only one: users see their own profile.
*/

-- Drop ALL policies on profiles
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS get_my_role();
DROP FUNCTION IF EXISTS am_i_approved();

-- Create ONE simple policy: users can only view their own profile
CREATE POLICY "Users can view own profile only"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create update policy
CREATE POLICY "Users can update own profile only"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create insert policy for new users
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
