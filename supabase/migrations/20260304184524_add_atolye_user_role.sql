/*
  # Add Atolye User Role to Profiles

  1. Changes
    - Add 'atolye_user' to the profiles role enum constraint
    - This allows users to register as Ref Atölye customers with auto-approval
  
  2. Security
    - Existing RLS policies will apply to atolye_user role
    - Auto-approval for atolye_user registrations (handled in app logic)
*/

-- Add 'atolye_user' to the role enum constraint
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  
  -- Add new constraint with atolye_user included
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'teacher', 'parent', 'staff', 'guidance_counselor', 'guest', 'atolye_user'));
END $$;
