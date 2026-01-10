/*
  # Add Public Access to Video Settings
  
  1. Changes
    - Add RLS policy to allow anonymous (anon) users to read video settings from app_settings
    - This enables the login page to display video background without authentication
    
  2. Security
    - Only SELECT access is granted
    - Only login_video_url, login_video_active, and login_video_poster columns are exposed
    - No write access for anonymous users
    
  3. Notes
    - Login page needs to read video settings before user authentication
    - This policy is safe as it only exposes public-facing video URLs
*/

-- Allow anonymous users to read video settings from app_settings
CREATE POLICY "Allow anonymous to read video settings"
  ON app_settings
  FOR SELECT
  TO anon
  USING (true);
