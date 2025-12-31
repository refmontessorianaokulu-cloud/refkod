/*
  # Add Teacher Policies for Parent-Children Relationships

  1. Changes
    - Add INSERT policy for teachers to create parent-child relationships
    - Add UPDATE policy for teachers to modify relationships
    - Add DELETE policy for teachers to remove relationships
  
  2. Security
    - Teachers can now manage parent-child relationships
    - This allows teachers to assign children to parents
    - Maintains security by requiring authentication and teacher role
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can insert parent-child relationships" ON parent_children;
DROP POLICY IF EXISTS "Teachers can update parent-child relationships" ON parent_children;
DROP POLICY IF EXISTS "Teachers can delete parent-child relationships" ON parent_children;

-- Allow teachers to insert parent-child relationships
CREATE POLICY "Teachers can insert parent-child relationships"
  ON parent_children
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Allow teachers to update parent-child relationships
CREATE POLICY "Teachers can update parent-child relationships"
  ON parent_children
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

-- Allow teachers to delete parent-child relationships
CREATE POLICY "Teachers can delete parent-child relationships"
  ON parent_children
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );