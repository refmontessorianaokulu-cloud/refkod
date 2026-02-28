/*
  # Fix Order Items RLS Policy for Guest Role Users

  1. Changes
    - Drop existing "Users can create order items" policy
    - Create new simplified INSERT policy that allows authenticated users to create order items for their own orders
    
  2. Security
    - Users can only create order items for orders they own (where order.user_id = auth.uid())
    - Maintains referential integrity with orders table
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Create new simplified policy for order items creation
CREATE POLICY "Authenticated users can create order items for own orders"
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
