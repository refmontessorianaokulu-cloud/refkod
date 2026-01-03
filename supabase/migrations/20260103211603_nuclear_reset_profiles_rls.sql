/*
  # PROFILES RLS - TAM SIFIRLAMA
  
  ## Eylem Planı
  1. RLS'yi kapat
  2. Tüm politikaları sil
  3. RLS'yi aç
  4. Sadece 2 politika ekle (kendi profilin + admin)
  
  ## Güvenlik
  - Minimum politika = minimum risk
  - Profiles tablosuna HİÇBİR ZAMAN recursive sorgu yok
*/

-- RLS'yi kapat
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Tüm politikaları sil
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- RLS'yi tekrar aç
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- POLİTİKA 1: Kendi profilini gör
CREATE POLICY "select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- POLİTİKA 2: Admin herkesi görebilir
CREATE POLICY "select_as_admin"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- POLİTİKA 3: Kendi profilini ekle
CREATE POLICY "insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- POLİTİKA 4: Kendi profilini güncelle
CREATE POLICY "update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- POLİTİKA 5: Admin herkesi güncelleyebilir
CREATE POLICY "update_as_admin"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
