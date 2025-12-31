/*
  # Öğretmen-Çocuk İlişkisi Ekle

  1. Yeni Tablo
    - `teacher_children`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, profiles referansı)
      - `child_id` (uuid, children referansı)
      - `created_at` (timestamptz)
      - Her öğretmen-çocuk çifti unique olmalı

  2. RLS Politika Güncellemeleri
    - Öğretmenler sadece atandıkları çocukları görebilir
    - Meal logs, sleep logs ve daily reports için politikaları güncelle
    - Yöneticiler tüm verileri görmeye devam edebilir

  3. Güvenlik
    - RLS aktif
    - Sadece yöneticiler öğretmen-çocuk ilişkisi ekleyebilir
*/

-- Teacher-Children ilişki tablosu oluştur
CREATE TABLE IF NOT EXISTS teacher_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, child_id)
);

ALTER TABLE teacher_children ENABLE ROW LEVEL SECURITY;

-- İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_teacher_children_teacher_id ON teacher_children(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_children_child_id ON teacher_children(child_id);

-- RLS Politikaları: Teacher-Children
CREATE POLICY "Admins can view all teacher-child relationships"
  ON teacher_children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can view their relationships"
  ON teacher_children FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can manage teacher-child relationships"
  ON teacher_children FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Children tablosu politikalarını güncelle
DROP POLICY IF EXISTS "Teachers can view all children" ON children;

CREATE POLICY "Teachers can view assigned children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = children.id
      AND teacher_children.teacher_id = auth.uid()
    )
  );

-- Meal logs politikalarını güncelle
DROP POLICY IF EXISTS "Teachers can view all meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Teachers can insert meal logs" ON meal_logs;

CREATE POLICY "Teachers can view assigned children meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = meal_logs.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert meal logs for assigned children"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = meal_logs.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
  );

-- Sleep logs politikalarını güncelle
DROP POLICY IF EXISTS "Teachers can view all sleep logs" ON sleep_logs;
DROP POLICY IF EXISTS "Teachers can insert sleep logs" ON sleep_logs;

CREATE POLICY "Teachers can view assigned children sleep logs"
  ON sleep_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = sleep_logs.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert sleep logs for assigned children"
  ON sleep_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = sleep_logs.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
  );

-- Daily reports politikalarını güncelle
DROP POLICY IF EXISTS "Teachers can insert reports for children" ON daily_reports;
DROP POLICY IF EXISTS "Teachers can view their own reports" ON daily_reports;

CREATE POLICY "Teachers can insert reports for assigned children"
  ON daily_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = daily_reports.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view their reports for assigned children"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = daily_reports.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
