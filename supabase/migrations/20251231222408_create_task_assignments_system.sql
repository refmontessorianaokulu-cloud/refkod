/*
  # Create Task Assignments System

  1. New Tables
    - `task_assignments`
      - `id` (uuid, primary key) - Unique identifier for the task
      - `created_by` (uuid) - Reference to admin user who created the task
      - `title` (text) - Task title
      - `description` (text) - Detailed task description
      - `is_group_task` (boolean) - Whether this is a group task or individual assignment
      - `assigned_to` (uuid, nullable) - For individual tasks, the specific user assigned
      - `target_roles` (text array) - For group tasks, which roles are targeted (teacher, guidance_counselor)
      - `week_start` (date) - Start date of the week
      - `week_end` (date) - End date of the week
      - `created_at` (timestamptz) - When the task was created
      
    - `task_responses`
      - `id` (uuid, primary key) - Unique identifier for the response
      - `task_id` (uuid) - Reference to the task
      - `user_id` (uuid) - User who completed the task
      - `is_completed` (boolean) - Whether the task is completed
      - `completed_at` (timestamptz, nullable) - When the task was completed
      - `notes` (text, nullable) - Optional notes from the user
      - `created_at` (timestamptz) - When the response was created
      - `updated_at` (timestamptz) - When the response was last updated

  2. Security
    - Enable RLS on both tables
    - Admins can create and view all tasks
    - Teachers and guidance counselors can view tasks assigned to them
    - Teachers and guidance counselors can create/update their own responses
    - Everyone can view responses for transparency
*/

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  is_group_task boolean DEFAULT false NOT NULL,
  assigned_to uuid REFERENCES profiles(id),
  target_roles text[] DEFAULT '{}',
  week_start date NOT NULL,
  week_end date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_assignment CHECK (
    (is_group_task = true AND target_roles != '{}' AND assigned_to IS NULL) OR
    (is_group_task = false AND assigned_to IS NOT NULL AND target_roles = '{}')
  )
);

-- Create task_responses table
CREATE TABLE IF NOT EXISTS task_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES task_assignments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(task_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_created_by ON task_assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to ON task_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_assignments_week ON task_assignments(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_task_responses_task_id ON task_responses(task_id);
CREATE INDEX IF NOT EXISTS idx_task_responses_user_id ON task_responses(user_id);

-- Enable RLS
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_responses ENABLE ROW LEVEL SECURITY;

-- Policies for task_assignments

-- Admins can insert tasks
CREATE POLICY "Admins can create tasks"
  ON task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all tasks
CREATE POLICY "Admins can view all tasks"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Teachers can view tasks assigned to them (individual or group)
CREATE POLICY "Teachers can view their tasks"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND (
        task_assignments.assigned_to = auth.uid() OR
        (task_assignments.is_group_task = true AND 'teacher' = ANY(task_assignments.target_roles))
      )
    )
  );

-- Guidance counselors can view tasks assigned to them (individual or group)
CREATE POLICY "Guidance counselors can view their tasks"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
      AND (
        task_assignments.assigned_to = auth.uid() OR
        (task_assignments.is_group_task = true AND 'guidance_counselor' = ANY(task_assignments.target_roles))
      )
    )
  );

-- Admins can update tasks
CREATE POLICY "Admins can update tasks"
  ON task_assignments FOR UPDATE
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

-- Admins can delete tasks
CREATE POLICY "Admins can delete tasks"
  ON task_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for task_responses

-- Users can create their own responses
CREATE POLICY "Users can create own responses"
  ON task_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM task_assignments
      WHERE task_assignments.id = task_id
      AND (
        task_assignments.assigned_to = auth.uid() OR
        (task_assignments.is_group_task = true AND 
         EXISTS (
           SELECT 1 FROM profiles
           WHERE profiles.id = auth.uid()
           AND profiles.role = ANY(task_assignments.target_roles)
         )
        )
      )
    )
  );

-- Users can view all responses for transparency
CREATE POLICY "Authenticated users can view responses"
  ON task_responses FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own responses
CREATE POLICY "Users can update own responses"
  ON task_responses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_response_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS task_responses_updated_at ON task_responses;
CREATE TRIGGER task_responses_updated_at
  BEFORE UPDATE ON task_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_task_response_updated_at();