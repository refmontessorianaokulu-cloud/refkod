/*
  # Add Storage Policies for Child Photos Bucket

  1. Changes
    - Add INSERT policy for admins and teachers to upload photos
    - Add SELECT policy for authenticated users to view photos
    - Add UPDATE policy for admins and teachers to update photos
    - Add DELETE policy for admins and teachers to delete photos
  
  2. Security
    - Only admins and teachers can upload, update, and delete photos
    - All authenticated users can view photos
    - Maintains security while allowing necessary operations
  
  3. Notes
    - These policies apply to the storage.objects table for the child-photos bucket
    - The bucket is public but still requires RLS policies for modifications
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins and teachers can upload child photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view child photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and teachers can update child photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and teachers can delete child photos" ON storage.objects;

-- Allow admins and teachers to upload photos
CREATE POLICY "Admins and teachers can upload child photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'child-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Allow authenticated users to view photos
CREATE POLICY "Authenticated users can view child photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'child-photos');

-- Allow admins and teachers to update photos
CREATE POLICY "Admins and teachers can update child photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    bucket_id = 'child-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Allow admins and teachers to delete photos
CREATE POLICY "Admins and teachers can delete child photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'child-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );