/*
  # Schedule Type Constraint Düzeltmesi - Adım 2: Verileri Güncelle
  
  1. Değişiklik
    - İngilizce değerleri Türkçe değerlere çevir
    - 'full_day' -> 'tam_gun'
    - 'half_day' -> 'yarim_gun'
*/

-- Mevcut verileri güncelle
UPDATE children 
SET schedule_type = 'tam_gun' 
WHERE schedule_type = 'full_day';

UPDATE children 
SET schedule_type = 'yarim_gun' 
WHERE schedule_type = 'half_day';

-- Null veya boş değerleri tam_gun yap
UPDATE children 
SET schedule_type = 'tam_gun' 
WHERE schedule_type IS NULL OR schedule_type = '';
