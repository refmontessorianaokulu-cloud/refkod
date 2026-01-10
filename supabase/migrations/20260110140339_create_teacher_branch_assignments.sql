/*
  # Branş Dersi Öğretmen Atamaları (Teacher Branch Assignments)

  1. Yeni Tablo
    - `teacher_branch_assignments`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, references profiles)
      - `class_name` (text) - Atanan sınıf adı
      - `course_type` (text) - Branş dersi türü
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Güvenlik
    - RLS etkin
    - Adminler tüm atamaları görebilir ve yönetebilir
    - Öğretmenler sadece kendi atamalarını görebilir
    
  3. Kısıtlamalar
    - Aynı öğretmen, aynı sınıf ve aynı derse sadece bir kez atanabilir (unique constraint)
    - course_type sadece geçerli branş dersi değerlerini alabilir
*/

-- Create teacher_branch_assignments table
CREATE TABLE IF NOT EXISTS teacher_branch_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  course_type text NOT NULL CHECK (course_type IN ('english', 'quran', 'moral_values', 'etiquette', 'art_music', 'guidance')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (teacher_id, class_name, course_type)
);

-- Enable RLS
ALTER TABLE teacher_branch_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all assignments
CREATE POLICY "Admins can view all teacher branch assignments"
  ON teacher_branch_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Teachers can view their own assignments
CREATE POLICY "Teachers can view their own assignments"
  ON teacher_branch_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Policy: Admins can insert assignments
CREATE POLICY "Admins can insert teacher branch assignments"
  ON teacher_branch_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update assignments
CREATE POLICY "Admins can update teacher branch assignments"
  ON teacher_branch_assignments
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

-- Policy: Admins can delete assignments
CREATE POLICY "Admins can delete teacher branch assignments"
  ON teacher_branch_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_teacher_branch_assignments_teacher_id 
  ON teacher_branch_assignments(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_branch_assignments_class_name 
  ON teacher_branch_assignments(class_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_teacher_branch_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teacher_branch_assignments_updated_at
  BEFORE UPDATE ON teacher_branch_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_branch_assignments_updated_at();