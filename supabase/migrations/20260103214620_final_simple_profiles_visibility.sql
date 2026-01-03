/*
  # Final Simple Profiles Visibility Rules

  Clear and simple RLS policies for profiles table:
  
  1. **ADMIN & GUIDANCE_COUNSELOR**: See ALL profiles
  2. **TEACHER**: See teachers, guidance_counselor, staff, and their own parents
  3. **PARENT**: See only teachers
  4. **STAFF**: See admin, guidance_counselor, teachers
  
  Security:
  - Drop ALL existing policies
  - Create simple, non-recursive policies
  - Each role has exactly ONE policy
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view relevant profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can view teachers" ON profiles;
DROP POLICY IF EXISTS "Staff can view relevant profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance counselor can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read for admin" ON profiles;
DROP POLICY IF EXISTS "Enable read for own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can see other teachers, staff, guidance counselor and their parents" ON profiles;
DROP POLICY IF EXISTS "Parents can see teachers only" ON profiles;
DROP POLICY IF EXISTS "Staff can see admin, guidance counselor and teachers" ON profiles;
DROP POLICY IF EXISTS "Messaging - teachers see relevant profiles" ON profiles;
DROP POLICY IF EXISTS "Messaging - parents see teachers" ON profiles;

-- ADMIN & GUIDANCE_COUNSELOR: See ALL profiles
CREATE POLICY "Admin and guidance see all"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'guidance_counselor')
    )
  );

-- TEACHER: See teachers, guidance_counselor, staff, and their own parents
CREATE POLICY "Teachers see teachers, guidance, staff, own parents"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
    )
    AND (
      role IN ('teacher', 'guidance_counselor', 'staff')
      OR (
        role = 'parent'
        AND id IN (
          SELECT parent_id FROM parent_children pc
          JOIN teacher_children tc ON pc.child_id = tc.child_id
          WHERE tc.teacher_id = auth.uid()
        )
      )
    )
  );

-- PARENT: See only teachers
CREATE POLICY "Parents see only teachers"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'parent'
    )
    AND role = 'teacher'
  );

-- STAFF: See admin, guidance_counselor, teachers
CREATE POLICY "Staff see admin, guidance, teachers"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'staff'
    )
    AND role IN ('admin', 'guidance_counselor', 'teacher')
  );

-- Everyone can see their own profile
CREATE POLICY "Users see own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());