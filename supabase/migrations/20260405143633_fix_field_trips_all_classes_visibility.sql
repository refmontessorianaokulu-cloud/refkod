/*
  # Gezi Görünürlüğünü Düzelt - "Tüm Sınıflar" Desteği

  1. Değişiklikler
    - Velilerin "Tüm Sınıflar" olarak işaretlenmiş gezileri görebilmesini sağla
    - Öğretmenlerin "Tüm Sınıflar" olarak işaretlenmiş gezileri görebilmesini sağla
    - Mevcut sınıf bazlı filtreleme mantığını koru

  2. Güvenlik
    - RLS politikaları korunuyor
    - Sadece aktif geziler görünür kalıyor
*/

-- Veliler için politikayı güncelle
DROP POLICY IF EXISTS "Parents can view field trips for their children's classes" ON field_trips;

CREATE POLICY "Parents can view field trips for their children's classes"
  ON field_trips
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
    AND (
      -- "Tüm Sınıflar" için oluşturulan gezileri göster
      class_name = 'Tüm Sınıflar'
      OR
      -- Veya çocuğun sınıfıyla eşleşen gezileri göster
      EXISTS (
        SELECT 1
        FROM children c
        JOIN parent_children pc ON pc.child_id = c.id
        WHERE pc.parent_id = auth.uid()
        AND c.class_name = field_trips.class_name
      )
    )
  );

-- Öğretmenler için politikayı güncelle
DROP POLICY IF EXISTS "Teachers can view field trips for their classes" ON field_trips;

CREATE POLICY "Teachers can view field trips for their classes"
  ON field_trips
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND (
      -- "Tüm Sınıflar" için oluşturulan gezileri göster
      class_name = 'Tüm Sınıflar'
      OR
      -- Veya öğretmenin atandığı sınıflarla eşleşen gezileri göster
      EXISTS (
        SELECT 1
        FROM teacher_branch_assignments tba
        WHERE tba.teacher_id = auth.uid()
        AND tba.class_name = field_trips.class_name
      )
    )
  );
