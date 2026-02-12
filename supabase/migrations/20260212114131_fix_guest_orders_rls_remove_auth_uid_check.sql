/*
  # Fix Guest Orders RLS - Remove auth.uid() Check for Guest Orders

  1. Problem
    - Current INSERT policy checks `auth.uid() IS NULL` for guest orders
    - If user was previously logged in and clicks "Guest Login", old session may still exist
    - This causes `auth.uid()` to NOT be NULL even though user is in guest mode
    - RLS policy rejects the insert because auth.uid() is not NULL

  2. Solution
    - Drop existing INSERT policy
    - Create new INSERT policy that focuses on data fields rather than auth state
    - For authenticated orders: user_id must match auth.uid() and is_guest_order must be false
    - For guest orders: user_id must be NULL and is_guest_order must be true (no auth.uid() check!)
    - Guest orders only need to have required contact information

  3. Security
    - Authenticated users still can only create orders for themselves
    - Guest orders must have NULL user_id and required contact fields
    - No security is compromised by removing auth.uid() check for guest orders
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow order creation for authenticated users and guests" ON orders;

-- Create improved INSERT policy without auth.uid() check for guest orders
CREATE POLICY "Allow order creation for users and guests"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    -- Authenticated users creating their own orders
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_guest_order = false)
    OR
    -- Guest orders with required contact info (no auth.uid() check needed!)
    (user_id IS NULL AND is_guest_order = true AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
  );
