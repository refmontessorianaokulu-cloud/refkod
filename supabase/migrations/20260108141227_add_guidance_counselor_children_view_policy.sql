/*
  # Add Guidance Counselor Children View Policy

  1. Changes
    - Add SELECT policy for guidance_counselor role on children table
    
  2. Security
    - Guidance counselors can now view all children in the system
    - This enables them to select children when creating guidance reports
    - Policy checks user role from profiles table
*/

-- Add policy for guidance counselors to view all children
CREATE POLICY "Guidance counselors can view all children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
  );
