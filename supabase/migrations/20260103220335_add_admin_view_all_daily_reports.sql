/*
  # Admin View All Daily Reports

  Enables admin to view and manage all daily reports:
  
  1. **SELECT**: Admin can view all daily reports
  2. **INSERT**: Admin can create daily reports
  3. **UPDATE**: Admin can update any daily report
  4. **DELETE**: Admin can delete any daily report
  
  Security:
  - Only users with 'admin' role can access
  - All operations allowed for admins
*/

-- Admin can view all daily reports
CREATE POLICY "Admin can view all daily reports"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can create daily reports
CREATE POLICY "Admin can create daily reports"
  ON daily_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update any daily report
CREATE POLICY "Admin can update any daily report"
  ON daily_reports FOR UPDATE
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

-- Admin can delete any daily report
CREATE POLICY "Admin can delete any daily report"
  ON daily_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );