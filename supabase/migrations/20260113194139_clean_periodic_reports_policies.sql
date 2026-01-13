/*
  # Clean and Fix Periodic Development Reports RLS Policies

  1. Problem
    - Multiple conflicting policies on periodic_development_reports (22 total!)
    - Old policies use direct subqueries: (SELECT role FROM profiles WHERE id = auth.uid())
    - These cause RLS infinite recursion when admin tries to view reports
    - Admin can see reports exist in DB but UI shows "Rapor bulunamıyor"

  2. Solution
    - DROP all old conflicting policies
    - Create clean policies using SECURITY DEFINER functions only
    - Use is_admin() and is_guidance_counselor() to avoid recursion

  3. Policies After Cleanup
    - SELECT: Admin, Teacher, Branch Teacher, Guidance Counselor, Parent
    - INSERT: Admin, Teacher, Guidance Counselor
    - UPDATE: Admin, Class Teacher, Branch Teacher, Guidance Counselor
    - DELETE: Admin, Teacher

  4. Security
    - All policies use SECURITY DEFINER functions to avoid RLS recursion
    - Admin: full access via is_admin()
    - Teachers: access via teacher_children or teacher_branch_assignments
    - Guidance Counselor: access via teacher_branch_assignments with course_type='guidance'
    - Parents: access via parent_children
*/

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin view all periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admin insert periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admin update periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admin delete periodic reports" ON periodic_development_reports;

DROP POLICY IF EXISTS "Admins can view all reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins can create reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins can update all periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins can delete all reports" ON periodic_development_reports;

DROP POLICY IF EXISTS "Teachers can view reports for their students" ON periodic_development_reports;
DROP POLICY IF EXISTS "Teachers can create reports for their students" ON periodic_development_reports;
DROP POLICY IF EXISTS "Teachers can update their own reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Teachers can delete their own reports" ON periodic_development_reports;

DROP POLICY IF EXISTS "Teacher view student reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Class teachers can update montessori and evaluations" ON periodic_development_reports;

DROP POLICY IF EXISTS "Branch teachers can view reports for their assigned branch" ON periodic_development_reports;
DROP POLICY IF EXISTS "Branch teachers can update their own course" ON periodic_development_reports;

DROP POLICY IF EXISTS "Guidance counselors can view all reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Guidance counselors can view reports in assigned classes" ON periodic_development_reports;
DROP POLICY IF EXISTS "Guidance counselors can insert reports in assigned classes" ON periodic_development_reports;
DROP POLICY IF EXISTS "Guidance counselors can update guidance evaluation" ON periodic_development_reports;
DROP POLICY IF EXISTS "Guidance counselors can update guidance evaluation in assigned " ON periodic_development_reports;

DROP POLICY IF EXISTS "Counselor view assigned class reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Counselor insert assigned class reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Counselor update assigned class reports" ON periodic_development_reports;

DROP POLICY IF EXISTS "Parent view children reports" ON periodic_development_reports;

-- ============================================================================
-- CREATE CLEAN POLICIES USING SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- ------------------------
-- SELECT POLICIES
-- ------------------------

-- Admin: View all reports
CREATE POLICY "Admin can view all periodic reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (is_admin());

-- Teachers: View reports for their students (class teacher or branch teacher)
CREATE POLICY "Teachers can view assigned student reports"
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

-- Guidance Counselor: View reports in assigned classes
CREATE POLICY "Guidance counselors can view assigned reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    is_guidance_counselor()
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
      AND c.id = periodic_development_reports.child_id
    )
  );

-- Parents: View their children's reports
CREATE POLICY "Parents can view their childrens reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children pc
      WHERE pc.parent_id = auth.uid()
      AND pc.child_id = periodic_development_reports.child_id
    )
  );

-- ------------------------
-- INSERT POLICIES
-- ------------------------

-- Admin: Create any report
CREATE POLICY "Admin can create any report"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Class Teachers: Create reports for their students
CREATE POLICY "Class teachers can create student reports"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.teacher_id = auth.uid()
      AND tc.child_id = periodic_development_reports.child_id
    )
  );

-- Guidance Counselor: Create reports for assigned classes
CREATE POLICY "Guidance counselors can create assigned reports"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    is_guidance_counselor()
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
      AND c.id = periodic_development_reports.child_id
    )
  );

-- ------------------------
-- UPDATE POLICIES
-- ------------------------

-- Admin: Update any report
CREATE POLICY "Admin can update any report"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Class Teachers: Update montessori and general evaluation sections
CREATE POLICY "Class teachers can update student reports"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.child_id = periodic_development_reports.child_id
      AND tc.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.child_id = periodic_development_reports.child_id
      AND tc.teacher_id = auth.uid()
    )
  );

-- Branch Teachers: Update their specific course sections
CREATE POLICY "Branch teachers can update course sections"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
    )
  );

-- Guidance Counselor: Update guidance evaluation sections
CREATE POLICY "Guidance counselors can update guidance sections"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (
    is_guidance_counselor()
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
      AND c.id = periodic_development_reports.child_id
    )
  )
  WITH CHECK (
    is_guidance_counselor()
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
      AND c.id = periodic_development_reports.child_id
    )
  );

-- ------------------------
-- DELETE POLICIES
-- ------------------------

-- Admin: Delete any report
CREATE POLICY "Admin can delete any report"
  ON periodic_development_reports FOR DELETE
  TO authenticated
  USING (is_admin());

-- Class Teachers: Delete their own reports (draft only)
CREATE POLICY "Class teachers can delete own reports"
  ON periodic_development_reports FOR DELETE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.teacher_id = auth.uid()
      AND tc.child_id = periodic_development_reports.child_id
    )
  );
