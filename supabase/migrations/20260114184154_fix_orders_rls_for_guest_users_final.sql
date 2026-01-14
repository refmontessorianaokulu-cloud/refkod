/*
  # Misafir Kullanıcılar İçin Orders RLS Düzeltmesi (Final)

  1. Sorun
    - Misafir kullanıcılar sipariş oluştururken "new row violates row-level security policy" hatası alıyordu
    - Mevcut politika doğru görünse de çalışmıyordu

  2. Çözüm
    - Mevcut "Users can create orders" politikası kaldırıldı
    - Yeni "Users and guests can create orders" politikası oluşturuldu
    - Politika hem authenticated hem de anonymous (guest) kullanıcılar için çalışacak şekilde düzenlendi

  3. Güvenlik
    - Misafir siparişler: is_guest_order=true VE user_id=NULL olmalı
    - Kayıtlı kullanıcı siparişleri: is_guest_order=false VE user_id=auth.uid() olmalı
    - Her iki durumda da doğru kontroller yapılıyor
*/

-- Drop existing INSERT policy on orders
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Test allow all inserts" ON orders;
DROP POLICY IF EXISTS "Users and guests can create orders" ON orders;

-- Create new policy that works for both authenticated and guest users
CREATE POLICY "Users and guests can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    -- Guest orders: is_guest_order must be true and user_id must be NULL
    (is_guest_order = true AND user_id IS NULL) OR
    -- Authenticated user orders: is_guest_order must be false and user_id must match
    (is_guest_order = false AND user_id = auth.uid())
  );
