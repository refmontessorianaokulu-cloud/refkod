/*
  # Fix About Content Public Access

  1. Problem
    - Login page loads `about_content` before user authentication
    - Current RLS policy only allows `authenticated` users to view content
    - Anonymous (anon) users cannot see about sections on login page

  2. Solution
    - Add SELECT policy for anonymous users on `about_content` table
    - Add SELECT policy for anonymous users on `app_settings` table (for video settings)
    - This allows public access to read-only content before authentication

  3. Security
    - Only SELECT (read) permission for anon users
    - Insert, Update, Delete still restricted to admins only
    - Content remains publicly viewable as intended
*/

-- Drop existing policy if it exists and recreate with anon access
DROP POLICY IF EXISTS "Anyone can view about content" ON about_content;

CREATE POLICY "Anyone can view about content"
  ON about_content FOR SELECT
  USING (true);

-- Add public read access to app_settings for video/public settings
DROP POLICY IF EXISTS "Public can view public settings" ON app_settings;

CREATE POLICY "Public can view public settings"
  ON app_settings FOR SELECT
  USING (true);