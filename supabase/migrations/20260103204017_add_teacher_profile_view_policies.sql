/*
  # Add Teacher Profile Viewing Policies
  
  ## Problem
  Teachers cannot view other teachers, guidance counselors, or staff members.
  They can only view their own students' parents.
  
  ## Solution
  Add RLS policies that allow teachers to view:
  - Other teachers
  - Guidance counselors
  - Staff members (all types)
  - Admins
  - Their students' parents (already exists)
  
  ## Changes
  1. Add policy for teachers to view other approved teachers
  2. Add policy for teachers to view approved guidance counselors
  3. Add policy for teachers to view approved staff members
  
  ## Security
  - Only approved users can be seen
  - Teachers can only view, not modify other profiles
  - Teachers maintain full access to their own profile via existing policies
*/

-- Teachers can view other teachers
CREATE POLICY "Teachers can view other teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND teacher.approved = true
    )
    AND role = 'teacher'
    AND approved = true
  );

-- Teachers can view guidance counselors
CREATE POLICY "Teachers can view guidance counselors"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND teacher.approved = true
    )
    AND role = 'guidance_counselor'
    AND approved = true
  );

-- Teachers can view staff members
CREATE POLICY "Teachers can view staff"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND teacher.approved = true
    )
    AND role = 'staff'
    AND approved = true
  );

-- Teachers can view admins
CREATE POLICY "Teachers can view admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND teacher.approved = true
    )
    AND role = 'admin'
    AND approved = true
  );

-- Teachers can view parents of their students
CREATE POLICY "Teachers can view their students' parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND teacher.approved = true
    )
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
