/*
  # Fix Orders INSERT Policy Conflicts

  1. Problem
    - Two conflicting INSERT policies exist on the orders table
    - "Users and guests can create orders" (PUBLIC role)
    - "Users can create orders including guest orders" (AUTHENTICATED role)
    - These policies conflict and cause RLS violations

  2. Solution
    - Drop both existing INSERT policies
    - Create a single comprehensive INSERT policy for PUBLIC role
    - Policy allows both authenticated users and anonymous guests to create orders
    - For authenticated users: user_id must match auth.uid() and is_guest_order must be false
    - For guest orders: user_id must be NULL, is_guest_order must be true, and guest_email/guest_phone must be provided

  3. Security
    - Authenticated users can only create orders for themselves
    - Guest orders must have contact information
    - Each order type has clear validation requirements
*/

-- Drop the conflicting INSERT policies
DROP POLICY IF EXISTS "Users and guests can create orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders including guest orders" ON orders;

-- Create a single comprehensive INSERT policy for all users
CREATE POLICY "Allow order creation for authenticated users and guests"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    -- Authenticated users creating their own orders
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_guest_order = false)
    OR
    -- Anonymous guests creating guest orders with required info
    (auth.uid() IS NULL AND user_id IS NULL AND is_guest_order = true AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
  );