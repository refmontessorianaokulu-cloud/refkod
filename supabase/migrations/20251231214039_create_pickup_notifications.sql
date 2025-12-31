/*
  # Create Pickup Notifications System

  1. New Tables
    - `pickup_notifications`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, references profiles)
      - `child_id` (uuid, references children)
      - `message` (text)
      - `arrival_time` (timestamptz) - Expected arrival time
      - `is_acknowledged` (boolean) - Whether teacher has seen it
      - `acknowledged_at` (timestamptz)
      - `acknowledged_by` (uuid, references profiles)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `pickup_notifications` table
    - Add policy for parents to create notifications for their children
    - Add policy for teachers to view notifications for their assigned children
    - Add policy for admins to view all notifications
    - Add policy for teachers to acknowledge notifications
*/

CREATE TABLE IF NOT EXISTS pickup_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  message text DEFAULT '',
  arrival_time timestamptz,
  is_acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pickup_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can create pickup notifications for their children"
  ON pickup_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_children
      WHERE parent_children.parent_id = auth.uid()
      AND parent_children.child_id = pickup_notifications.child_id
    )
  );

CREATE POLICY "Parents can view their own pickup notifications"
  ON pickup_notifications
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Teachers can view pickup notifications for their children"
  ON pickup_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND EXISTS (
        SELECT 1 FROM teacher_children
        WHERE teacher_children.teacher_id = auth.uid()
        AND teacher_children.child_id = pickup_notifications.child_id
      )
    )
  );

CREATE POLICY "Admins can view all pickup notifications"
  ON pickup_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can acknowledge pickup notifications for their children"
  ON pickup_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND EXISTS (
        SELECT 1 FROM teacher_children
        WHERE teacher_children.teacher_id = auth.uid()
        AND teacher_children.child_id = pickup_notifications.child_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND EXISTS (
        SELECT 1 FROM teacher_children
        WHERE teacher_children.teacher_id = auth.uid()
        AND teacher_children.child_id = pickup_notifications.child_id
      )
    )
  );

CREATE POLICY "Admins can acknowledge any pickup notification"
  ON pickup_notifications
  FOR UPDATE
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