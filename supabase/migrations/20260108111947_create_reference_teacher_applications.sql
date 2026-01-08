/*
  # Referans Öğretmen Programı Başvuru Sistemi

  1. Yeni Tablolar
    - `reference_teacher_applications`
      - `id` (uuid, primary key)
      - `full_name` (text) - Adı Soyadı
      - `email` (text) - Mail adresi
      - `phone` (text) - Telefon numarası
      - `address` (text) - Adres
      - `graduated_school` (text) - Mezun olduğu okul
      - `graduated_program` (text) - Mezun olduğu program
      - `has_formation` (boolean) - Formasyonu var mı
      - `is_working` (boolean) - Şuan çalışıyor mu
      - `workplace` (text, nullable) - Çalıştığı yer (eğer çalışıyorsa)
      - `has_montessori_training` (boolean) - Montessori eğitimi aldı mı
      - `previous_trainings` (text) - Aldığı eğitimler
      - `reference_info` (text, nullable) - İsteğe bağlı referans bilgisi
      - `evaluation_essay` (text) - Alana dair değerlendirme yazısı
      - `photo_url` (text, nullable) - Fotoğraf URL
      - `status` (text) - Başvuru durumu (pending, approved, rejected)
      - `created_at` (timestamptz) - Başvuru tarihi

  2. Storage
    - `reference-teacher-photos` bucket - Başvuru fotoğrafları için

  3. Güvenlik
    - RLS etkin
    - Herkes kendi başvurusunu oluşturabilir
    - Adminler tüm başvuruları görebilir
*/

CREATE TABLE IF NOT EXISTS reference_teacher_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  graduated_school text NOT NULL,
  graduated_program text NOT NULL,
  has_formation boolean NOT NULL DEFAULT false,
  is_working boolean NOT NULL DEFAULT false,
  workplace text,
  has_montessori_training boolean NOT NULL DEFAULT false,
  previous_trainings text NOT NULL,
  reference_info text,
  evaluation_essay text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reference_teacher_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application"
  ON reference_teacher_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
  ON reference_teacher_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update applications"
  ON reference_teacher_applications
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

INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-teacher-photos', 'reference-teacher-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload reference teacher photos"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'reference-teacher-photos');

CREATE POLICY "Public access to reference teacher photos"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'reference-teacher-photos');