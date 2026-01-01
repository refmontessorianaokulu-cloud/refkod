/*
  # Add Media Support to Meal and Sleep Logs

  1. Changes
    - Add `media_urls` column to `meal_logs` table
      - Array of text to store multiple photo/video URLs
      - Nullable with empty array default
    - Add `media_urls` column to `sleep_logs` table
      - Array of text to store multiple photo/video URLs
      - Nullable with empty array default

  2. Purpose
    - Allow teachers to attach photos and videos to meal records
    - Allow teachers to attach photos and videos to sleep records
    - Store multiple media files per record
*/

-- Add media_urls to meal_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_logs' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE meal_logs ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;

-- Add media_urls to sleep_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sleep_logs' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE sleep_logs ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;