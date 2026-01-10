/*
  # Branş Dersi Öğretmenlerinin Çocuklara Erişimini Düzelt

  1. Değişiklikler
    - Öğretmenler teacher_children ilişkisi ile atandıkları çocukları görebilir
    - Öğretmenler teacher_branch_assignments üzerinden atandıkları sınıftaki tüm çocukları görebilir
    - Daily reports, meal logs, sleep logs için aynı mantık uygulanır

  2. Güvenlik
    - Öğretmenler sadece atandıkları çocuklara veya sınıflardaki çocuklara erişebilir
    - Adminler tüm verilere erişebilir
    - RLS politikaları her iki atama türünü de destekler
*/

-- ====================================
-- CHILDREN TABLOSU POLİTİKALARI
-- ====================================

-- Mevcut öğretmen görüntüleme politikasını sil
DROP POLICY IF EXISTS "Teachers can view assigned children" ON children;

-- Hem teacher_children hem de teacher_branch_assignments kontrolü yapan yeni politika
CREATE POLICY "Teachers can view assigned children"
  ON children FOR SELECT
  TO authenticated
  USING (
    -- Montessori sınıfı öğretmenleri (teacher_children üzerinden)
    EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = children.id
      AND teacher_children.teacher_id = auth.uid()
    )
    OR
    -- Branş dersi öğretmenleri (teacher_branch_assignments üzerinden)
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments
      WHERE teacher_branch_assignments.class_name = children.class_name
      AND teacher_branch_assignments.teacher_id = auth.uid()
    )
  );

-- ====================================
-- DAILY REPORTS POLİTİKALARI
-- ====================================

-- Öğretmenlerin rapor ekleme politikasını güncelle
DROP POLICY IF EXISTS "Teachers can insert reports for assigned children" ON daily_reports;

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
    AND (
      -- Montessori sınıfı öğretmenleri
      EXISTS (
        SELECT 1 FROM teacher_children
        WHERE teacher_children.child_id = daily_reports.child_id
        AND teacher_children.teacher_id = auth.uid()
      )
      OR
      -- Branş dersi öğretmenleri
      EXISTS (
        SELECT 1 FROM teacher_branch_assignments tba
        JOIN children c ON c.class_name = tba.class_name
        WHERE tba.teacher_id = auth.uid()
        AND c.id = daily_reports.child_id
      )
    )
  );

-- Öğretmenlerin rapor görüntüleme politikasını güncelle
DROP POLICY IF EXISTS "Teachers can view their reports for assigned children" ON daily_reports;

CREATE POLICY "Teachers can view their reports for assigned children"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND (
      -- Montessori sınıfı öğretmenleri
      EXISTS (
        SELECT 1 FROM teacher_children
        WHERE teacher_children.child_id = daily_reports.child_id
        AND teacher_children.teacher_id = auth.uid()
      )
      OR
      -- Branş dersi öğretmenleri
      EXISTS (
        SELECT 1 FROM teacher_branch_assignments tba
        JOIN children c ON c.class_name = tba.class_name
        WHERE tba.teacher_id = auth.uid()
        AND c.id = daily_reports.child_id
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Öğretmenlerin rapor güncelleme politikasını ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'daily_reports'
    AND policyname = 'Teachers can update their own reports'
  ) THEN
    CREATE POLICY "Teachers can update their own reports"
      ON daily_reports FOR UPDATE
      TO authenticated
      USING (
        teacher_id = auth.uid()
        AND (
          EXISTS (
            SELECT 1 FROM teacher_children
            WHERE teacher_children.child_id = daily_reports.child_id
            AND teacher_children.teacher_id = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1 FROM teacher_branch_assignments tba
            JOIN children c ON c.class_name = tba.class_name
            WHERE tba.teacher_id = auth.uid()
            AND c.id = daily_reports.child_id
          )
        )
      )
      WITH CHECK (
        teacher_id = auth.uid()
        AND (
          EXISTS (
            SELECT 1 FROM teacher_children
            WHERE teacher_children.child_id = daily_reports.child_id
            AND teacher_children.teacher_id = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1 FROM teacher_branch_assignments tba
            JOIN children c ON c.class_name = tba.class_name
            WHERE tba.teacher_id = auth.uid()
            AND c.id = daily_reports.child_id
          )
        )
      );
  END IF;
END $$;

-- ====================================
-- MEAL LOGS POLİTİKALARI
-- ====================================

-- Öğretmenlerin meal log görüntüleme politikasını güncelle
DROP POLICY IF EXISTS "Teachers can view assigned children meal logs" ON meal_logs;

CREATE POLICY "Teachers can view assigned children meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (
    -- Montessori sınıfı öğretmenleri
    EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = meal_logs.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
    OR
    -- Branş dersi öğretmenleri
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = meal_logs.child_id
    )
  );

-- Öğretmenlerin meal log ekleme politikasını güncelle
DROP POLICY IF EXISTS "Teachers can insert meal logs for assigned children" ON meal_logs;

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
    AND (
      -- Montessori sınıfı öğretmenleri
      EXISTS (
        SELECT 1 FROM teacher_children
        WHERE teacher_children.child_id = meal_logs.child_id
        AND teacher_children.teacher_id = auth.uid()
      )
      OR
      -- Branş dersi öğretmenleri
      EXISTS (
        SELECT 1 FROM teacher_branch_assignments tba
        JOIN children c ON c.class_name = tba.class_name
        WHERE tba.teacher_id = auth.uid()
        AND c.id = meal_logs.child_id
      )
    )
  );

-- ====================================
-- SLEEP LOGS POLİTİKALARI
-- ====================================

-- Öğretmenlerin sleep log görüntüleme politikasını güncelle
DROP POLICY IF EXISTS "Teachers can view assigned children sleep logs" ON sleep_logs;

CREATE POLICY "Teachers can view assigned children sleep logs"
  ON sleep_logs FOR SELECT
  TO authenticated
  USING (
    -- Montessori sınıfı öğretmenleri
    EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = sleep_logs.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
    OR
    -- Branş dersi öğretmenleri
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = sleep_logs.child_id
    )
  );

-- Öğretmenlerin sleep log ekleme politikasını güncelle
DROP POLICY IF EXISTS "Teachers can insert sleep logs for assigned children" ON sleep_logs;

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
    AND (
      -- Montessori sınıfı öğretmenleri
      EXISTS (
        SELECT 1 FROM teacher_children
        WHERE teacher_children.child_id = sleep_logs.child_id
        AND teacher_children.teacher_id = auth.uid()
      )
      OR
      -- Branş dersi öğretmenleri
      EXISTS (
        SELECT 1 FROM teacher_branch_assignments tba
        JOIN children c ON c.class_name = tba.class_name
        WHERE tba.teacher_id = auth.uid()
        AND c.id = sleep_logs.child_id
      )
    )
  );
