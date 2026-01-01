/*
  # Add Arrival and Departure Times to Attendance

  1. Changes
    - Add `arrival_time` column to attendance table
    - Add `departure_time` column to attendance table
    - These columns enable tracking when children arrive and depart from school

  2. Notes
    - arrival_time is set when a child arrives at school
    - departure_time is set when a child leaves school
    - Both columns are optional (nullable) to allow for incomplete records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'arrival_time'
  ) THEN
    ALTER TABLE attendance ADD COLUMN arrival_time timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'departure_time'
  ) THEN
    ALTER TABLE attendance ADD COLUMN departure_time timestamptz;
  END IF;
END $$;
