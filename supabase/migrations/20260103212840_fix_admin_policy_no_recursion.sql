/*
  # ADMIN POLİTİKASINI DÜzelt - NO RECURSION
  
  ## Problem
  Admin politikası profiles tablosunu sorguluyordu (circular reference)
  
  ## Çözüm
  app_metadata kullan, profiles tablosunu SORGULAMADAN
*/

-- Önceki admin politikasını sil
DROP POLICY IF EXISTS "admin_all_access" ON profiles;

-- YENİ: app_metadata kullanarak admin kontrolü (NO RECURSION)
CREATE POLICY "admin_full_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
