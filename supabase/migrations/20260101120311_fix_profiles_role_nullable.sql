/*
  # Personel kayıtları için role kolonunu nullable yap

  1. Değişiklikler
    - `profiles` tablosundaki `role` kolonunu nullable yap
    - Personel kayıtları `role = null` ve `staff_role` dolu olabilecek
  
  2. Güvenlik
    - Mevcut RLS politikaları korunuyor
*/

-- Role kolonunu nullable yap
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
