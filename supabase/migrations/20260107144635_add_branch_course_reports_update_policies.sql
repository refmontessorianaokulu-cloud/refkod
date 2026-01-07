/*
  # Branş Dersleri Raporları için UPDATE Politikaları

  1. Güvenlik
    - Öğretmenler kendi oluşturdukları raporları güncelleyebilir
    - Adminler tüm raporları güncelleyebilir
*/

-- Öğretmenler kendi raporlarını güncelleyebilir
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
