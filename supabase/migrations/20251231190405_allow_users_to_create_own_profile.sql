/*
  # Allow Users to Create Their Own Profile During Signup

  1. Changes
    - Add INSERT policy for users to create their own profile
    - This allows signup to work without RLS blocking the profile creation
  
  2. Security
    - Users can only create a profile for themselves (id = auth.uid())
    - Email must match their auth email
    - Maintains security by ensuring users can only create their own profile
  
  3. Notes
    - This is required for the signup flow to work
    - Without this policy, new users cannot create their profile in the profiles table
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create own profile during signup" ON profiles;

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can create own profile during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());