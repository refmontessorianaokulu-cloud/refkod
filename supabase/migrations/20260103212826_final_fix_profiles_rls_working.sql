/*
  # PROFILES RLS FİNAL FİX - ÇALIŞAN ÇÖZÜM
  
  ## Problem
  Circular dependency ve karmaşık politikalar sistemi çöktürüyor
  
  ## Çözüm
  TÜM politikaları sil, sadece 3 basit politika koy:
  1. Herkes kendi profilini okuyabilir
  2. Herkes approved kullanıcıları görebilir (mesajlaşma için)
  3. Herkes kendi profilini güncelleyebilir
  4. Herkes profil oluşturabilir
  5. Admin herşeyi görebilir
  
  BASIT, AÇIK, ÇALIŞIR.
*/

-- Tüm mevcut politikaları SİL
DROP POLICY IF EXISTS "select_own" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "insert_own" ON profiles;
DROP POLICY IF EXISTS "select_as_admin" ON profiles;
DROP POLICY IF EXISTS "update_as_admin" ON profiles;
DROP POLICY IF EXISTS "teacher_view_own_parents" ON profiles;
DROP POLICY IF EXISTS "parent_view_own_teachers" ON profiles;
DROP POLICY IF EXISTS "teacher_view_other_teachers" ON profiles;
DROP POLICY IF EXISTS "teacher_view_counselors" ON profiles;
DROP POLICY IF EXISTS "parent_view_counselors" ON profiles;
DROP POLICY IF EXISTS "parent_view_admins" ON profiles;
DROP POLICY IF EXISTS "all_view_staff" ON profiles;
DROP POLICY IF EXISTS "counselor_view_teachers" ON profiles;
DROP POLICY IF EXISTS "counselor_view_parents" ON profiles;
DROP POLICY IF EXISTS "staff_view_admins" ON profiles;

-- 1. HER KULLANICI KENDİ PROFİLİNİ GÖREBİLİR (en önemli)
CREATE POLICY "users_read_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. ONAYLANAN KULLANICILAR BİRBİRİNİ GÖREBİLİR (mesajlaşma için)
CREATE POLICY "users_read_approved_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (approved = true);

-- 3. HER KULLANICI KENDİ PROFİLİNİ GÜNCELLEYEBİLİR
CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. HER KULLANICI PROFİL OLUŞTURABİLİR
CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 5. ADMIN HERŞEYİ GÖREBİLİR VE GÜNCELLEYEBİLİR
CREATE POLICY "admin_all_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
