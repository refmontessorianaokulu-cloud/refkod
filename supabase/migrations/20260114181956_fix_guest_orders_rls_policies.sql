/*
  # Misafir Sipariş RLS Politikalarını Düzelt

  1. Değişiklikler
    - Orders INSERT politikası TO PUBLIC yapıldı
    - Order Items INSERT politikası TO PUBLIC yapıldı
    - Payments INSERT politikası TO PUBLIC yapıldı
  
  2. Açıklama
    - Misafir kullanıcılar authenticated değil (anonim)
    - TO PUBLIC belirtilmediğinde varsayılan olarak TO authenticated uygulanır
    - Bu yüzden misafir kullanıcılar sipariş oluşturamıyordu
    - TO PUBLIC ile hem authenticated hem de anonim kullanıcılar bu işlemleri yapabilir
    - WITH CHECK koşulları ile hala güvenlik sağlanıyor
  
  3. Güvenlik
    - WITH CHECK koşulları değiştirilmedi
    - Misafir siparişlerde is_guest_order=true ve user_id=NULL olmalı
    - Kayıtlı kullanıcı siparişlerinde is_guest_order=false ve user_id=auth.uid() olmalı
*/

-- Fix orders INSERT policy to allow guest users
DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO PUBLIC
  WITH CHECK (
    (is_guest_order = true AND user_id IS NULL) OR
    (is_guest_order = false AND user_id = auth.uid())
  );

-- Fix order_items INSERT policy to allow guest users
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO PUBLIC
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id AND 
      (orders.user_id = auth.uid() OR orders.is_guest_order = true)
    )
  );

-- Fix payments INSERT policy to allow guest users
DROP POLICY IF EXISTS "Users and guests can create payments" ON payments;
CREATE POLICY "Users and guests can create payments"
  ON payments FOR INSERT
  TO PUBLIC
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id AND 
      (orders.user_id = auth.uid() OR orders.is_guest_order = true)
    )
  );
