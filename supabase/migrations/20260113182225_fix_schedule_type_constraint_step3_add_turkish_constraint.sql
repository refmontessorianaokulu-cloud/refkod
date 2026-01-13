/*
  # Schedule Type Constraint Düzeltmesi - Adım 3: Türkçe Constraint Ekle
  
  1. Değişiklik
    - Türkçe değerleri kabul eden yeni constraint ekle
    - Sadece 'tam_gun' ve 'yarim_gun' değerlerine izin ver
*/

-- Türkçe değerleri kabul eden yeni constraint ekle
ALTER TABLE children 
ADD CONSTRAINT children_schedule_type_check 
CHECK (schedule_type IN ('tam_gun', 'yarim_gun'));
