/*
  # Add program_type and for_parent to field_trips

  ## Changes
  - Adds `program_type` column to `field_trips` table
    - Type: text with NOT NULL default 'gezi'
    - Stores the type of program: gezi, ziyaret, seminer, atolye, workshop, konferans, diger
  - Adds `for_parent` column to `field_trips` table
    - Type: boolean, default false
    - When true, the consent form targets the parent themselves (not a child)
    - Parent consent options become "Katılacağım" / "Katılamayacağım" instead of child-based options

  ## Notes
  - Existing rows will get default values (program_type='gezi', for_parent=false)
  - No existing data is lost
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'field_trips' AND column_name = 'program_type'
  ) THEN
    ALTER TABLE field_trips ADD COLUMN program_type text NOT NULL DEFAULT 'gezi';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'field_trips' AND column_name = 'for_parent'
  ) THEN
    ALTER TABLE field_trips ADD COLUMN for_parent boolean NOT NULL DEFAULT false;
  END IF;
END $$;
