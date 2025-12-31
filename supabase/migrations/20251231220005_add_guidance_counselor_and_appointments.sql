/*
  # Add Guidance Counselor Role and Appointments System

  1. Changes to Existing Tables
    - Update role check constraint in profiles to include 'guidance_counselor'
  
  2. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, references profiles)
      - `target_id` (uuid, references profiles) - teacher, admin, or guidance counselor
      - `child_id` (uuid, references children) - optional
      - `subject` (text)
      - `message` (text)
      - `status` (text) - pending, approved, rejected, completed
      - `appointment_date` (timestamptz) - nullable, set when approved
      - `response_message` (text) - nullable
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `group_messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `recipient_group` (text) - 'all_parents', 'all_teachers', 'all_admins', or specific user IDs
      - `subject` (text)
      - `message` (text)
      - `created_at` (timestamptz)
  
  3. Security
    - Enable RLS on all new tables
    - Add policies for parents to create appointments
    - Add policies for target users to view and respond to appointments
    - Add policies for guidance counselors to send group messages
    - Add policies for users to view messages sent to them
*/

-- Drop and recreate role constraint to include guidance_counselor
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'teacher', 'parent', 'guidance_counselor'));

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  appointment_date timestamptz,
  response_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_group text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Appointments policies

-- Parents can create appointments
CREATE POLICY "Parents can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
      AND profiles.approved = true
    )
  );

-- Parents can view their own appointments
CREATE POLICY "Parents can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
      AND profiles.approved = true
    )
  );

-- Target users can view appointments directed to them
CREATE POLICY "Target users can view their appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = target_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'guidance_counselor')
      AND profiles.approved = true
    )
  );

-- Target users can update appointments directed to them
CREATE POLICY "Target users can update their appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = target_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'guidance_counselor')
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    auth.uid() = target_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'guidance_counselor')
      AND profiles.approved = true
    )
  );

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Group messages policies

-- Guidance counselors can create group messages
CREATE POLICY "Guidance counselors can create group messages"
  ON group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
      AND profiles.approved = true
    )
  );

-- Guidance counselors can view their own sent messages
CREATE POLICY "Guidance counselors can view own messages"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
      AND profiles.approved = true
    )
  );

-- Users can view messages sent to their group
CREATE POLICY "Users can view messages sent to their group"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.approved = true
      AND (
        (recipient_group = 'all_parents' AND profiles.role = 'parent') OR
        (recipient_group = 'all_teachers' AND profiles.role = 'teacher') OR
        (recipient_group = 'all_admins' AND profiles.role = 'admin') OR
        recipient_group = auth.uid()::text
      )
    )
  );

-- Create updated_at trigger for appointments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_parent_id ON appointments(parent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_target_id ON appointments(target_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_group_messages_recipient_group ON group_messages(recipient_group);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON group_messages(sender_id);