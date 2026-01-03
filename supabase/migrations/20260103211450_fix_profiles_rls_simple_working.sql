/*
  # PROFILES RLS - ÇALIŞAN BASİT ÇÖZÜM
  
  ## Problem
  Karmaşık politikalar sonsuz döngüye sebebiyet veriyor
  
  ## Çözüm  
  EN BASİT politikalar - sadece giriş yapabilmek için
  
  ## Politikalar
  1. Herkes kendi profilini görebilir
  2. Admin herkesin profilini görebilir (sadece JWT)
  3. Herkes kendi profilini güncelleyebilir
  4. Herkes kendi profilini ekleyebilir
  5. Admin herkesi güncelleyebilir
  
  ## Güvenlik
  - Minimal politikalar
  - Profiles tablosuna ASLA sorgu atılmıyor
  - Sadece JWT ve auth.uid() kullanılıyor
*/

-- TÜM POLİTİKALARI SİL
DROP POLICY IF EXISTS "view_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_view_all" ON profiles;
DROP POLICY IF EXISTS "teacher_view_parents" ON profiles;
DROP POLICY IF EXISTS "parent_view_teachers" ON profiles;
DROP POLICY IF EXISTS "everyone_view_admins" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_update_all" ON profiles;

-- YENİ ULTRA BASİT POLİTİKALAR

-- SELECT: Sadece kendi profilin
CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- SELECT: Admin herkesi görebilir
CREATE POLICY "profiles_select_admin"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- INSERT: Kendi profilini oluştur
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Kendi profilini güncelle
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admin herkesi güncelleyebilir  
CREATE POLICY "profiles_update_admin"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
