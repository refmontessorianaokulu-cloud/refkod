/*
  # Ürünlere İndirimli Fiyat Alanı Ekle

  1. Değişiklikler
    - `products` tablosuna `discounted_price` (decimal, nullable) kolonu ekleniyor
    - İndirimli fiyat varsa, base_price'dan düşük olmalı
    - İndirimli fiyat opsiyonel - sadece kampanyalı ürünlerde kullanılır

  2. Mantık
    - `discounted_price` NULL ise normal fiyat gösterilir
    - `discounted_price` varsa:
      - Normal fiyat üstü çizili ve soluk gösterilir
      - İndirimli fiyat büyük ve vurgulu gösterilir
*/

-- İndirimli fiyat kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'discounted_price'
  ) THEN
    ALTER TABLE products ADD COLUMN discounted_price DECIMAL(10,2);
  END IF;
END $$;

-- İndirimli fiyat kontrolü için constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_discounted_price_valid'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT check_discounted_price_valid 
      CHECK (discounted_price IS NULL OR discounted_price < base_price);
  END IF;
END $$;