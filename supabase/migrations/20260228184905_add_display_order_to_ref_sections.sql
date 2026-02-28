/*
  # Add display order to ref_sections

  1. Changes
    - Add `display_order` column to `ref_sections` table
    - Set default values for existing records based on creation date
    - Add index for better query performance

  2. Security
    - No RLS changes needed
*/

-- Add display_order column
ALTER TABLE ref_sections ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Set display_order based on created_at for existing records
UPDATE ref_sections 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY section_type ORDER BY created_at) as row_num
  FROM ref_sections
) AS subquery
WHERE ref_sections.id = subquery.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ref_sections_display_order ON ref_sections(section_type, display_order);