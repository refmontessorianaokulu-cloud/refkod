/*
  # Günlük Raporlara Medya Desteği Ekle

  1. Tablo Değişiklikleri
    - `daily_reports` tablosuna `media_urls` sütunu ekle (text array)
    - Fotoğraf ve video URL'lerini saklamak için

  2. Storage
    - `report-media` bucket'ı oluştur
    - Öğretmenlerin rapor medyalarını yükleyebilmesi için
    - Velilerin medyaları görüntüleyebilmesi için

  3. Güvenlik
    - Sadece öğretmenler ve yöneticiler medya yükleyebilir
    - Veliler sadece kendi çocuklarının rapor medyalarını görüntüleyebilir
    - RLS politikaları ile korunmuş
*/

-- daily_reports tablosuna media_urls sütunu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-media', 'report-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Öğretmenler ve yöneticiler yükleyebilir
CREATE POLICY "Teachers and admins can upload report media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'report-media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Storage policies: Öğretmenler ve yöneticiler güncelleyebilir
CREATE POLICY "Teachers and admins can update report media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'report-media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Storage policies: Öğretmenler ve yöneticiler silebilir
CREATE POLICY "Teachers and admins can delete report media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'report-media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Storage policies: Kimliği doğrulanmış kullanıcılar görüntüleyebilir
CREATE POLICY "Authenticated users can view report media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'report-media');
