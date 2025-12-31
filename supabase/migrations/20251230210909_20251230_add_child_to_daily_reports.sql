/*
  # Günlük Raporlara Çocuk Bağlantısı Ekle

  1. Değişiklikler
    - `daily_reports` tablosuna `child_id` sütunu ekle
    - Foreign key constraint ile children tablosuna bağla
    - İndex oluştur hızlı sorgulamalar için

  2. Güvenlik Güncellemeleri
    - Yeni RLS politikaları ekle
    - Öğretmenler çocuklarına rapor ekleyebilir
    - Veliler kendi çocuklarının raporlarını görebilir
    - Yöneticiler tüm raporları görebilir
*/

DO $$
BEGIN
  -- child_id sütununu ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'child_id'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN child_id uuid REFERENCES children(id) ON DELETE CASCADE;
  END IF;
END $$;

-- İndeks oluştur performans için
CREATE INDEX IF NOT EXISTS idx_daily_reports_child_id ON daily_reports(child_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_teacher_id ON daily_reports(teacher_id);

-- Eski RLS politikalarını kaldır
DROP POLICY IF EXISTS "Teachers can insert their own reports" ON daily_reports;
DROP POLICY IF EXISTS "Teachers can view their own reports" ON daily_reports;
DROP POLICY IF EXISTS "Teachers can update their own reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON daily_reports;

-- Yeni RLS politikaları ekle
CREATE POLICY "Teachers can insert reports for children"
  ON daily_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Parents can view child reports"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children
      WHERE parent_children.parent_id = auth.uid()
      AND parent_children.child_id = daily_reports.child_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can view their own reports"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can update their own reports"
  ON daily_reports FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  )
  WITH CHECK (
    teacher_id = auth.uid()
  );
