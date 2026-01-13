/*
  # Fix Admin Access to Periodic Reports - Final Solution

  1. Problem
    - Admin cannot view periodic development reports in UI
    - is_admin() function causes auth context issues
    - Need more reliable policy implementation

  2. Solution
    - Replace is_admin() function calls with direct EXISTS checks
    - This avoids SECURITY DEFINER auth context issues
    - More transparent and debuggable policies

  3. Changes
    - Drop and recreate all admin policies for periodic_development_reports
    - Use inline role checks instead of function calls
*/

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admin can view all periodic reports" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admin can create any report" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admin can update any report" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admin can delete any report" ON periodic_development_reports;

-- Recreate admin policies with inline role checks
CREATE POLICY "Admin can view all periodic reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can create any report"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update any report"
  ON periodic_development_reports FOR UPDATE
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

CREATE POLICY "Admin can delete any report"
  ON periodic_development_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
