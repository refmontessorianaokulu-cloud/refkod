/*
  # PERMISSIVE RLS Politikaları ile Sonsuz Döngü Çözümü
  
  ## Problem
  Politikalar profiles.role sütununu kontrol ederken sonsuz döngü oluşturuyordu
  
  ## Çözüm
  Tüm politikaları basit tutalım - sadece JWT'den kullanıcının kendi rolünü kontrol edelim
  Her rol için ayrı bir view politikası olsun, PostgreSQL bunları OR ile birleştirir
  
  ## Roller ve Yetkiler (Tekrar)
  - Admin: Tüm profilleri görür
  - Teacher: Admin, teacher, guidance_counselor, staff ve kendi velilerini görür
  - Guidance Counselor: Admin, teacher, staff ve tüm velileri görür
  - Staff: Admin, teacher, guidance_counselor ve diğer staff'ları görür
  - Parent: Admin, teacher, guidance_counselor görür
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Counselors can view allowed roles" ON profiles;
DROP POLICY IF EXISTS "Parents can view allowed roles" ON profiles;
DROP POLICY IF EXISTS "Staff can view allowed roles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view allowed roles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Herkes kendi profilini görebilir
CREATE POLICY "view_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin tüm profilleri görebilir
CREATE POLICY "admin_view_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Teacher: admin, teacher, guidance_counselor, staff profillerini görebilir
CREATE POLICY "teacher_view_staff_roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher'
    AND id IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'teacher', 'guidance_counselor', 'staff')
    )
  );

-- Teacher: kendi velilerini görebilir
CREATE POLICY "teacher_view_own_parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher'
    AND id IN (
      SELECT pc.parent_id
      FROM parent_children pc
      INNER JOIN teacher_children tc ON tc.child_id = pc.child_id
      WHERE tc.teacher_id = auth.uid()
    )
  );

-- Guidance Counselor: admin, teacher, staff, guidance_counselor, parent profillerini görebilir
CREATE POLICY "counselor_view_allowed"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'guidance_counselor'
    AND id IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'teacher', 'staff', 'parent', 'guidance_counselor')
    )
  );

-- Staff: admin, teacher, guidance_counselor, staff profillerini görebilir
CREATE POLICY "staff_view_allowed"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND id IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'teacher', 'guidance_counselor', 'staff')
    )
  );

-- Parent: admin, teacher, guidance_counselor profillerini görebilir
CREATE POLICY "parent_view_allowed"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND id IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'teacher', 'guidance_counselor')
    )
  );

-- Update ve Insert politikaları
CREATE POLICY "update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
