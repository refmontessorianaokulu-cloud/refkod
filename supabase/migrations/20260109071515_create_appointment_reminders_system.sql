/*
  # Create Appointment Reminders System

  1. New Tables
    - `appointment_reminders`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, references appointments)
      - `admin_id` (uuid, references profiles) - admin who sent the reminder
      - `recipient_id` (uuid, references profiles) - who receives the reminder
      - `recipient_type` (text) - 'parent', 'target', or 'both'
      - `message` (text) - reminder message
      - `sent_at` (timestamptz)
      - `read` (boolean) - whether the reminder was read
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on appointment_reminders table
    - Admin can insert reminders
    - Admin can view all reminders
    - Users can view their own reminders
    - Users can mark their reminders as read

  3. Important Notes
    - Reminders are sent by admins to appointment participants
    - Each reminder tracks when it was sent and if it was read
    - Recipients can view reminders on their dashboard
*/

-- Create appointment_reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('parent', 'target', 'both')),
  message text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Admin can insert reminders
CREATE POLICY "Admin can create reminders"
  ON appointment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Admin can view all reminders
CREATE POLICY "Admin can view all reminders"
  ON appointment_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Users can view their own reminders
CREATE POLICY "Users can view their reminders"
  ON appointment_reminders FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.approved = true
    )
  );

-- Users can mark their reminders as read
CREATE POLICY "Users can update their reminders"
  ON appointment_reminders FOR UPDATE
  TO authenticated
  USING (
    recipient_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    recipient_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.approved = true
    )
  );

-- Admin can update all reminders
CREATE POLICY "Admin can update all reminders"
  ON appointment_reminders FOR UPDATE
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_recipient_id ON appointment_reminders(recipient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_read ON appointment_reminders(read);
