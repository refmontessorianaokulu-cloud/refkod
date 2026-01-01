/*
  # Add Yearly Payment Types to Constraint

  1. Changes
    - Drop existing payment_type check constraint
    - Add new check constraint with 'yearly_education' and 'yearly_meal' options
    
  2. Notes
    - This allows tracking of yearly payment options separately from monthly options
    - Existing data remains unchanged
    - Valid values: 'education', 'stationery', 'meal', 'yearly_education', 'yearly_meal'
*/

DO $$ 
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_type_check' 
    AND table_name = 'tuition_fees'
  ) THEN
    ALTER TABLE tuition_fees DROP CONSTRAINT payment_type_check;
  END IF;

  -- Add the new constraint with yearly options
  ALTER TABLE tuition_fees ADD CONSTRAINT payment_type_check 
    CHECK (payment_type IN ('education', 'stationery', 'meal', 'yearly_education', 'yearly_meal'));
END $$;