/*
  # RLS Sonsuz Döngü Çözümü - SECURITY DEFINER Function ile
  
  ## Problem
  RLS politikaları profiles tablosunu sorgularken sonsuz döngüye giriyordu
  
  ## Çözüm
  SECURITY DEFINER fonksiyon oluştur - bu fonksiyon RLS'yi bypass eder
  Fonksiyon hedef kullanıcının rolünü döndürür
  Politikalarda bu fonksiyonu kullan
  
  ## Güvenlik
  Fonksiyon sadece role döndürür, veri sızdırmaz
  Her kullanıcı hala sadece yetkili olduğu profilleri görebilir
*/

-- RLS'yi bypass eden güvenli fonksiyon
CREATE OR REPLACE FUNCTION get_profile_role(profile_id uuid)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = profile_id;
  
  RETURN user_role;
END;
$$;

-- Tüm politikaları temizle
DROP POLICY IF EXISTS "view_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_view_all" ON profiles;
DROP POLICY IF EXISTS "teacher_view_staff_roles" ON profiles;
DROP POLICY IF EXISTS "teacher_view_own_parents" ON profiles;
DROP POLICY IF EXISTS "counselor_view_allowed" ON profiles;
DROP POLICY IF EXISTS "staff_view_allowed" ON profiles;
DROP POLICY IF EXISTS "parent_view_allowed" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

-- 1. Herkes kendi profilini görebilir
CREATE POLICY "view_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. Admin tüm profilleri görebilir
CREATE POLICY "admin_view_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 3. Teacher: admin, teacher, guidance_counselor, staff görebilir
CREATE POLICY "teacher_view_staff_roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher'
    AND get_profile_role(id) IN ('admin', 'teacher', 'guidance_counselor', 'staff')
  );

-- 4. Teacher: kendi velilerini görebilir
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

-- 5. Guidance Counselor: admin, teacher, staff, guidance_counselor, parent görebilir
CREATE POLICY "counselor_view_all_roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'guidance_counselor'
    AND get_profile_role(id) IN ('admin', 'teacher', 'staff', 'parent', 'guidance_counselor')
  );

-- 6. Staff: admin, teacher, guidance_counselor, staff görebilir
CREATE POLICY "staff_view_allowed_roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND get_profile_role(id) IN ('admin', 'teacher', 'guidance_counselor', 'staff')
  );

-- 7. Parent: admin, teacher, guidance_counselor görebilir
CREATE POLICY "parent_view_allowed_roles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND get_profile_role(id) IN ('admin', 'teacher', 'guidance_counselor')
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
