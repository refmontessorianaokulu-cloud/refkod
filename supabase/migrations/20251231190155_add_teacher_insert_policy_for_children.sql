/*
  # Add Teacher Policies for Children Table

  1. Changes
    - Add INSERT policy for teachers to add children
    - Add UPDATE policy for teachers to update children
    - Add DELETE policy for teachers to delete children
  
  2. Security
    - Teachers can now perform all CRUD operations on children table
    - This allows teachers to add new children to the system
    - Maintains security by requiring authentication and teacher role
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can insert children" ON children;
DROP POLICY IF EXISTS "Teachers can update children" ON children;
DROP POLICY IF EXISTS "Teachers can delete children" ON children;

-- Allow teachers to insert children
CREATE POLICY "Teachers can insert children"
  ON children
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Allow teachers to update children
CREATE POLICY "Teachers can update children"
  ON children
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Allow teachers to delete children
CREATE POLICY "Teachers can delete children"
  ON children
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );