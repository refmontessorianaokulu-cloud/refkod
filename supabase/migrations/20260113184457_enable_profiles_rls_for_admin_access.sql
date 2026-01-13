/*
  # Enable Profiles RLS to Fix Admin Access to Periodic Reports

  1. Root Cause
    - profiles table has RLS DISABLED (rowsecurity = false)
    - Admin SELECT policy on periodic_development_reports uses a subquery to check role from profiles
    - When RLS is disabled on profiles, the subquery in other tables' RLS policies fails
    - This causes admin users to see ZERO periodic_development_reports (Toplam Rapor: 0)

  2. Solution
    - ENABLE RLS on profiles table
    - Add a general authenticated read policy for profiles
    - This allows all authenticated users to read profile data
    - Existing specific policies remain intact for additional granular control

  3. Security
    - This is SAFE because:
      * Access control for periodic_development_reports is enforced by its own RLS policies
      * Users need profile data to show teacher names, etc. in the UI
      * The authenticated read policy only allows reading, not writing
      * Existing policies provide additional role-based filtering

  4. Impact
    - Admin users can now view all periodic development reports
    - Other roles (teacher, parent, guidance_counselor) continue to work correctly
    - All subqueries in RLS policies that reference profiles will work properly
*/

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add general authenticated read policy
-- This allows all authenticated users to read profile data
-- which is necessary for RLS policies on other tables that query profiles
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
