/*
  # KOD - Kayıt Oluşturulan Davranış Sistemi

  ## Özet
  Okulda yaşanan olayların sistematik kaydı ve takibi için davranış olayları sistemi.
  Yöneticiler, öğretmenler, rehberlik birimi ve diğer personeller olay kaydı oluşturabilir.
  Rehberlik birimi tüm kayıtlara değerlendirme yapabilir.

  ## Yeni Tablolar
    - `behavior_incidents` - Davranış olay kayıtları
      - `id` (uuid, primary key) - Kayıt ID
      - `incident_date` (date) - Olayın tarihi
      - `incident_time` (time) - Olayın saati
      - `location` (text) - Olayın gerçekleştiği yer
      - `summary` (text) - Olay özeti
      - `created_by` (uuid, references profiles) - Kaydı oluşturan kişi
      - `guidance_evaluation` (text, nullable) - Rehberlik biriminin görüşü
      - `evaluated_by` (uuid, nullable, references profiles) - Değerlendirmeyi yapan
      - `evaluated_at` (timestamptz, nullable) - Değerlendirme tarihi
      - `created_at` (timestamptz) - Oluşturulma tarihi
      - `updated_at` (timestamptz) - Güncellenme tarihi

  ## Güvenlik Politikaları

  ### Admin Politikaları
  - Tüm kayıtları görüntüleyebilir, oluşturabilir, güncelleyebilir, silebilir

  ### Öğretmen Politikaları
  - Kendi kayıtlarını ve tüm kayıtları görüntüleyebilir
  - Yeni kayıt oluşturabilir
  - Kendi kayıtlarını güncelleyebilir

  ### Rehberlik Birimi Politikaları
  - Tüm kayıtları görüntüleyebilir
  - Yeni kayıt oluşturabilir
  - Tüm kayıtlara değerlendirme ekleyebilir

  ### Personel Politikaları
  - Kendi kayıtlarını görüntüleyebilir
  - Yeni kayıt oluşturabilir
  - Kendi kayıtlarını güncelleyebilir
*/

-- Create behavior_incidents table
CREATE TABLE IF NOT EXISTS behavior_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_date date NOT NULL,
  incident_time time NOT NULL,
  location text NOT NULL,
  summary text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guidance_evaluation text,
  evaluated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  evaluated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE behavior_incidents ENABLE ROW LEVEL SECURITY;

-- Admin: Full access to all records
CREATE POLICY "Admins can view all behavior incidents"
  ON behavior_incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create behavior incidents"
  ON behavior_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all behavior incidents"
  ON behavior_incidents
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

CREATE POLICY "Admins can delete behavior incidents"
  ON behavior_incidents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Teachers: Can view all, create, and update their own
CREATE POLICY "Teachers can view all behavior incidents"
  ON behavior_incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can create behavior incidents"
  ON behavior_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Teachers can update own behavior incidents"
  ON behavior_incidents
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Guidance Counselors: Can view all, create, and add evaluations to all
CREATE POLICY "Guidance counselors can view all behavior incidents"
  ON behavior_incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
  );

CREATE POLICY "Guidance counselors can create behavior incidents"
  ON behavior_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Guidance counselors can add evaluations to all incidents"
  ON behavior_incidents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guidance_counselor'
    )
  );

-- Staff: Can view own, create, and update own
CREATE POLICY "Staff can view own behavior incidents"
  ON behavior_incidents
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'staff'
    )
  );

CREATE POLICY "Staff can create behavior incidents"
  ON behavior_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'staff'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Staff can update own behavior incidents"
  ON behavior_incidents
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'staff'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'staff'
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_behavior_incidents_created_by ON behavior_incidents(created_by);
CREATE INDEX IF NOT EXISTS idx_behavior_incidents_incident_date ON behavior_incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_incidents_evaluated_by ON behavior_incidents(evaluated_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_behavior_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER behavior_incidents_updated_at
  BEFORE UPDATE ON behavior_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_incidents_updated_at();