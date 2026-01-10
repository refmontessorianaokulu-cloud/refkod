/*
  # Create Homepage Content Management System

  1. New Tables
    - `about_content`
      - `id` (uuid, primary key)
      - `section_key` (text, unique) - Unique identifier for each section
      - `section_title` (text) - Display title for the section
      - `content` (text) - Main content/description
      - `image_url` (text, nullable) - Optional image URL
      - `display_order` (integer) - Order of display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `app_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting identifier
      - `value` (text) - Setting value
      - `description` (text) - Description of the setting
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - `about_content`: public read access, admin-only write access
    - `app_settings`: admin-only read and write access

  3. Initial Data
    - Insert default about_content sections (mission, vision, montessori_philosophy, education_programs)
    - Insert Instagram access token placeholder in app_settings
*/

-- Create about_content table
CREATE TABLE IF NOT EXISTS about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  section_title text NOT NULL,
  content text NOT NULL DEFAULT '',
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policies for about_content
CREATE POLICY "Anyone can view about content"
  ON about_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert about content"
  ON about_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update about content"
  ON about_content FOR UPDATE
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

CREATE POLICY "Only admins can delete about content"
  ON about_content FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for app_settings
CREATE POLICY "Only admins can view app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert app settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update app settings"
  ON app_settings FOR UPDATE
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

CREATE POLICY "Only admins can delete app settings"
  ON app_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default about_content sections
INSERT INTO about_content (section_key, section_title, content, display_order) VALUES
  ('mission', 'Misyonumuz', 'REF Çocuk Akademisi olarak misyonumuz, çocukların doğal öğrenme süreçlerini destekleyerek, özgüven sahibi, bağımsız düşünebilen ve yaratıcı bireyler yetiştirmektir. Montessori eğitim felsefesini temel alarak, her çocuğun benzersiz potansiyelini keşfetmesine ve geliştirmesine olanak sağlıyoruz.', 1),
  ('vision', 'Vizyonumuz', 'Çocuklarımızın kendilerini ifade edebilecekleri, keşfedebilecekleri ve öğrenebilecekleri güvenli, destekleyici bir ortam sunmak. Montessori prensiplerine sadık kalarak, her çocuğun kendi hızında ilerlemesine izin veren bir eğitim modeli oluşturmak.', 2),
  ('montessori_philosophy', 'Montessori Felsefemiz', 'Montessori eğitimi, çocuğun doğal gelişim sürecine saygı duyar ve çocuğu eğitimin merkezine koyar. Özel olarak tasarlanmış materyallerimiz ve hazırlanan ortamımız sayesinde, çocuklar kendi ilgi alanlarını keşfeder, pratik hayat becerilerini geliştirir ve akademik temeller oluşturur. Karma yaş grupları ile sosyal gelişimi destekliyor, bağımsızlık ve özgüveni teşvik ediyoruz.', 3),
  ('education_programs', 'Eğitim Programlarımız', 'REF Çocuk Akademisi olarak tam gün ve yarım gün programları sunuyoruz. Programlarımız pratik hayat, duyusal gelişim, matematik, dil, kültür ve sanat alanlarını kapsayan kapsamlı bir müfredat içerir. Uzman eğitmenlerimiz, her çocuğun bireysel ihtiyaçlarına özel ilgi gösterir ve gelişimlerini düzenli olarak takip eder. Ayrıca velilerimiz için düzenli toplantılar, atölye çalışmaları ve danışmanlık hizmetleri sunuyoruz.', 4)
ON CONFLICT (section_key) DO NOTHING;

-- Insert Instagram API setting placeholder
INSERT INTO app_settings (key, value, description) VALUES
  ('instagram_access_token', '', 'Instagram Basic Display API access token for fetching posts')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_about_content_updated_at ON about_content;
CREATE TRIGGER update_about_content_updated_at
  BEFORE UPDATE ON about_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
