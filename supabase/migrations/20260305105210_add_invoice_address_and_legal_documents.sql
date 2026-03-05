/*
  # Add Invoice Address and Legal Documents System

  1. Changes to profiles table
    - Add invoice address fields (company_name, tax_id, tax_office, invoice_address fields)
    
  2. New Tables
    - `legal_documents`
      - `id` (uuid, primary key)
      - `document_type` (text) - 'terms_conditions' or 'distance_sales_agreement'
      - `title` (text)
      - `content` (text)
      - `version` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
  3. Security
    - Enable RLS on `legal_documents` table
    - Add policy for public read access to active documents
    - Add policy for admin to manage documents
*/

-- Add invoice address fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invoice_company_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invoice_company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invoice_tax_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invoice_tax_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invoice_tax_office'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invoice_tax_office text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invoice_city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invoice_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invoice_district'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invoice_district text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invoice_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invoice_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invoice_postal_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invoice_postal_code text;
  END IF;
END $$;

-- Create legal documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('terms_conditions', 'distance_sales_agreement')),
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Public can read active legal documents
CREATE POLICY "Anyone can read active legal documents"
  ON legal_documents
  FOR SELECT
  USING (is_active = true);

-- Admin can manage legal documents
CREATE POLICY "Admin can insert legal documents"
  ON legal_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update legal documents"
  ON legal_documents
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

CREATE POLICY "Admin can delete legal documents"
  ON legal_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default legal documents with simpler content
INSERT INTO legal_documents (document_type, title, content, version, is_active)
VALUES 
(
  'terms_conditions',
  'On Bilgilendirme Kosullari',
  'ON BILGILENDIRME FORMU - Bu dokuman mesafeli satis sozlesmesi kapsaminda tuketiciyi bilgilendirmek amaciyla hazirlanmistir.',
  '1.0',
  true
),
(
  'distance_sales_agreement',
  'Mesafeli Satis Sozlesmesi',
  'MESAFELI SATIS SOZLESMESI - Bu sozlesme 6502 sayili Tuketicilerin Korunmasi Hakkindaki Kanun ve Mesafeli Sozlesmeler Yonetmeligi cercevesinde duzenlenmistir.',
  '1.0',
  true
)
ON CONFLICT DO NOTHING;