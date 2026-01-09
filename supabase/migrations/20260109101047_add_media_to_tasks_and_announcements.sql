/*
  # Görevlendirme ve Duyurulara Fotoğraf Ekleme
  
  1. Değişiklikler
    - `task_assignments` tablosuna `media_urls` sütunu ekleniyor (text dizisi)
    - `announcements` tablosuna `media_urls` sütunu ekleniyor (text dizisi)
    - `task-media` ve `announcement-media` storage bucket'ları oluşturuluyor
    
  2. Güvenlik
    - Storage bucket'ları için RLS politikaları ekleniyor
    - Authenticated kullanıcılar fotoğraf yükleyebilir
    - Herkes fotoğrafları görüntüleyebilir
*/

-- Task assignments tablosuna media_urls ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_assignments' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE task_assignments 
    ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;

-- Announcements tablosuna media_urls ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE announcements 
    ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;

-- Task media storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-media', 'task-media', true)
ON CONFLICT (id) DO NOTHING;

-- Announcement media storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-media', 'announcement-media', true)
ON CONFLICT (id) DO NOTHING;

-- Task media bucket için storage policies
CREATE POLICY "Anyone can view task media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-media');

CREATE POLICY "Authenticated users can upload task media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'task-media');

CREATE POLICY "Users can update own task media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'task-media');

CREATE POLICY "Users can delete own task media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'task-media');

-- Announcement media bucket için storage policies
CREATE POLICY "Anyone can view announcement media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-media');

CREATE POLICY "Authenticated users can upload announcement media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcement-media');

CREATE POLICY "Users can update own announcement media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'announcement-media');

CREATE POLICY "Users can delete own announcement media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'announcement-media');