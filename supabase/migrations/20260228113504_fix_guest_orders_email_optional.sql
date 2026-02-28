/*
  # Fix Guest Orders - Make Email Optional

  1. Changes
    - Update RLS policy for orders table to allow guest orders without email
    - Email is optional for guest orders, only phone is required
  
  2. Security
    - Guest orders must have is_guest_order = true
    - Guest orders must have guest_phone
    - Guest orders must have user_id = NULL
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow order creation for users and guests" ON orders;

-- Create new policy with email optional for guests
CREATE POLICY "Allow order creation for users and guests"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    -- Authenticated users
    (
      auth.uid() IS NOT NULL 
      AND user_id = auth.uid() 
      AND is_guest_order = false
    )
    OR
    -- Guest users (only phone required, email optional)
    (
      user_id IS NULL 
      AND is_guest_order = true 
      AND guest_phone IS NOT NULL
    )
  );
