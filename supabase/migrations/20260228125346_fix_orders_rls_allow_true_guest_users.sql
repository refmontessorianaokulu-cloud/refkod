/*
  # Fix Orders RLS to Allow True Guest Users (Non-Authenticated)

  1. Problem
    - Current INSERT policy requires `authenticated` role AND `auth.uid() = user_id`
    - Guest users (not logged in) cannot create orders because:
      a) They don't have `authenticated` role
      b) auth.uid() is NULL for them
    
  2. Solution
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows:
      a) Authenticated users: Can create orders where auth.uid() = user_id
      b) True guests (public): Can create orders where user_id IS NULL AND is_guest_order = true AND guest_phone IS NOT NULL
    
  3. Security
    - Authenticated users can only create orders for themselves
    - Guest users must provide phone number and mark as guest order
    - Admin access remains unchanged
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create own orders" ON orders;

-- Create new flexible policy that allows both authenticated and public guest orders
CREATE POLICY "Users and guests can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    -- Authenticated users creating their own orders
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- True guest users (not logged in) creating guest orders
    (auth.uid() IS NULL AND user_id IS NULL AND is_guest_order = true AND guest_phone IS NOT NULL)
  );
