/*
  # Add Detailed Address Fields to Profiles

  1. Changes
    - Add `district` column to profiles table (İlçe)
    - Add `neighborhood` column to profiles table (Mahalle)
    - Add `street` column to profiles table (Sokak)
    - Add `building_no` column to profiles table (Bina No)
    - Add `apartment_no` column to profiles table (Daire No)

  2. Purpose
    - Allow atolye users to save detailed address information in their profile
    - Auto-populate address fields during checkout
    - Improve user experience by reducing form filling
*/

-- Add detailed address columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'district'
  ) THEN
    ALTER TABLE profiles ADD COLUMN district text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE profiles ADD COLUMN neighborhood text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'street'
  ) THEN
    ALTER TABLE profiles ADD COLUMN street text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'building_no'
  ) THEN
    ALTER TABLE profiles ADD COLUMN building_no text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'apartment_no'
  ) THEN
    ALTER TABLE profiles ADD COLUMN apartment_no text;
  END IF;
END $$;
