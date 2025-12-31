/*
  # Allow Teachers to Manage Their Own Child Relationships

  1. Changes
    - Add INSERT policy for teachers to add themselves to children
    - Add DELETE policy for teachers to remove themselves from children
    - Teachers can only manage their own relationships (where teacher_id = auth.uid())
  
  2. Security
    - Teachers can assign themselves to children
    - Teachers can only modify relationships where they are the teacher
    - Admins retain full control over all relationships
    - This allows teachers to add new children and automatically assign them to themselves
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Teachers can manage own relationships" ON teacher_children;

-- Allow teachers to insert and delete their own relationships
CREATE POLICY "Teachers can manage own relationships"
  ON teacher_children
  FOR ALL
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  )
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );