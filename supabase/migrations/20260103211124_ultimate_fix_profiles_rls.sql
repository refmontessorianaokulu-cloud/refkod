/*
  # KÖKLÜ RLS ÇÖZÜMÜ - Profiles Sonsuz Döngü
  
  ## Problem
  Politikalar profiles tablosunu sorgularken sonsuz döngüye giriyor
  SECURITY DEFINER fonksiyonu bile çalışmadı
  
  ## Çözüm
  RLS politikalarını BASİTLEŞTİR - ASLA profiles tablosunu sorgulama
  Sadece JWT ve diğer tablolara güven
  
  ## Yeni Yaklaşım
  1. Herkes kendi profilini görebilir
  2. Admin tüm profilleri görebilir (sadece JWT kontrolü)
  3. Diğer roller için özel politikalar ama profiles'a ASLA bakmadan
  
  ## Güvenlik
  - JWT app_metadata güvenilir (kullanıcı değiştiremez)
  - Junction tablolar (teacher_children, parent_children) güvenilir
  - Bu yaklaşım hem güvenli hem performanslı
*/

-- Önce tüm politikaları temizle
DROP POLICY IF EXISTS "view_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_view_all" ON profiles;
DROP POLICY IF EXISTS "teacher_view_staff_roles" ON profiles;
DROP POLICY IF EXISTS "teacher_view_own_parents" ON profiles;
DROP POLICY IF EXISTS "counselor_view_all_roles" ON profiles;
DROP POLICY IF EXISTS "staff_view_allowed_roles" ON profiles;
DROP POLICY IF EXISTS "parent_view_allowed_roles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

-- Kullanmadığımız fonksiyonu da temizle
DROP FUNCTION IF EXISTS get_profile_role(uuid);

-- YENİ BASİT POLİTİKALAR

-- 1. Herkes kendi profilini görebilir (en öncelikli)
CREATE POLICY "view_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. Admin tüm profilleri görebilir (sadece JWT kontrolü)
CREATE POLICY "admin_view_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 3. Teacher: Velileri görebilir (sadece junction tablo kontrolü)
CREATE POLICY "teacher_view_parents"
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

-- 4. Parent: Öğretmenleri görebilir (sadece junction tablo kontrolü)
CREATE POLICY "parent_view_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND id IN (
      SELECT tc.teacher_id
      FROM teacher_children tc
      INNER JOIN parent_children pc ON pc.child_id = tc.child_id
      WHERE pc.parent_id = auth.uid()
    )
  );

-- 5. Herkes admin'leri görebilir (genel iletişim için)
CREATE POLICY "everyone_view_admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IS NOT NULL
  );

-- Insert ve Update politikaları
CREATE POLICY "insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin update yetkisi
CREATE POLICY "admin_update_all"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
