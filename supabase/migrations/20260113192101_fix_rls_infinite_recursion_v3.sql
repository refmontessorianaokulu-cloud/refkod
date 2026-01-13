/*
  # Fix RLS Infinite Recursion - Version 3

  1. Problem
    - RLS policies query profiles table causing circular dependency
    - Results in infinite recursion errors

  2. Solution
    - Use IN with LIMIT 1 to break recursion
    - Fix all column references (use class_name consistently)

  3. Tables Fixed
    - periodic_development_reports
    - academic_periods
    - children
*/

-- ============================================================================
-- PERIODIC DEVELOPMENT REPORTS
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins can view all periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admin read periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins view all periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Teachers can view reports for their students" ON periodic_development_reports;
DROP POLICY IF EXISTS "Teacher read own student reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Teachers view student reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Parents can view their children's reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Parent read own children reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Parents view children reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Guidance counselors can view all reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Guidance counselor read assigned class reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Counselors view assigned reports" ON periodic_development_reports;

-- Admins
CREATE POLICY "Admin view periodic reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'admin'
      AND approved = true
      LIMIT 1
    )
  );

-- Teachers
CREATE POLICY "Teacher view student reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.teacher_id = auth.uid()
      AND tc.child_id = periodic_development_reports.child_id
    )
    OR EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = periodic_development_reports.child_id
    )
  );

-- Parents
CREATE POLICY "Parent view children reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children pc
      WHERE pc.parent_id = auth.uid()
      AND pc.child_id = periodic_development_reports.child_id
    )
  );

-- Guidance counselors
CREATE POLICY "Counselor view assigned reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = periodic_development_reports.child_id
    )
  );

-- ============================================================================
-- ACADEMIC PERIODS
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage academic periods" ON academic_periods;
DROP POLICY IF EXISTS "Admin manage academic periods" ON academic_periods;
DROP POLICY IF EXISTS "Admins manage periods" ON academic_periods;

CREATE POLICY "Admin manage periods"
  ON academic_periods FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'admin'
      AND approved = true
      LIMIT 1
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'admin'
      AND approved = true
      LIMIT 1
    )
  );

-- ============================================================================
-- CHILDREN TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all children" ON children;
DROP POLICY IF EXISTS "Admin view all children" ON children;
DROP POLICY IF EXISTS "Admins view children" ON children;
DROP POLICY IF EXISTS "Admins can manage children" ON children;
DROP POLICY IF EXISTS "Admin manage all children" ON children;
DROP POLICY IF EXISTS "Admins manage children" ON children;

CREATE POLICY "Admin view children"
  ON children FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'admin'
      AND approved = true
      LIMIT 1
    )
  );

CREATE POLICY "Admin manage children"
  ON children FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'admin'
      AND approved = true
      LIMIT 1
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'admin'
      AND approved = true
      LIMIT 1
    )
  );

-- ============================================================================
-- PERFORMANCE INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role_approved
  ON profiles(role, approved)
  WHERE approved = true;
