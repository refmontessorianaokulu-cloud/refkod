/*
  # Fix All Profile RLS Policies - Complete Rebuild
  
  ## Problem
  Multiple overlapping and conflicting policies causing "profile not found" errors.
  
  ## Solution
  Drop all SELECT policies and create clear, role-based policies:
  
  1. **Admin**: Can view ALL profiles
  2. **Teacher**: Can view:
     - Themselves
     - All other teachers
     - All guidance counselors
     - All staff members
     - All admins
     - Parents of their students
  3. **Parent**: Can view:
     - Themselves
     - All admins
     - All teachers
     - All guidance counselors
     - Teachers of their children
  4. **Staff & Guidance Counselor**: Can view:
     - Themselves
     - All admins
     - All teachers
  
  ## Security
  - All users can view their own profile
  - Only approved users are visible to others
  - Clear role-based access control
*/

-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view other teachers" ON profiles;
DROP POLICY IF EXISTS "Teachers can view guidance counselors" ON profiles;
DROP POLICY IF EXISTS "Teachers can view staff" ON profiles;
DROP POLICY IF EXISTS "Teachers can view admins" ON profiles;
DROP POLICY IF EXISTS "Teachers can view their students' parents" ON profiles;

-- Policy 1: Everyone can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Admins can view ALL profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'admin'
      AND admin.approved = true
    )
  );

-- Policy 3: Teachers can view other teachers, guidance counselors, staff, and admins
CREATE POLICY "Teachers can view teachers, counselors, staff, and admins"
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
    AND approved = true
    AND role IN ('teacher', 'guidance_counselor', 'staff', 'admin')
  );

-- Policy 4: Teachers can view parents of their students
CREATE POLICY "Teachers can view their students parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'parent'
    AND approved = true
    AND EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND teacher.approved = true
    )
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
    EXISTS (
      SELECT 1 FROM profiles parent
      WHERE parent.id = auth.uid()
      AND parent.role = 'parent'
      AND parent.approved = true
    )
    AND approved = true
    AND role IN ('admin', 'teacher', 'guidance_counselor')
  );

-- Policy 6: Staff and guidance counselors can view admins and teachers
CREATE POLICY "Staff and counselors can view admins and teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles user_profile
      WHERE user_profile.id = auth.uid()
      AND user_profile.role IN ('staff', 'guidance_counselor')
      AND user_profile.approved = true
    )
    AND approved = true
    AND role IN ('admin', 'teacher')
  );
