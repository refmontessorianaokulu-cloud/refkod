/*
  # Günlük Raporlara Montessori Alanları Ekle

  1. Değişiklikler
    - `daily_reports` tablosuna Montessori eğitim alanları eklendi
    - Her alan için detaylı gözlem kaydı yapılabilir
    
  2. Yeni Sütunlar
    - `practical_life` (text) - Pratik Yaşam alanı gözlemleri
    - `sensorial` (text) - Duyusal Gelişim alanı gözlemleri
    - `mathematics` (text) - Matematik alanı gözlemleri
    - `language` (text) - Dil alanı gözlemleri
    - `culture` (text) - Kültür alanı gözlemleri (Coğrafya, Bilim, Sanat, Müzik)
    - `general_notes` (text) - Genel gözlemler ve notlar
    - `mood` (text) - Çocuğun genel ruh hali
    - `social_interaction` (text) - Sosyal etkileşim gözlemleri

  3. Mevcut Alanlar
    - `title` ve `content` alanları kaldırıldı
    - Yerine Montessori alanlarına özgü detaylı gözlem alanları eklendi
*/

-- Eski sütunları kaldır
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'title'
  ) THEN
    ALTER TABLE daily_reports DROP COLUMN IF EXISTS title;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'content'
  ) THEN
    ALTER TABLE daily_reports DROP COLUMN IF EXISTS content;
  END IF;
END $$;

-- Montessori alanlarını ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'practical_life'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN practical_life text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'sensorial'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN sensorial text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'mathematics'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN mathematics text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'language'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN language text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'culture'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN culture text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'general_notes'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN general_notes text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'mood'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN mood text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_reports' AND column_name = 'social_interaction'
  ) THEN
    ALTER TABLE daily_reports ADD COLUMN social_interaction text DEFAULT '';
  END IF;
END $$;
