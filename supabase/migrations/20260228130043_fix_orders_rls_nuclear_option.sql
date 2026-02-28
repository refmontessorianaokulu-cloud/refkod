/*
  # Fix Orders and Order Items RLS - Nuclear Option for Guest Users

  ## Problem
  - Guest users cannot create orders due to RLS policy failing
  - `auth.uid() IS NULL` check doesn't work properly with Supabase anon key
  - Order items table only allows authenticated users to insert

  ## Solution
  1. Drop and recreate orders INSERT policy with simpler logic:
     - If user_id is provided AND matches auth.uid() -> Allow (authenticated users)
     - If user_id is NULL AND is_guest_order is true -> Allow (guest users)
     - Remove problematic auth.uid() IS NULL check
  
  2. Add new order_items INSERT policy for guest orders:
     - Allow if order is a guest order (user_id IS NULL and is_guest_order = true)
     - Or if order belongs to authenticated user (user_id = auth.uid())

  ## Security
  - Authenticated users can only create orders for themselves
  - Guest users must provide guest_phone and set is_guest_order = true
  - Order items can only be added to valid orders (guest or authenticated)
  - No data loss - only policy changes
*/

-- Drop existing problematic orders INSERT policy
DROP POLICY IF EXISTS "Users and guests can create orders" ON orders;

-- Create new simplified orders INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_guest_order = false);

-- Create new orders INSERT policy for guest users (public/anon role)
CREATE POLICY "Guest users can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    user_id IS NULL 
    AND is_guest_order = true 
    AND guest_phone IS NOT NULL
  );

-- Drop existing order_items INSERT policy (only allows authenticated)
DROP POLICY IF EXISTS "Authenticated users can create order items for own orders" ON order_items;

-- Create new order_items INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Create new order_items INSERT policy for guest orders
CREATE POLICY "Guest users can create order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id IS NULL 
      AND orders.is_guest_order = true
    )
  );

-- Add SELECT policy for guest orders (so they can see order confirmation)
DROP POLICY IF EXISTS "Guest users can view their orders by session" ON orders;

CREATE POLICY "Public can view guest orders"
  ON orders
  FOR SELECT
  TO public
  USING (
    user_id IS NULL 
    AND is_guest_order = true
  );

-- Add SELECT policy for order_items for guest orders
DROP POLICY IF EXISTS "Guest users can view order items" ON order_items;

CREATE POLICY "Public can view guest order items"
  ON order_items
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id IS NULL 
      AND orders.is_guest_order = true
    )
  );
