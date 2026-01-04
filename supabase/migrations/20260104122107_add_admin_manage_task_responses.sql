/*
  # Admin Task Response Management

  Enables admin to manage all task responses:
  
  1. **SELECT**: Admin can view all task responses
  2. **INSERT**: Admin can create task responses
  3. **UPDATE**: Admin can update any task response
  4. **DELETE**: Admin can delete any task response
  
  Security:
  - Only users with 'admin' role can access
  - All operations allowed for admins
*/

-- Admin can view all task responses
CREATE POLICY "Admin can view all task responses"
  ON task_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can create task responses
CREATE POLICY "Admin can create task responses"
  ON task_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update any task response
CREATE POLICY "Admin can update any task response"
  ON task_responses FOR UPDATE
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

-- Admin can delete any task response
CREATE POLICY "Admin can delete any task response"
  ON task_responses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );