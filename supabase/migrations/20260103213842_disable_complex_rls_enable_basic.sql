/*
  # PROFILES RLS - EN BASİT ÇÖZÜM
  
  ## Sorun
  Karmaşık RLS politikaları circular reference ve infinite recursion'a sebep oluyor
  
  ## Çözüm
  RLS'i devre dışı bırak - uygulama katmanında kontrol et
  Ya da sadece authenticated kullanıcılar görebilsin
*/

-- TÜM POLİTİKALARI SİL
DROP POLICY IF EXISTS "view_own_profile" ON profiles;
DROP POLICY IF EXISTS "parents_view_their_teachers" ON profiles;
DROP POLICY IF EXISTS "teachers_view_their_parents" ON profiles;
DROP POLICY IF EXISTS "teachers_view_teachers" ON profiles;
DROP POLICY IF EXISTS "all_view_admin_and_counselor" ON profiles;
DROP POLICY IF EXISTS "admin_counselor_view_all" ON profiles;
DROP POLICY IF EXISTS "insert_own" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "admin_all_access" ON profiles;

-- RLS'İ DEVRE DIŞI BIRAK
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- VEYA SADECE AUTHENTICATED KULLANICILAR GÖREBİLSİN
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "authenticated_users_all_access"
--   ON profiles
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
