/*
  # Add User Approval Status

  1. Changes
    - Add `approved` column to `profiles` table (boolean, default false)
    - Add `approved_at` column to `profiles` table (timestamp, nullable)
    - Add `approved_by` column to `profiles` table (uuid, references admin user)
    
  2. Notes
    - Admin users (role='admin') are automatically approved
    - Teachers and parents require approval before they can use the system
    - The approved_by field tracks which admin approved the user
*/

-- Add approval columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approved'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Set all existing admin users as approved
UPDATE profiles SET approved = true, approved_at = now() WHERE role = 'admin' AND approved = false;

-- Create index for faster queries on unapproved users
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(approved) WHERE approved = false;