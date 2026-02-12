/*
  # Add Media Support to Play Group Sessions

  ## Overview
  This migration adds media/image support to play group sessions so admins can upload session images
  that will be displayed in the calendar view for parents.

  ## Changes
  
  1. Storage
     - Create `play_group_media` bucket for storing session images
     - Set up public access for the bucket
     - Add RLS policies for upload/delete by admins

  2. Table Changes
     - Add `media_urls` column to `play_group_sessions` table (text array)
  
  ## Security
  - Public read access for viewing images
  - Admin-only write/delete access
*/

-- Add media_urls column to play_group_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'play_group_sessions' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE play_group_sessions ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;

-- Create storage bucket for play group media
INSERT INTO storage.buckets (id, name, public)
VALUES ('play_group_media', 'play_group_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for play group media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload play group media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update play group media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete play group media" ON storage.objects;

-- RLS Policies for play_group_media bucket
CREATE POLICY "Public read access for play group media"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'play_group_media');

CREATE POLICY "Admins can upload play group media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'play_group_media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update play group media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'play_group_media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'play_group_media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete play group media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'play_group_media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );