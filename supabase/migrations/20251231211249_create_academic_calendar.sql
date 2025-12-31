/*
  # Create Academic Calendar Table

  1. New Tables
    - `academic_calendar`
      - `id` (uuid, primary key)
      - `title` (text) - Event title
      - `description` (text) - Event description
      - `event_date` (date) - Date of the event
      - `event_type` (text) - Type of event (holiday, exam, event, meeting, etc.)
      - `created_by` (uuid) - Admin who created the event
      - `created_at` (timestamptz) - When the event was created
      - `updated_at` (timestamptz) - When the event was last updated

  2. Security
    - Enable RLS on `academic_calendar` table
    - Add policy for admins to manage all calendar events
    - Add policy for teachers and parents to view all calendar events
*/

CREATE TABLE IF NOT EXISTS academic_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  event_date date NOT NULL,
  event_type text NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all calendar events"
  ON academic_calendar
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can view calendar events"
  ON academic_calendar
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Parents can view calendar events"
  ON academic_calendar
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

CREATE INDEX IF NOT EXISTS idx_academic_calendar_date ON academic_calendar(event_date);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_type ON academic_calendar(event_type);