/*
  # Fix Orders RLS Policy for Guest Role Users

  1. Changes
    - Drop existing "Allow order creation for users and guests" policy
    - Create new simplified INSERT policy that allows:
      - All authenticated users (including guest role) to create orders
      - The policy checks that user_id matches auth.uid() for authenticated users
    
  2. Security
    - Authenticated users can only create orders with their own user_id
    - Maintains data integrity by preventing users from creating orders for others
    - Allows guest role users to create orders
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow order creation for users and guests" ON orders;

-- Create new simplified policy for order creation
-- This allows ALL authenticated users (including guest role) to create orders
CREATE POLICY "Authenticated users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
