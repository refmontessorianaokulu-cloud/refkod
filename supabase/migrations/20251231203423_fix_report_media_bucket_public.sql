/*
  # Report Media Bucket'ını Public Yap

  1. Değişiklikler
    - `report-media` bucket'ını public yap
    - Böylece fotoğraflar ve videolar doğrudan erişilebilir olur
    
  2. Güvenlik
    - RLS politikaları hala geçerli
    - Sadece kimliği doğrulanmış kullanıcılar erişebilir
*/

-- Bucket'ı public yap
UPDATE storage.buckets
SET public = true
WHERE id = 'report-media';