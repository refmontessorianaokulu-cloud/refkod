/*
  # Admin Task Responses Management
  
  This migration adds full admin control over task responses.
  
  1. **Task Responses Policies**
    - Admin can UPDATE task responses
    - Admin can DELETE task responses
  
  Admins now have complete control over the entire task assignment system including responses.
*/

-- Admin can update any task response
CREATE POLICY "Admin can update task responses"
  ON task_responses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Admin can delete any task response
CREATE POLICY "Admin can delete task responses"
  ON task_responses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );