/*
  # Fix Notification Policies for All Roles
  
  ## Problem
  Teachers and other staff cannot send announcements and group messages properly.
  
  ## Solution
  Update policies to allow:
  1. Teachers, guidance counselors, and admins can create announcements
  2. Teachers, guidance counselors, and admins can create group messages
  3. All relevant users can view these notifications
  
  ## Changes
  1. Update announcement policies to include teachers and guidance counselors
  2. Update group message policies to include teachers and admins
  3. Ensure proper viewing permissions for all roles
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Teachers can create announcements for their parents" ON announcements;
DROP POLICY IF EXISTS "Guidance counselors can create group messages" ON group_messages;
DROP POLICY IF EXISTS "Guidance counselors can view own messages" ON group_messages;

-- Allow teachers, guidance counselors, and admins to create announcements
CREATE POLICY "Teachers, counselors, and admins can create announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'guidance_counselor', 'admin')
      AND profiles.approved = true
    )
    AND created_by = auth.uid()
  );

-- Allow teachers, guidance counselors, and admins to create group messages
CREATE POLICY "Teachers, counselors, and admins can create group messages"
  ON group_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'guidance_counselor', 'admin')
      AND profiles.approved = true
    )
    AND sender_id = auth.uid()
  );

-- Allow teachers, counselors, and admins to view all group messages they sent
CREATE POLICY "Teachers, counselors, and admins can view own group messages"
  ON group_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'guidance_counselor', 'admin')
      AND profiles.approved = true
    )
    AND sender_id = auth.uid()
  );

-- Staff can view relevant announcements
CREATE POLICY "Staff can view relevant announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'staff'
      AND profiles.approved = true
    )
    AND target_audience IN ('all', 'teachers')
  );

-- Guidance counselors can view all announcements
CREATE POLICY "Guidance counselors can view all announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
      AND profiles.approved = true
    )
  );
