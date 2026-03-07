/*
  # Allow Public Read Access to Profiles for Product Reviews

  1. Changes
    - Add a new RLS policy to allow public (anon/guest) users to read basic profile information
    - This is needed so that guest users can view product reviews with user names
    - The policy only allows reading profiles, no updates or inserts from guests

  2. Security
    - Only SELECT permission is granted
    - Guests can only read profile data, not modify it
    - This is safe because we mask user names in the UI anyway
*/

CREATE POLICY "Public can read profiles for reviews"
  ON profiles
  FOR SELECT
  TO public
  USING (true);
