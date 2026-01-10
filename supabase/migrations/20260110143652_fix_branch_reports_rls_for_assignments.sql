/*
  # Branş Dersi Raporları RLS Politikalarını Düzeltme
  
  1. Değişiklikler
    - Öğretmenlerin atandıkları sınıflardaki çocuklar için rapor görebilmesini sağla
    - Öğretmenlerin atandıkları sınıflardaki çocuklar için rapor ekleyebilmesini sağla
    
  2. Güvenlik
    - Öğretmenler sadece atandıkları sınıf-ders kombinasyonları için rapor ekleyebilir
    - Öğretmenler hem teacher_children hem de teacher_branch_assignments üzerinden çocukları görebilir
*/

-- Öğretmenlerin raporları görme politikasını güncelle
DROP POLICY IF EXISTS "Teachers can view their own branch course reports" ON branch_course_reports;

CREATE POLICY "Teachers can view branch reports for assigned classes"
  ON branch_course_reports
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teacher_children
      WHERE teacher_children.child_id = branch_course_reports.child_id
      AND teacher_children.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE tba.teacher_id = auth.uid()
      AND c.id = branch_course_reports.child_id
      AND tba.course_type = branch_course_reports.course_type
    )
  );

-- Öğretmenlerin rapor ekleme politikasını güncelle
DROP POLICY IF EXISTS "Teachers can create branch course reports" ON branch_course_reports;

CREATE POLICY "Teachers can create branch reports for assigned classes"
  ON branch_course_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
      AND profiles.approved = true
    )
    AND (
      EXISTS (
        SELECT 1 FROM teacher_children
        WHERE teacher_children.child_id = branch_course_reports.child_id
        AND teacher_children.teacher_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM teacher_branch_assignments tba
        JOIN children c ON c.class_name = tba.class_name
        WHERE tba.teacher_id = auth.uid()
        AND c.id = branch_course_reports.child_id
        AND tba.course_type = branch_course_reports.course_type
      )
    )
  );

-- Gereksiz UPDATE politikalarını temizle (birden fazla var)
DROP POLICY IF EXISTS "Teachers can update own branch course reports" ON branch_course_reports;
DROP POLICY IF EXISTS "Teachers can update their own branch course reports" ON branch_course_reports;

-- Sadece bir tane UPDATE politikası bırak
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'branch_course_reports' 
    AND policyname = 'Teachers can update their own branch reports'
  ) THEN
    CREATE POLICY "Teachers can update their own branch reports"
      ON branch_course_reports FOR UPDATE
      TO authenticated
      USING (
        teacher_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('teacher', 'admin')
        )
      )
      WITH CHECK (
        teacher_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('teacher', 'admin')
        )
      );
  END IF;
END $$;

-- DELETE politikası ekle
CREATE POLICY "Teachers can delete their own branch reports"
  ON branch_course_reports
  FOR DELETE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );