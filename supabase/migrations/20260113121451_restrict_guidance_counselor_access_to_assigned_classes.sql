/*
  # Restrict Guidance Counselor Access to Assigned Classes Only
  
  1. Changes
    - Remove old "Guidance counselors can view all children" policy from children table
    - Remove old "Guidance counselors can view all reports" policy from periodic_development_reports table
    - Add new restricted policies based on teacher_branch_assignments with course_type='guidance'
    
  2. New Policies
    - Guidance counselors can only view children in their assigned classes
    - Guidance counselors can only view and edit reports for students in their assigned classes
    - Guidance counselors can only insert reports for students in their assigned classes
    
  3. Security
    - Uses teacher_branch_assignments table to determine class access
    - course_type='guidance' identifies guidance counselor assignments
    - Children's class_name must match assigned class_name
*/

-- DROP old permissive policies for guidance counselors on children table
DROP POLICY IF EXISTS "Guidance counselors can view all children" ON children;

-- DROP old permissive policies for guidance counselors on periodic_development_reports table
DROP POLICY IF EXISTS "Guidance counselors can view all reports" ON periodic_development_reports;

-- ADD new restricted policy: Guidance counselors can only view children in their assigned classes
CREATE POLICY "Guidance counselors can view children in assigned classes"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
    AND EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      WHERE tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
      AND tba.class_name = children.class_name
    )
  );

-- ADD new restricted policy: Guidance counselors can view reports for students in assigned classes
CREATE POLICY "Guidance counselors can view reports in assigned classes"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'guidance_counselor'
    AND EXISTS (
      SELECT 1 FROM children c
      INNER JOIN teacher_branch_assignments tba 
        ON tba.class_name = c.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
    )
  );

-- ADD new restricted policy: Guidance counselors can insert reports for students in assigned classes
CREATE POLICY "Guidance counselors can insert reports in assigned classes"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'guidance_counselor'
    AND EXISTS (
      SELECT 1 FROM children c
      INNER JOIN teacher_branch_assignments tba 
        ON tba.class_name = c.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
    )
  );

-- ADD new restricted policy: Guidance counselors can update guidance_evaluation for students in assigned classes
CREATE POLICY "Guidance counselors can update guidance evaluation in assigned classes"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'guidance_counselor'
    AND EXISTS (
      SELECT 1 FROM children c
      INNER JOIN teacher_branch_assignments tba 
        ON tba.class_name = c.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
    )
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'guidance_counselor'
    AND EXISTS (
      SELECT 1 FROM children c
      INNER JOIN teacher_branch_assignments tba 
        ON tba.class_name = c.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
      AND tba.course_type = 'guidance'
    )
  );
