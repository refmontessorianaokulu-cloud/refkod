/*
  # MESAJLAŞMA İÇİN PROFILES GÖRÜNÜRLÜĞÜ
  
  ## Problem
  Öğretmenler ve veliler birbirlerini göremediği için mesaj gönderemiyor
  
  ## Çözüm
  Yeni RLS politikaları ekle:
  1. Öğretmen kendi velilerini görebilir
  2. Veli kendi öğretmenlerini görebilir
  3. Öğretmen diğer öğretmenleri görebilir
  4. Öğretmen rehberlik birimini görebilir
  5. Veli rehberlik birimini görebilir
  6. Herkes personeli görebilir
  
  ## Güvenlik
  - Sadece ilişkili kişiler görünür
  - Junction tablolar üzerinden kontrol
  - Profiles tablosuna ASLA recursive sorgu YOK
*/

-- ÖĞRETMEN: Kendi öğrencilerinin velilerini görebilir
CREATE POLICY "teacher_view_own_parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher'
    AND id IN (
      SELECT pc.parent_id
      FROM parent_children pc
      WHERE pc.child_id IN (
        SELECT tc.child_id
        FROM teacher_children tc
        WHERE tc.teacher_id = auth.uid()
      )
    )
  );

-- VELİ: Kendi çocuklarının öğretmenlerini görebilir
CREATE POLICY "parent_view_own_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND id IN (
      SELECT tc.teacher_id
      FROM teacher_children tc
      WHERE tc.child_id IN (
        SELECT pc.child_id
        FROM parent_children pc
        WHERE pc.parent_id = auth.uid()
      )
    )
  );

-- ÖĞRETMEN: Diğer öğretmenleri görebilir
CREATE POLICY "teacher_view_other_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher'
    AND role = 'teacher'
    AND approved = true
  );

-- ÖĞRETMEN: Rehberlik birimini görebilir
CREATE POLICY "teacher_view_counselors"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher'
    AND role = 'guidance_counselor'
    AND approved = true
  );

-- VELİ: Rehberlik birimini görebilir
CREATE POLICY "parent_view_counselors"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND role = 'guidance_counselor'
    AND approved = true
  );

-- VELİ: Yöneticiyi görebilir
CREATE POLICY "parent_view_admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND role = 'admin'
    AND approved = true
  );

-- HERKES: Personeli (staff) görebilir
CREATE POLICY "all_view_staff"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    staff_role IS NOT NULL
    AND approved = true
  );

-- REHBERLİK BİRİMİ: Öğretmenleri görebilir
CREATE POLICY "counselor_view_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'guidance_counselor'
    AND role = 'teacher'
    AND approved = true
  );

-- REHBERLİK BİRİMİ: Velileri görebilir
CREATE POLICY "counselor_view_parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'guidance_counselor'
    AND role = 'parent'
    AND approved = true
  );

-- PERSONEL: Yöneticiyi görebilir
CREATE POLICY "staff_view_admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IS NULL
    AND role = 'admin'
    AND approved = true
  );
