/*
  # Create Announcement Banners System

  1. New Tables
    - `announcement_banners`
      - `id` (uuid, primary key)
      - `message_tr` (text) - Turkish announcement message
      - `message_en` (text) - English announcement message
      - `link_url` (text, optional) - URL to link to
      - `link_text_tr` (text, optional) - Turkish link button text
      - `link_text_en` (text, optional) - English link button text
      - `is_active` (boolean) - Whether announcement is active
      - `display_order` (integer) - Order in which to display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `announcement_banners` table
    - Add policy for public read access to active announcements
    - Add policy for admin to manage all announcements
*/

CREATE TABLE IF NOT EXISTS announcement_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_tr text NOT NULL,
  message_en text NOT NULL,
  link_url text,
  link_text_tr text,
  link_text_en text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcement_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcement banners"
  ON announcement_banners
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all announcement banners"
  ON announcement_banners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert announcement banners"
  ON announcement_banners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update announcement banners"
  ON announcement_banners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete announcement banners"
  ON announcement_banners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_announcement_banners_active_order 
  ON announcement_banners(is_active, display_order) 
  WHERE is_active = true;