/*
  # Create Manual Instagram Posts System

  1. New Tables
    - `instagram_posts`
      - `id` (uuid, primary key)
      - `image_url` (text) - URL of the uploaded image
      - `caption` (text, nullable) - Post description/caption
      - `post_url` (text, nullable) - Link to actual Instagram post
      - `posted_date` (date) - Date of the post
      - `display_order` (integer) - Order of display (lower = first)
      - `is_active` (boolean) - Whether the post is visible
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Create `instagram-images` bucket for storing post images
    - Public read access
    - Admin-only upload access

  3. Security
    - Enable RLS on instagram_posts
    - Public read access for active posts
    - Admin-only write access

  4. Features
    - Manual Instagram post management
    - No API required
    - Full admin control over displayed posts
*/

-- Create instagram_posts table
CREATE TABLE IF NOT EXISTS instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text DEFAULT '',
  post_url text DEFAULT '',
  posted_date date NOT NULL DEFAULT CURRENT_DATE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view active posts
CREATE POLICY "Anyone can view active instagram posts"
  ON instagram_posts FOR SELECT
  USING (is_active = true);

-- Only admins can insert posts
CREATE POLICY "Only admins can insert instagram posts"
  ON instagram_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update posts
CREATE POLICY "Only admins can update instagram posts"
  ON instagram_posts FOR UPDATE
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

-- Only admins can delete posts
CREATE POLICY "Only admins can delete instagram posts"
  ON instagram_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create storage bucket for instagram images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instagram-images',
  'instagram-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for instagram-images bucket
CREATE POLICY "Public can view instagram images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'instagram-images');

CREATE POLICY "Admins can upload instagram images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'instagram-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update instagram images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'instagram-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete instagram images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'instagram-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_instagram_posts_updated_at ON instagram_posts;
CREATE TRIGGER update_instagram_posts_updated_at
  BEFORE UPDATE ON instagram_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_instagram_posts_active_order
  ON instagram_posts(is_active, display_order, posted_date DESC)
  WHERE is_active = true;