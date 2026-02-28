/*
  # Sipariş Kargo Takip Sistemi

  1. Değişiklikler
    - `orders` tablosuna kargo takip alanları eklendi
      - `shipping_carrier` (text, nullable) - Kargo firması (Aras, MNG, Yurtiçi, PTT, vb.)
      - `tracking_number` (text, nullable) - Kargo takip numarası
      - `tracking_url` (text, nullable) - Kargo takip URL'i
      - `shipped_at` (timestamptz, nullable) - Kargoya verilme tarihi
      - `estimated_delivery_date` (date, nullable) - Tahmini teslim tarihi

  2. Notlar
    - Kargo bilgileri sipariş "shipped" durumuna alındığında doldurulur
    - WhatsApp ile kargo bilgileri müşteriye otomatik gönderilebilir
*/

-- Add shipping tracking fields to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_carrier text,
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS tracking_url text,
ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
ADD COLUMN IF NOT EXISTS estimated_delivery_date date;

-- Create index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;
