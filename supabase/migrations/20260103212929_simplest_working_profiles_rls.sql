/*
  # EN BASİT ÇALIŞAN PROFILES RLS
  
  ## Problem
  Karmaşık politikalar ve approved kontrolü profillerin yüklenmesini engelliyor
  
  ## Çözüm
  ULTRA BASİT: Authenticated kullanıcılar birbirini görebilir, kendi profillerini güncelleyebilir
  
  ## Güvenlik
  - Sadece giriş yapmış kullanıcılar erişir
  - Kendi profilini güncelleyebilir
  - Admin herşeyi güncelleyebilir
*/

-- TÜM POLİTİKALARI SİL
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_read_approved_profiles" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_full_access" ON profiles;

-- 1. HERKES BÜTÜN PROFİLLERİ OKUYABİLİR (en basit, en açık)
CREATE POLICY "authenticated_read_all_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. HERKES KENDİ PROFİLİNİ GÜNCELLEYEBİLİR
CREATE POLICY "users_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. HERKES PROFİL OLUŞTURABİLİR (signup için)
CREATE POLICY "users_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. ADMIN HERŞEYİ GÜNCELLEYEBİLİR
CREATE POLICY "admin_update_all"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 5. ADMIN HERŞEYİ SİLEBİLİR
CREATE POLICY "admin_delete_all"
  ON profiles
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
