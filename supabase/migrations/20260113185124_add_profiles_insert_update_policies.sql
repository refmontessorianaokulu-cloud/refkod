/*
  # Add INSERT and UPDATE Policies for Profiles Table

  1. Problem
    - profiles table has RLS ENABLED but only SELECT policy exists
    - Users cannot register (INSERT fails)
    - Users cannot update their profiles (UPDATE fails)
    - Authentication fails with "Profil bulunamadı" error

  2. Solution
    - Add INSERT policy: Allow users to create their own profile during signup
    - Add UPDATE policy: Allow users to update their own profile
    - Add admin UPDATE policy: Allow admins to update any profile (for approvals, role changes)

  3. Security
    - INSERT: Users can only insert a profile with their own auth.uid()
    - UPDATE (users): Users can only update their own profile (id = auth.uid())
    - UPDATE (admins): Admins can update any profile for management purposes
    - All policies are restrictive and follow principle of least privilege

  4. Impact
    - User registration will work (signUp function can insert profiles)
    - User login will work (profiles are readable and exist)
    - Admins can approve users and manage profiles
    - Users can update their own profile information
*/

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );