/*
  # Add guest_name column to orders table

  1. Changes
    - Add `guest_name` column to `orders` table (TEXT, nullable)
    - This field stores the full name of guest users who place orders without authentication
  
  2. Purpose
    - Enable guest order functionality by storing guest customer name
    - Works alongside existing `guest_email` and `guest_phone` fields
  
  3. Notes
    - Column is nullable to maintain compatibility with authenticated user orders
    - For authenticated users, `user_id` will be set and guest fields will be NULL
    - For guest users, `user_id` will be NULL and guest fields will be populated
*/

-- Add guest_name column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN guest_name TEXT;
  END IF;
END $$;