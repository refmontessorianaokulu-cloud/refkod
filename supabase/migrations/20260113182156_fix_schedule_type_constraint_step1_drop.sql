/*
  # Schedule Type Constraint Düzeltmesi - Adım 1: Eski Constraint'i Kaldır
  
  1. Sorun
    - Database'deki constraint İngilizce değerleri bekliyor ('full_day', 'half_day')
    - Kod Türkçe değerleri gönderiyor ('tam_gun', 'yarim_gun')
    
  2. Bu Adım
    - Mevcut hatalı constraint'i kaldır
*/

-- Mevcut constraint'i kaldır
ALTER TABLE children 
DROP CONSTRAINT IF EXISTS children_schedule_type_check;
