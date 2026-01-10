/*
  # Add Video Settings to App Settings Table

  1. Changes
    - Add `login_video_url` (text, nullable) - URL of the login video
    - Add `login_video_active` (boolean, default false) - Whether video is enabled
    - Add `login_video_poster` (text, nullable) - URL of the video poster/thumbnail
    
  2. Data
    - Ensure at least one row exists in app_settings for storing video settings
    
  3. Notes
    - These columns are added to support login page video background feature
    - The table uses both key-value pairs AND specific columns for different settings
    - A default row is inserted if table is empty to avoid .single() errors
*/

-- Add video-related columns to app_settings table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'login_video_url'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN login_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'login_video_active'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN login_video_active boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'login_video_poster'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN login_video_poster text;
  END IF;
END $$;

-- Insert a default row if table is empty (to support .single() queries)
INSERT INTO app_settings (key, value, description, login_video_active)
SELECT 'default_settings', '', 'Default application settings row', false
WHERE NOT EXISTS (SELECT 1 FROM app_settings LIMIT 1);