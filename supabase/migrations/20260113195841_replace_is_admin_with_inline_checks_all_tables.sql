/*
  # Replace is_admin() Function Calls with Inline Checks - All Tables

  1. Problem
    - Multiple tables use is_admin() function in RLS policies
    - This causes auth context issues when called from client
    - Admin users cannot perform operations they should have access to

  2. Solution
    - Replace all is_admin() calls with direct EXISTS checks
    - Ensures consistent behavior across all tables
    - More transparent and reliable policy implementation

  3. Tables Updated
    - academic_periods
    - children (select, insert, update, delete policies)
*/

-- =============================================
-- ACADEMIC_PERIODS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admin manage academic periods" ON academic_periods;

CREATE POLICY "Admin can select academic periods"
  ON academic_periods FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert academic periods"
  ON academic_periods FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update academic periods"
  ON academic_periods FOR UPDATE
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

CREATE POLICY "Admin can delete academic periods"
  ON academic_periods FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- CHILDREN TABLE
-- =============================================

DROP POLICY IF EXISTS "Admin view all children" ON children;
DROP POLICY IF EXISTS "Admin insert children" ON children;
DROP POLICY IF EXISTS "Admin update children" ON children;
DROP POLICY IF EXISTS "Admin delete children" ON children;

CREATE POLICY "Admin view all children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin insert children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin update children"
  ON children FOR UPDATE
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

CREATE POLICY "Admin delete children"
  ON children FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
