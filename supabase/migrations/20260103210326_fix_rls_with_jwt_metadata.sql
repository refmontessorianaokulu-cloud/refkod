/*
  # JWT Metadata ile RLS Düzeltmesi
  
  ## Problem
  RLS politikaları role öğrenmek için profiles'ı sorgularken sonsuz döngü oluşuyordu
  
  ## Çözüm
  1. Kullanıcının role ve approval bilgisini auth.users'ın app_metadata'sına kaydet
  2. RLS politikalarında auth.jwt() ile metadata'dan oku (profiles'a sorgu yapmadan)
  
  ## Roller ve Yetkiler
  - Admin: Tüm profilleri görür
  - Teacher: Admin, teacher, guidance_counselor, staff ve kendi velilerini görür
  - Guidance Counselor: Admin, teacher, staff ve tüm velileri görür
  - Staff: Admin, teacher, guidance_counselor ve diğer staff'ları görür
  - Parent: Admin, teacher, guidance_counselor görür (diğer velileri görmez)
*/

-- Drop ALL existing policies
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

-- Create function to sync role to JWT metadata
CREATE OR REPLACE FUNCTION sync_role_to_jwt_metadata()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update auth.users app_metadata with role and approval status
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'approved', COALESCE(NEW.approved, false)
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync on insert/update
DROP TRIGGER IF EXISTS sync_role_to_jwt_trigger ON profiles;
CREATE TRIGGER sync_role_to_jwt_trigger
  AFTER INSERT OR UPDATE OF role, approved ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_jwt_metadata();

-- Sync existing data to JWT metadata
UPDATE auth.users au
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'role', p.role,
    'approved', COALESCE(p.approved, false)
  )
FROM profiles p
WHERE au.id = p.id;

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
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Policy 3: Teachers can view admin, teacher, guidance_counselor, staff, and their own parents
CREATE POLICY "Teachers can view allowed roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher'
    AND (
      role IN ('admin', 'teacher', 'guidance_counselor', 'staff')
      OR (
        role = 'parent'
        AND id IN (
          SELECT pc.parent_id
          FROM parent_children pc
          INNER JOIN teacher_children tc ON tc.child_id = pc.child_id
          WHERE tc.teacher_id = auth.uid()
        )
      )
    )
  );

-- Policy 4: Guidance counselors can view admin, teacher, staff, and all parents
CREATE POLICY "Counselors can view allowed roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'guidance_counselor'
    AND role IN ('admin', 'teacher', 'staff', 'parent', 'guidance_counselor')
  );

-- Policy 5: Staff can view admin, teacher, guidance_counselor, and other staff
CREATE POLICY "Staff can view allowed roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND role IN ('admin', 'teacher', 'guidance_counselor', 'staff')
  );

-- Policy 6: Parents can view admin, teacher, and guidance_counselor (NOT other parents)
CREATE POLICY "Parents can view allowed roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND role IN ('admin', 'teacher', 'guidance_counselor')
  );

-- Update policy (everyone can update their own profile)
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Insert policy (users can create their own profile)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
