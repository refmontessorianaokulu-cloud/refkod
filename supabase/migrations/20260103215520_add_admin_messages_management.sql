/*
  # Admin Messages Management

  Enables admin to view and manage all messages:
  
  1. **SELECT**: Admin can view all messages
  2. **INSERT**: Admin can send messages on behalf of anyone
  3. **UPDATE**: Admin can update any message
  4. **DELETE**: Admin can delete any message
  
  Security:
  - Only users with 'admin' role can access
  - All operations allowed for admins
*/

-- Admin can view all messages
CREATE POLICY "Admin can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can send messages as anyone
CREATE POLICY "Admin can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update any message
CREATE POLICY "Admin can update any message"
  ON messages FOR UPDATE
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

-- Admin can delete any message
CREATE POLICY "Admin can delete any message"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );