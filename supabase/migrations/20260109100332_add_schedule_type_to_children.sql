/*
  # Program Türü Ekleme - Yarım Gün / Tam Gün
  
  1. Değişiklikler
    - `children` tablosuna `schedule_type` sütunu ekleniyor
    - Değerler: 'tam_gun' (varsayılan) veya 'yarim_gun'
    - Mevcut tüm öğrenciler 'tam_gun' olarak ayarlanacak
    
  2. Özellikler
    - Yarım gün öğrencilerin devamsızlık, yemek takibi gibi özelliklerde fark olmayacak
    - Sadece bilgilendirme amaçlı bir işaretleme
    - Birden fazla öğretmen atama aktif kalacak
*/

-- Children tablosuna schedule_type sütunu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'schedule_type'
  ) THEN
    ALTER TABLE children 
    ADD COLUMN schedule_type text NOT NULL DEFAULT 'tam_gun' 
    CHECK (schedule_type IN ('tam_gun', 'yarim_gun'));
  END IF;
END $$;