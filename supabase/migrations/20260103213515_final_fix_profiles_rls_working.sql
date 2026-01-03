/*
  # PROFILES RLS - CIRCULAR REFERENCE OLMADAN
  
  ## Problem
  Önceki politikalar profiles tablosunu sorguluyordu (circular reference)
  
  ## Çözüm
  app_metadata kullan veya relationship tablolarını kullan ama profiles'ı ASLA sorgulama
  
  ## Kurallar
  1. Herkes kendi profilini görebilir
  2. Veli sadece çocuklarının öğretmenlerini görebilir
  3. Öğretmen sadece öğrencilerinin velilerini ve diğer öğretmenleri görebilir
  4. Rehber öğretmen, admin ve personel için özel kurallar
*/

-- TÜM POLİTİKALARI SİL
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "parent_view_teachers" ON profiles;
DROP POLICY IF EXISTS "parent_view_counselors" ON profiles;
DROP POLICY IF EXISTS "parent_view_admins" ON profiles;
DROP POLICY IF EXISTS "teacher_view_parents" ON profiles;
DROP POLICY IF EXISTS "teacher_view_teachers" ON profiles;
DROP POLICY IF EXISTS "teacher_view_counselors" ON profiles;
DROP POLICY IF EXISTS "teacher_view_admins" ON profiles;
DROP POLICY IF EXISTS "counselor_view_teachers" ON profiles;
DROP POLICY IF EXISTS "counselor_view_parents" ON profiles;
DROP POLICY IF EXISTS "counselor_view_admins" ON profiles;
DROP POLICY IF EXISTS "staff_view_admins" ON profiles;
DROP POLICY IF EXISTS "staff_view_staff" ON profiles;
DROP POLICY IF EXISTS "admin_view_all" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_update_all" ON profiles;
DROP POLICY IF EXISTS "admin_delete_all" ON profiles;

-- 1. HERKES KENDİ PROFİLİNİ GÖREBİLİR
CREATE POLICY "view_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. VELİLER: Çocuklarının öğretmenlerini görebilir
CREATE POLICY "parents_view_their_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Görülen profil bir öğretmen mi?
    profiles.role = 'teacher'
    -- Ve görüntüleyen kişi bu öğretmenin öğrencilerinin velisi mi?
    AND EXISTS (
      SELECT 1 
      FROM parent_children pc
      INNER JOIN teacher_children tc ON tc.child_id = pc.child_id
      WHERE pc.parent_id = auth.uid()
      AND tc.teacher_id = profiles.id
    )
  );

-- 3. ÖĞRETMENLER: Öğrencilerinin velilerini görebilir
CREATE POLICY "teachers_view_their_parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Görülen profil bir veli mi?
    profiles.role = 'parent'
    -- Ve görüntüleyen kişi bu velinin çocuklarının öğretmeni mi?
    AND EXISTS (
      SELECT 1
      FROM teacher_children tc
      INNER JOIN parent_children pc ON pc.child_id = tc.child_id
      WHERE tc.teacher_id = auth.uid()
      AND pc.parent_id = profiles.id
    )
  );

-- 4. ÖĞRETMENLER: Birbirlerini görebilir (sadece öğretmen-öğretmen)
CREATE POLICY "teachers_view_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    profiles.role = 'teacher'
    AND EXISTS (
      SELECT 1 FROM teacher_children WHERE teacher_id = auth.uid()
    )
  );

-- 5. HERKES: Admin ve rehber öğretmenleri görebilir (destek için)
CREATE POLICY "all_view_admin_and_counselor"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    profiles.role IN ('admin', 'guidance_counselor')
  );

-- 6. ADMİN VE REHBER: Herkesi görebilir
CREATE POLICY "admin_counselor_view_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'guidance_counselor')
  );

-- 7. HERKES: Kendi profilini oluşturabilir
CREATE POLICY "insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 8. HERKES: Kendi profilini güncelleyebilir
CREATE POLICY "update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 9. ADMİN: Herşeyi güncelleyebilir ve silebilir
CREATE POLICY "admin_all_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
