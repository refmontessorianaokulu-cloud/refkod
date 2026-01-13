/*
  # Fix RLS Infinite Recursion with SECURITY DEFINER Function

  ## Problem
  RLS policies that query the profiles table cause infinite recursion because:
  - Policy on table A queries profiles to check role
  - Profiles table has RLS enabled
  - PostgreSQL creates circular dependency during policy evaluation
  
  ## Solution
  Create a SECURITY DEFINER function that bypasses RLS when checking user roles.
  This function runs with elevated privileges and directly accesses profiles.

  ## Changes
  1. Create `get_user_role()` function with SECURITY DEFINER
  2. Create `is_admin()` helper function for cleaner policies
  3. Fix all admin policies on:
     - periodic_development_reports
     - academic_periods
     - children
  4. Remove all policies that use subqueries to profiles table

  ## Security
  - SECURITY DEFINER functions are carefully restricted
  - Functions only return minimal information (role)
  - Set search_path to prevent SQL injection
  - STABLE keyword for performance optimization
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin view periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins can view all periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Counselor view assigned reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Guidance counselors view assigned class reports" ON periodic_development_reports;

DROP POLICY IF EXISTS "Admins can manage academic periods" ON academic_periods;
DROP POLICY IF EXISTS "Admin can manage academic periods" ON academic_periods;

DROP POLICY IF EXISTS "Admins can view all children" ON children;
DROP POLICY IF EXISTS "Admin can view all children" ON children;

-- Create helper function to get user role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND approved = true
  );
$$;

-- Create helper function for guidance counselor check
CREATE OR REPLACE FUNCTION public.is_guidance_counselor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'guidance_counselor'
  );
$$;

-- ============================================================================
-- Fix periodic_development_reports policies
-- ============================================================================

-- Admin can view all periodic reports
CREATE POLICY "Admin view all periodic reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can insert periodic reports
CREATE POLICY "Admin insert periodic reports"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admin can update periodic reports
CREATE POLICY "Admin update periodic reports"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin can delete periodic reports
CREATE POLICY "Admin delete periodic reports"
  ON periodic_development_reports FOR DELETE
  TO authenticated
  USING (is_admin());

-- Guidance counselor can view assigned class reports
CREATE POLICY "Counselor view assigned class reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    is_guidance_counselor()
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = periodic_development_reports.child_id
    )
  );

-- Guidance counselor can insert reports for assigned classes
CREATE POLICY "Counselor insert assigned class reports"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    is_guidance_counselor()
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = child_id
    )
  );

-- Guidance counselor can update reports for assigned classes
CREATE POLICY "Counselor update assigned class reports"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (
    is_guidance_counselor()
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = periodic_development_reports.child_id
    )
  )
  WITH CHECK (
    is_guidance_counselor()
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = child_id
    )
  );

-- ============================================================================
-- Fix academic_periods policies
-- ============================================================================

-- Admin can manage academic periods
CREATE POLICY "Admin manage academic periods"
  ON academic_periods FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- Fix children table policies
-- ============================================================================

-- Admin can view all children
CREATE POLICY "Admin view all children"
  ON children FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can insert children
CREATE POLICY "Admin insert children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admin can update children
CREATE POLICY "Admin update children"
  ON children FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin can delete children
CREATE POLICY "Admin delete children"
  ON children FOR DELETE
  TO authenticated
  USING (is_admin());

-- Grant execute permission on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_guidance_counselor() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_role() IS 'Returns the role of the current user. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user is an approved admin. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION public.is_guidance_counselor() IS 'Returns true if current user is a guidance counselor. Uses SECURITY DEFINER to bypass RLS.';
