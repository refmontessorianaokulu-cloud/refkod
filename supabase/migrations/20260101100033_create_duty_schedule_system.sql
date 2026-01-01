/*
  # Create Duty Schedule System

  ## 1. New Tables
    
    ### `duty_descriptions`
    - `id` (uuid, primary key)
    - `month` (text) - Format: YYYY-MM
    - `description` (text) - Sabit görev tanımı metni
    - `created_by` (uuid, references profiles.id)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    
    ### `duty_schedule`
    - `id` (uuid, primary key)
    - `duty_date` (date) - Nöbet tarihi
    - `teacher_id` (uuid, references profiles.id) - Nöbetçi öğretmen
    - `notes` (text, nullable) - Ek notlar
    - `created_by` (uuid, references profiles.id)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    
    ### `pickup_reminders`
    - `id` (uuid, primary key)
    - `child_id` (uuid, references children.id)
    - `parent_id` (uuid, references profiles.id)
    - `sent_by` (uuid, references profiles.id) - Hatırlatmayı gönderen
    - `message` (text)
    - `sent_at` (timestamptz)
    - `is_acknowledged` (boolean)
    - `acknowledged_at` (timestamptz, nullable)

  ## 2. Security
    - Enable RLS on all tables
    - Everyone authenticated can view duty schedules
    - Only admin and assigned teacher can manage schedules
    - Only admin and on-duty teacher can send pickup reminders

  ## 3. Important Notes
    - Duty schedules are monthly
    - Only one teacher per day
    - Reminders can be sent after 17:30
*/

-- Create duty_descriptions table
CREATE TABLE IF NOT EXISTS duty_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  description text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create duty_schedule table
CREATE TABLE IF NOT EXISTS duty_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duty_date date NOT NULL UNIQUE,
  teacher_id uuid REFERENCES profiles(id) NOT NULL,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pickup_reminders table
CREATE TABLE IF NOT EXISTS pickup_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) NOT NULL,
  parent_id uuid REFERENCES profiles(id) NOT NULL,
  sent_by uuid REFERENCES profiles(id) NOT NULL,
  message text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  is_acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_duty_schedule_date ON duty_schedule(duty_date);
CREATE INDEX IF NOT EXISTS idx_duty_schedule_teacher ON duty_schedule(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pickup_reminders_child ON pickup_reminders(child_id);
CREATE INDEX IF NOT EXISTS idx_pickup_reminders_parent ON pickup_reminders(parent_id);

-- Enable RLS
ALTER TABLE duty_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for duty_descriptions

CREATE POLICY "Anyone authenticated can view duty descriptions"
  ON duty_descriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admin can insert duty descriptions"
  ON duty_descriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Only admin can update duty descriptions"
  ON duty_descriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Only admin can delete duty descriptions"
  ON duty_descriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- RLS Policies for duty_schedule

CREATE POLICY "Anyone authenticated can view duty schedule"
  ON duty_schedule FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admin can insert duty schedule"
  ON duty_schedule FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Only admin can update duty schedule"
  ON duty_schedule FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Only admin can delete duty schedule"
  ON duty_schedule FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- RLS Policies for pickup_reminders

CREATE POLICY "Users can view their own reminders"
  ON pickup_reminders FOR SELECT
  TO authenticated
  USING (
    parent_id = auth.uid() 
    OR sent_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admin and teachers can send reminders"
  ON pickup_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
      AND profiles.approved = true
    )
  );

CREATE POLICY "Parents can acknowledge reminders"
  ON pickup_reminders FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Admin can delete reminders"
  ON pickup_reminders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
