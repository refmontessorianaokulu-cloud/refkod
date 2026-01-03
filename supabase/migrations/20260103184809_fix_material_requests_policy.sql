/*
  # Fix Material Requests RLS Policy

  ## Changes
  - Drop existing restrictive INSERT policy
  - Create new policy allowing all authenticated and approved users to create requests
  - This allows staff, teachers, and other roles to submit material requests
  
  ## Security
  - Still requires authentication
  - Still checks that user is approved
  - Still enforces requester_id matches auth.uid()
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Staff and teachers can create material requests" ON material_requests;

-- Create a more inclusive policy for all authenticated approved users
CREATE POLICY "Approved users can create material requests"
  ON material_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.approved = true
    )
  );
