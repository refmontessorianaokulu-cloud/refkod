/*
  # Add Payment Types to Tuition Fees

  1. Changes
    - Add `payment_type` column to tuition_fees table
      - Options: 'education' (Eğitim Ödemesi), 'stationery' (Kırtasiye), 'meal' (Yemek)
      - Default: 'education'
    - Update month field to be nullable (for one-time payments like stationery)
    
  2. Notes
    - Education payments are monthly recurring payments
    - Stationery payments are yearly one-time payments
    - Meal payments are monthly recurring payments
    - For stationery, month field will be null or 'Yıllık'
*/

-- Add payment_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tuition_fees' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE tuition_fees ADD COLUMN payment_type text DEFAULT 'education' NOT NULL;
    ALTER TABLE tuition_fees ADD CONSTRAINT payment_type_check CHECK (payment_type IN ('education', 'stationery', 'meal'));
  END IF;
END $$;

-- Make month nullable for one-time payments
DO $$
BEGIN
  ALTER TABLE tuition_fees ALTER COLUMN month DROP NOT NULL;
END $$;

-- Update existing records to have 'education' as payment type if not set
UPDATE tuition_fees SET payment_type = 'education' WHERE payment_type IS NULL;
