/*
  # MESAJLAŞMA İÇİN PROFİL GÖRÜNÜRLÜĞÜ
  
  ## Kurallar
  1. VELİ: Sadece kendi çocuklarının öğretmenlerini, rehber öğretmenleri ve adminleri görebilir
  2. ÖĞRETMEN: Sadece kendi öğrencilerinin velilerini, diğer öğretmenleri, rehber öğretmenleri ve adminleri görebilir
  3. REHBER ÖĞRETMEN: Tüm öğretmenleri, velileri ve adminleri görebilir
  4. PERSONEL (STAFF): Sadece adminleri görebilir
  5. ADMİN: Herkesi görebilir
  6. HERKES: Kendi profilini görebilir
  
  ## Güvenlik
  - Veli veli göremez
  - İlgisiz kişiler birbirini göremez
  - Sadece iş ilişkisi olan kişiler görünür
*/

-- TÜM MEVCUT POLİTİKALARI SİL
DROP POLICY IF EXISTS "authenticated_read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own" ON profiles;
DROP POLICY IF EXISTS "users_insert_own" ON profiles;
DROP POLICY IF EXISTS "admin_update_all" ON profiles;
DROP POLICY IF EXISTS "admin_delete_all" ON profiles;

-- 1. HERKES KENDİ PROFİLİNİ GÖREBİLİR (en önemli, ilk sırada olmalı)
CREATE POLICY "select_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. VELİ: Çocuklarının öğretmenlerini görebilir
CREATE POLICY "parent_view_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'teacher'
    AND EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.teacher_id = profiles.id
      AND tc.child_id IN (
        SELECT child_id FROM parent_children
        WHERE parent_id = auth.uid()
      )
    )
  );

-- 3. VELİ: Rehber öğretmenleri görebilir
CREATE POLICY "parent_view_counselors"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'guidance_counselor'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'parent'
    )
  );

-- 4. VELİ: Adminleri görebilir
CREATE POLICY "parent_view_admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'admin'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'parent'
    )
  );

-- 5. ÖĞRETMEN: Kendi öğrencilerinin velilerini görebilir
CREATE POLICY "teacher_view_parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_children pc
      WHERE pc.parent_id = profiles.id
      AND pc.child_id IN (
        SELECT child_id FROM teacher_children
        WHERE teacher_id = auth.uid()
      )
    )
  );

-- 6. ÖĞRETMEN: Diğer öğretmenleri görebilir
CREATE POLICY "teacher_view_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'teacher'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- 7. ÖĞRETMEN: Rehber öğretmenleri görebilir
CREATE POLICY "teacher_view_counselors"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'guidance_counselor'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- 8. ÖĞRETMEN: Adminleri görebilir
CREATE POLICY "teacher_view_admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'admin'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- 9. REHBER ÖĞRETMEN: Tüm öğretmenleri görebilir
CREATE POLICY "counselor_view_teachers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'teacher'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'guidance_counselor'
    )
  );

-- 10. REHBER ÖĞRETMEN: Tüm velileri görebilir
CREATE POLICY "counselor_view_parents"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'parent'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'guidance_counselor'
    )
  );

-- 11. REHBER ÖĞRETMEN: Adminleri görebilir
CREATE POLICY "counselor_view_admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'admin'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'guidance_counselor'
    )
  );

-- 12. PERSONEL: Adminleri görebilir
CREATE POLICY "staff_view_admins"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'admin'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.staff_role IS NOT NULL
    )
  );

-- 13. PERSONEL: Diğer personeli görebilir
CREATE POLICY "staff_view_staff"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    staff_role IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.staff_role IS NOT NULL
    )
  );

-- 14. ADMİN: Herkesi görebilir
CREATE POLICY "admin_view_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- 15. HERKES: Kendi profilini oluşturabilir (signup için)
CREATE POLICY "insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 16. HERKES: Kendi profilini güncelleyebilir
CREATE POLICY "update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 17. ADMİN: Tüm profilleri güncelleyebilir
CREATE POLICY "admin_update_all"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- 18. ADMİN: Profilleri silebilir
CREATE POLICY "admin_delete_all"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
