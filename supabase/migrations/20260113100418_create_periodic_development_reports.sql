/*
  # Create Periodic Development Reports System

  1. New Tables
    - academic_periods: Manages academic periods (1st and 2nd semester)
    - periodic_development_reports: Stores comprehensive development reports for each child per period
  
  2. Features
    - Two periods per academic year
    - Montessori areas evaluation (Practical Life, Sensorial, Mathematics, Language, Culture)
    - Branch courses evaluation (English, Quran, Spiritual Values, Etiquette, Art-Music)
    - General evaluation with strengths, areas to improve, and recommendations
    - Media attachments support
    - Draft and approval workflow
  
  3. Security
    - Teachers can create and manage reports for their assigned students
    - Parents can view their children's reports
    - Admins can view and approve all reports
    - Guidance counselors can view all reports
*/

-- Create academic_periods table
CREATE TABLE IF NOT EXISTS academic_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  period_number int NOT NULL CHECK (period_number IN (1, 2)),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(period_number, start_date)
);

-- Create periodic_development_reports table
CREATE TABLE IF NOT EXISTS periodic_development_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
  
  -- Montessori Areas
  practical_life text DEFAULT '',
  sensorial text DEFAULT '',
  mathematics text DEFAULT '',
  language text DEFAULT '',
  culture text DEFAULT '',
  
  -- Branch Courses
  english text DEFAULT '',
  quran text DEFAULT '',
  spiritual_values text DEFAULT '',
  etiquette text DEFAULT '',
  art_music text DEFAULT '',
  
  -- General Evaluation
  general_evaluation text DEFAULT '',
  strengths text DEFAULT '',
  areas_to_improve text DEFAULT '',
  recommendations text DEFAULT '',
  
  -- Media and Status
  media_urls text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved')),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(child_id, period_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_periodic_reports_child ON periodic_development_reports(child_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_teacher ON periodic_development_reports(teacher_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_period ON periodic_development_reports(period_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_status ON periodic_development_reports(status);
CREATE INDEX IF NOT EXISTS idx_academic_periods_active ON academic_periods(is_active);

-- Enable RLS
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodic_development_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_periods
CREATE POLICY "Everyone can view academic periods"
  ON academic_periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage academic periods"
  ON academic_periods FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for periodic_development_reports

-- SELECT policies
CREATE POLICY "Teachers can view reports for their students"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
    AND EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.teacher_id = auth.uid()
      AND tc.child_id = periodic_development_reports.child_id
    )
  );

CREATE POLICY "Parents can view their children's reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_children pc
      WHERE pc.parent_id = auth.uid()
      AND pc.child_id = periodic_development_reports.child_id
    )
  );

CREATE POLICY "Admins can view all reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Guidance counselors can view all reports"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'guidance_counselor');

-- INSERT policies
CREATE POLICY "Teachers can create reports for their students"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.teacher_id = auth.uid()
      AND tc.child_id = periodic_development_reports.child_id
    )
  );

CREATE POLICY "Admins can create reports"
  ON periodic_development_reports FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- UPDATE policies
CREATE POLICY "Teachers can update their own reports"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.teacher_id = auth.uid()
      AND tc.child_id = periodic_development_reports.child_id
    )
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
    AND teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.teacher_id = auth.uid()
      AND tc.child_id = periodic_development_reports.child_id
    )
  );

CREATE POLICY "Admins can update all reports"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- DELETE policies
CREATE POLICY "Teachers can delete their own reports"
  ON periodic_development_reports FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
    AND teacher_id = auth.uid()
  );

CREATE POLICY "Admins can delete all reports"
  ON periodic_development_reports FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Insert default periods
INSERT INTO academic_periods (name, period_number, start_date, end_date, is_active)
VALUES 
  ('1. Dönem', 1, '2025-09-01', '2026-01-31', true),
  ('2. Dönem', 2, '2026-02-01', '2026-06-30', false)
ON CONFLICT DO NOTHING;