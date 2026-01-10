/*
  # Davranış Kayıtlarına Medya Ekleme

  ## Özet
  Davranış olay kayıtlarına fotoğraf ve video eklenebilmesi için media_urls alanı ekleniyor.

  ## Değişiklikler
    - `behavior_incidents` tablosuna `media_urls` kolonu eklendi
      - `media_urls` (text array, nullable) - Fotoğraf ve video URL'leri

  ## Notlar
    - Medya dosyaları report-media bucket'ında saklanacak
    - Her kayıt için birden fazla medya dosyası eklenebilir
*/

-- Add media_urls column to behavior_incidents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'behavior_incidents' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE behavior_incidents
    ADD COLUMN media_urls text[];
  END IF;
END $$;