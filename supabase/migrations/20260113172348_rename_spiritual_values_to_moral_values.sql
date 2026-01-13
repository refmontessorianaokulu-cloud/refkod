/*
  # Rename spiritual_values to moral_values

  1. Changes
    - Rename column `spiritual_values` → `moral_values` in periodic_development_reports table

  2. Reason
    - Fixing schema mismatch between database and application code
    - Code uses `moral_values` but database has `spiritual_values`

  3. Safety
    - Uses IF EXISTS checks to prevent errors
    - Preserves all existing data during rename
*/

-- Rename spiritual_values to moral_values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodic_development_reports' AND column_name = 'spiritual_values'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodic_development_reports' AND column_name = 'moral_values'
  ) THEN
    ALTER TABLE periodic_development_reports
    RENAME COLUMN spiritual_values TO moral_values;
  END IF;
END $$;