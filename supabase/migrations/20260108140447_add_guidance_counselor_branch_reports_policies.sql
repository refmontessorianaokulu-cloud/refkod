/*
  # Rehberlik Öğretmeni Branş Raporları Politikaları

  1. Yeni Politikalar
    - Rehberlik öğretmenleri Rehberlik dersi raporları oluşturabilir
    - Rehberlik öğretmenleri kendi oluşturdukları Rehberlik raporlarını güncelleyebilir
    - Rehberlik öğretmenleri tüm Rehberlik raporlarını görüntüleyebilir

  2. Güvenlik
    - Sadece guidance_counselor rolüne sahip kullanıcılar için
    - Sadece course_type = 'guidance' olan raporlar için geçerli
*/

-- Rehberlik öğretmenleri Rehberlik dersi raporları oluşturabilir
CREATE POLICY "Guidance counselors can create guidance reports"
  ON branch_course_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    course_type = 'guidance'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
  );

-- Rehberlik öğretmenleri kendi Rehberlik raporlarını güncelleyebilir
CREATE POLICY "Guidance counselors can update own guidance reports"
  ON branch_course_reports
  FOR UPDATE
  TO authenticated
  USING (
    course_type = 'guidance'
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
  )
  WITH CHECK (
    course_type = 'guidance'
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
  );

-- Rehberlik öğretmenleri tüm Rehberlik raporlarını görüntüleyebilir
CREATE POLICY "Guidance counselors can view all guidance reports"
  ON branch_course_reports
  FOR SELECT
  TO authenticated
  USING (
    course_type = 'guidance'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
  );