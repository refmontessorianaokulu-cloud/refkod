/*
  # Add Admin Delete Policies for Orders and Order Items

  1. Changes
    - Add DELETE policy for `orders` table to allow admins to delete orders
    - Add DELETE policy for `order_items` table to allow admins to delete order items
  
  2. Security
    - Only users with role 'admin' can delete orders and order items
    - Uses inline role check to avoid recursion issues
*/

-- Add delete policy for orders
CREATE POLICY "Admins can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Add delete policy for order_items
CREATE POLICY "Admins can delete order items"
  ON order_items
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
