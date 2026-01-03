/*
  # Fix Infinite Recursion in Profiles RLS
  
  ## Problem
  Policies checking profiles table to verify role cause infinite recursion
  
  ## Solution
  Simplify policies to avoid self-referencing queries
  Use direct auth.uid() checks and avoid nested EXISTS queries on profiles
  
  ## Changes
  1. Drop all SELECT policies
  2. Create simple, non-recursive policies
  3. Use security definer functions where needed to break recursion
*/

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view teachers, counselors, staff, and admins" ON profiles;
DROP POLICY IF EXISTS "Teachers can view their students parents" ON profiles;
DROP POLICY IF EXISTS "Parents can view admins, teachers, and counselors" ON profiles;
DROP POLICY IF EXISTS "Staff and counselors can view admins and teachers" ON profiles;

-- Create a security definer function to get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Create a security definer function to check if user is approved
CREATE OR REPLACE FUNCTION am_i_approved()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(approved, false) FROM profiles WHERE id = auth.uid();
$$;

-- Policy 1: Everyone can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Admins can view all profiles (using function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin' AND am_i_approved() = true);

-- Policy 3: Teachers can view specific roles
CREATE POLICY "Teachers can view teachers, counselors, staff, and admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'teacher'
    AND am_i_approved() = true
    AND approved = true
    AND role IN ('teacher', 'guidance_counselor', 'staff', 'admin')
  );

-- Policy 4: Teachers can view parents of their students
CREATE POLICY "Teachers can view their students parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'teacher'
    AND am_i_approved() = true
    AND role = 'parent'
    AND approved = true
    AND EXISTS (
      SELECT 1
      FROM teacher_children tc
      JOIN parent_children pc ON tc.child_id = pc.child_id
      WHERE tc.teacher_id = auth.uid()
      AND pc.parent_id = profiles.id
    )
  );

-- Policy 5: Parents can view admins, teachers, and guidance counselors
CREATE POLICY "Parents can view admins, teachers, and counselors"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'parent'
    AND am_i_approved() = true
    AND approved = true
    AND role IN ('admin', 'teacher', 'guidance_counselor')
  );

-- Policy 6: Staff and guidance counselors can view admins and teachers
CREATE POLICY "Staff and counselors can view admins and teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    get_my_role() IN ('staff', 'guidance_counselor')
    AND am_i_approved() = true
    AND approved = true
    AND role IN ('admin', 'teacher')
  );
