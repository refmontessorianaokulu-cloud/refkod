/*
  # Misafir Kullanıcı Desteği için Orders Tablosu Güncellemesi

  1. Değişiklikler
    - `orders` tablosuna misafir kullanıcı bilgileri için alanlar eklendi:
      - `guest_email` (text, nullable) - Misafir kullanıcı e-postası
      - `guest_phone` (text, nullable) - Misafir kullanıcı telefonu
      - `is_guest_order` (boolean) - Misafir sipariş mi?
    
    - `user_id` alanı nullable yapıldı (zaten nullable)
    
  2. RLS Politikaları
    - Misafir kullanıcıların sipariş oluşturabilmesi için politikalar güncellendi
    - Misafir siparişleri için order_items ve payments politikaları güncellendi
    
  3. Notlar
    - Misafir siparişlerinde user_id NULL olacak
    - is_guest_order = true olan siparişlerde guest_email ve guest_phone zorunlu
    - Kayıtlı kullanıcı siparişlerinde is_guest_order = false
*/

-- Add guest user fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'guest_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN guest_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'guest_phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN guest_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_guest_order'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_guest_order boolean DEFAULT false;
  END IF;
END $$;

-- Add check constraint to ensure guest orders have required fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'guest_order_fields_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT guest_order_fields_check CHECK (
      (is_guest_order = false AND user_id IS NOT NULL) OR
      (is_guest_order = true AND user_id IS NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
    );
  END IF;
END $$;

-- Update RLS policies to allow guest orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow anyone to create guest orders (no authentication required)
DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    (is_guest_order = true AND user_id IS NULL) OR
    (is_guest_order = false AND user_id = auth.uid())
  );

-- Update order_items policies to allow guest order items
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Users can create order items" ON order_items;
CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id AND 
      (orders.user_id = auth.uid() OR orders.is_guest_order = true)
    )
  );

-- Update payments policies to allow guest payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
DROP POLICY IF EXISTS "Users and guests can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON payments;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users and guests can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id AND 
      (orders.user_id = auth.uid() OR orders.is_guest_order = true)
    )
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
