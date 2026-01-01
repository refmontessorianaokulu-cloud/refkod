/*
  # Add Staff Features and Notification Systems

  1. Updates
    - Add `toilet_attendant` to staff_role types

  2. New Tables
    - `cleaning_requests`
      - `id` (uuid, primary key)
      - `location` (text) - Location that needs cleaning
      - `description` (text) - Description of cleaning needed
      - `urgency` (text) - low, medium, high
      - `status` (text) - pending, in_progress, completed
      - `requested_by` (uuid, references profiles.id)
      - `assigned_to` (uuid, references profiles.id) - Cleaning staff
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `toilet_notifications`
      - `id` (uuid, primary key)
      - `child_id` (uuid, references children.id)
      - `sent_by` (uuid, references profiles.id) - Teacher who sent notification
      - `notes` (text, nullable) - Any special notes
      - `status` (text) - pending, acknowledged, completed
      - `acknowledged_at` (timestamptz, nullable)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all new tables
    - Cleaning requests: viewable by requester, cleaning staff, and admins
    - Toilet notifications: viewable by teachers and toilet attendants
*/

-- Add toilet_attendant to profiles check (drop and recreate constraint if needed)
DO $$
BEGIN
  -- We need to handle the staff_role enum more carefully
  -- First check if we need to update anything
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_staff_role_check'
  ) THEN
    -- Add check constraint if it doesn't exist
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_staff_role_check 
    CHECK (staff_role IS NULL OR staff_role IN ('cook', 'cleaning_staff', 'bus_driver', 'security_staff', 'toilet_attendant', 'other'));
  ELSE
    -- Drop and recreate with new value
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_staff_role_check;
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_staff_role_check 
    CHECK (staff_role IS NULL OR staff_role IN ('cook', 'cleaning_staff', 'bus_driver', 'security_staff', 'toilet_attendant', 'other'));
  END IF;
END $$;

-- Create cleaning_requests table
CREATE TABLE IF NOT EXISTS cleaning_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  description text NOT NULL,
  urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  requested_by uuid NOT NULL REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_status ON cleaning_requests(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_assigned_to ON cleaning_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_created_at ON cleaning_requests(created_at DESC);

-- Enable RLS
ALTER TABLE cleaning_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cleaning_requests
CREATE POLICY "Requester can view own requests"
  ON cleaning_requests FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Cleaning staff can view assigned requests"
  ON cleaning_requests FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.staff_role = 'cleaning_staff'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Admin can view all requests"
  ON cleaning_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Teachers, admin, guidance counselor can create requests"
  ON cleaning_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher', 'guidance_counselor')
      AND profiles.approved = true
    )
  );

CREATE POLICY "Cleaning staff and admin can update requests"
  ON cleaning_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.staff_role = 'cleaning_staff'
      )
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.staff_role = 'cleaning_staff'
      )
      AND profiles.approved = true
    )
  );

CREATE POLICY "Admin can delete requests"
  ON cleaning_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Create toilet_notifications table
CREATE TABLE IF NOT EXISTS toilet_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  sent_by uuid NOT NULL REFERENCES profiles(id),
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
  acknowledged_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_toilet_notifications_status ON toilet_notifications(status);
CREATE INDEX IF NOT EXISTS idx_toilet_notifications_created_at ON toilet_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_toilet_notifications_child_id ON toilet_notifications(child_id);

-- Enable RLS
ALTER TABLE toilet_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for toilet_notifications
CREATE POLICY "Teachers can view notifications"
  ON toilet_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Toilet attendants can view notifications"
  ON toilet_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.staff_role = 'toilet_attendant'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Admin can view all notifications"
  ON toilet_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Teachers can create notifications"
  ON toilet_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    sent_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Toilet attendants can update notifications"
  ON toilet_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.staff_role = 'toilet_attendant'
        OR profiles.role = 'admin'
      )
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.staff_role = 'toilet_attendant'
        OR profiles.role = 'admin'
      )
      AND profiles.approved = true
    )
  );

CREATE POLICY "Admin can delete notifications"
  ON toilet_notifications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Update monthly_menu policies to allow cooks to manage menu
CREATE POLICY "Cooks can insert menu"
  ON monthly_menu FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.staff_role = 'cook'
      )
      AND profiles.approved = true
    )
  );

CREATE POLICY "Cooks can update menu"
  ON monthly_menu FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.staff_role = 'cook'
      )
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.staff_role = 'cook'
      )
      AND profiles.approved = true
    )
  );

-- Update storage policies for menu photos to allow cooks
CREATE POLICY "Cooks can upload menu photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-photos'
    AND (storage.foldername(name))[1] = 'meals'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.staff_role = 'cook'
      )
      AND profiles.approved = true
    )
  );

CREATE POLICY "Cooks can update menu photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'menu-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.staff_role = 'cook'
      )
    )
  );

CREATE POLICY "Cooks can delete menu photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.staff_role = 'cook'
      )
    )
  );
