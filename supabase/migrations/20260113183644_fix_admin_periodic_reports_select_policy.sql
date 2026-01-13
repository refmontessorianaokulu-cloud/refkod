/*
  # Fix Admin SELECT Policy for Periodic Development Reports

  1. Issue
    - Admin users cannot view periodic development reports
    - Old SELECT policy uses direct role check which causes RLS recursion issues

  2. Solution
    - Drop old "Admins can view all reports" policy
    - Create new policy using EXISTS pattern (consistent with UPDATE policy)

  3. Security
    - Admin users can view all periodic development reports
    - Uses EXISTS pattern to avoid RLS recursion issues
*/

-- Drop old admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all reports" ON periodic_development_reports;

-- Create new admin SELECT policy with EXISTS pattern
CREATE POLICY "Admins can view all periodic reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
