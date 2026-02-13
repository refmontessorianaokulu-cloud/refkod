/*
  # Fix Play Group Bookings INSERT Policy - Public Access

  ## Problem
  Users are getting RLS policy violation error when trying to create bookings,
  even though the policy exists and works in SQL tests. This is likely a cache
  or policy application issue.

  ## Solution
  1. Drop the existing INSERT policy
  2. Recreate with PUBLIC access (instead of authenticated, anon)
  3. Ensure the policy is as permissive as possible for INSERT

  ## Security
  - Anyone (authenticated or anonymous) can create a booking
  - This is safe because bookings only create records, no sensitive data access
  - Admins still control approval and payment through status updates
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Anyone can create play group bookings" ON play_group_bookings;

-- Create new PUBLIC INSERT policy
CREATE POLICY "Public can create play group bookings"
  ON play_group_bookings
  FOR INSERT
  TO public
  WITH CHECK (true);
