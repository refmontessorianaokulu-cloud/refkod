
/*
  # Fix field_trip_consents for parent attendance (for_parent events)

  ## Problem
  When a field trip is marked as `for_parent = true`, the parent submits a personal
  attendance response with `child_id = null`. This fails because:
  1. `child_id` column is NOT NULL
  2. INSERT RLS policy requires `child_id` to exist in `parent_children` table
  3. Unique index on `(field_trip_id, child_id)` doesn't handle nulls correctly

  ## Changes
  1. Make `child_id` nullable to support parent-only responses
  2. Drop and recreate the unique index to handle the two cases:
     - Per-child consent: unique on (field_trip_id, child_id) where child_id is not null
     - Per-parent consent: unique on (field_trip_id, parent_id) where child_id is null
  3. Fix INSERT RLS policy to allow inserts when child_id IS NULL (parent-only events)
*/

-- 1. Make child_id nullable
ALTER TABLE field_trip_consents ALTER COLUMN child_id DROP NOT NULL;

-- 2. Drop old unique constraint
ALTER TABLE field_trip_consents DROP CONSTRAINT IF EXISTS field_trip_consents_field_trip_id_child_id_key;

-- 3. Add two partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS field_trip_consents_per_child_unique
  ON field_trip_consents (field_trip_id, child_id)
  WHERE child_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS field_trip_consents_per_parent_unique
  ON field_trip_consents (field_trip_id, parent_id)
  WHERE child_id IS NULL;

-- 4. Fix INSERT RLS policy to allow parent-only inserts
DROP POLICY IF EXISTS "Parents can insert field trip consents for their children" ON field_trip_consents;

CREATE POLICY "Parents can insert field trip consents"
  ON field_trip_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'parent'
    )
    AND (
      child_id IS NULL
      OR EXISTS (
        SELECT 1 FROM parent_children
        WHERE parent_children.parent_id = auth.uid()
          AND parent_children.child_id = field_trip_consents.child_id
      )
    )
  );
