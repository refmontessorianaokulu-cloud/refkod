/*
  # Add photo URL field to children table

  1. Changes
    - Add `photo_url` column to `children` table to store child profile photos
    - This field is optional and stores the URL/path to the child's photo
  
  2. Notes
    - Photo URL will be used to display child photos in all dashboards
    - Field is nullable to allow children without photos
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE children ADD COLUMN photo_url text;
  END IF;
END $$;