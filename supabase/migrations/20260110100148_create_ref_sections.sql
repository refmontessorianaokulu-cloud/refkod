/*
  # Create Ref Sections System
  
  1. New Tables
    - `ref_sections`
      - `id` (uuid, primary key)
      - `section_type` (text) - 'ref_akademi', 'ref_danismanlik', 'ref_atolye'
      - `title` (text) - Section title
      - `content` (text) - Section content/description
      - `media_urls` (text[]) - Array of media URLs
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, foreign key to profiles)
  
  2. Security
    - Enable RLS on `ref_sections` table
    - Add policy for authenticated users to read all sections
    - Add policy for admins to insert, update, and delete sections
*/

CREATE TABLE IF NOT EXISTS ref_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type text NOT NULL CHECK (section_type IN ('ref_akademi', 'ref_danismanlik', 'ref_atolye')),
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  media_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

ALTER TABLE ref_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ref sections"
  ON ref_sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert ref sections"
  ON ref_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update ref sections"
  ON ref_sections FOR UPDATE
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

CREATE POLICY "Admins can delete ref sections"
  ON ref_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_ref_sections_type ON ref_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_ref_sections_created_by ON ref_sections(created_by);