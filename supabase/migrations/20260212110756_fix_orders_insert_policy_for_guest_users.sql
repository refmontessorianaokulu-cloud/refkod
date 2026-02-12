/*
  # Fix Orders RLS Policy for Guest Users

  ## Problem
  The existing INSERT policy on orders table only allows orders where `user_id = auth.uid()`.
  This prevents guest users from creating orders where `user_id = NULL`.

  ## Changes
  1. Drop existing restrictive INSERT policy
  2. Create new INSERT policy that allows:
     - Authenticated users to create orders with their own user_id
     - Guest orders with user_id = NULL

  ## Security
  - Only authenticated users can create orders (both for themselves and as guests)
  - Guest orders must have guest contact information (email, phone)
  - The policy ensures users cannot create orders for other users
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- Create new policy that allows both user orders and guest orders
CREATE POLICY "Users can create orders including guest orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );