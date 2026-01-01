/*
  # Create Material Requests System

  1. New Tables
    - `material_requests`
      - `id` (uuid, primary key)
      - `requester_id` (uuid, foreign key to profiles)
      - `request_type` (text) - 'supply' for staff (cook, cleaning), 'material' for teachers
      - `title` (text) - Brief title of the request
      - `description` (text) - Detailed description
      - `quantity` (text) - Quantity needed (optional)
      - `priority` (text) - 'low', 'medium', 'high', 'urgent'
      - `status` (text) - 'pending', 'approved', 'rejected', 'completed'
      - `admin_notes` (text) - Admin response/notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `material_requests` table
    - Add policies for staff and teachers to create and view their own requests
    - Add policies for admins to view and manage all requests
*/

CREATE TABLE IF NOT EXISTS material_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('supply', 'material')),
  title text NOT NULL,
  description text NOT NULL,
  quantity text DEFAULT '',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and teachers can view their own material requests"
  ON material_requests
  FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Staff and teachers can create material requests"
  ON material_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'teacher')
      AND profiles.approved = true
    )
  );

CREATE POLICY "Requesters can update their pending requests"
  ON material_requests
  FOR UPDATE
  TO authenticated
  USING (
    requester_id = auth.uid() 
    AND status = 'pending'
  )
  WITH CHECK (
    requester_id = auth.uid() 
    AND status = 'pending'
  );

CREATE POLICY "Admins can update all material requests"
  ON material_requests
  FOR UPDATE
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

CREATE POLICY "Requesters can delete their pending requests"
  ON material_requests
  FOR DELETE
  TO authenticated
  USING (
    requester_id = auth.uid() 
    AND status = 'pending'
  );
