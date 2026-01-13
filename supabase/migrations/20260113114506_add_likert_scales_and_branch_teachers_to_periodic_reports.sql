/*
  # Dönem Gelişim Raporlarına Likert Ölçekleri ve Branş Öğretmeni Alanları Ekle

  1. Yeni Alanlar
    - Likert Ölçeği Değerlendirmeleri (3'lü: high/medium/low):
      - `focus_duration` - Odak Süresi
      - `communication_skills` - İletişim Becerileri
      - `collaboration` - İşbirliği
      - `motivation` - Motivasyon
      - `cleanliness_order` - Temizlik ve Düzen
      - `material_usage_skills` - Materyal Kullanma Becerileri
      - `productivity` - Üretkenlik

    - Branş Dersi Tamamlanma İzleme:
      - `english_teacher_id`, `english_completed`
      - `quran_teacher_id`, `quran_completed`
      - `moral_values_teacher_id`, `moral_values_completed`
      - `etiquette_teacher_id`, `etiquette_completed`
      - `art_music_teacher_id`, `art_music_completed`

    - Montessori Alanı (Sınıf Öğretmeni):
      - `montessori_teacher_id`, `montessori_completed`

    - Rehberlik Birimi:
      - `guidance_evaluation` - Rehberlik öğretmeni değerlendirmesi
      - `guidance_teacher_id`, `guidance_completed`

  2. Alan İsmi Güncellemeleri
    - `strengths` → `montessori_interests` (Montessori'de İlgi Duyduğu Alanlar)
    - `areas_for_improvement` → `learning_process_evaluation` (Öğrenme Sürecindeki Odaklanma, Sınıf Uyumu ve İşbirliği Seviyesi)

  3. RLS Politikaları
    - Branş öğretmenleri sadece kendi branşlarını güncelleyebilir
    - Sınıf öğretmeni Montessori ve genel değerlendirmeyi güncelleyebilir
    - Rehberlik öğretmeni kendi alanını güncelleyebilir
    - Admin tüm alanları güncelleyebilir

  4. Güvenlik
    - RLS politikaları güncellenmiştir
    - Her öğretmen sadece yetkili olduğu alanları düzenleyebilir
*/

-- Likert ölçeği alanlarını ekle
ALTER TABLE periodic_development_reports 
ADD COLUMN IF NOT EXISTS focus_duration text CHECK (focus_duration IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS communication_skills text CHECK (communication_skills IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS collaboration text CHECK (collaboration IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS motivation text CHECK (motivation IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS cleanliness_order text CHECK (cleanliness_order IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS material_usage_skills text CHECK (material_usage_skills IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS productivity text CHECK (productivity IN ('high', 'medium', 'low'));

-- Branş öğretmeni alanlarını ekle
ALTER TABLE periodic_development_reports 
ADD COLUMN IF NOT EXISTS english_teacher_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS english_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quran_teacher_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS quran_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS moral_values_teacher_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS moral_values_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS etiquette_teacher_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS etiquette_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS art_music_teacher_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS art_music_completed boolean DEFAULT false;

-- Montessori öğretmeni alanlarını ekle
ALTER TABLE periodic_development_reports 
ADD COLUMN IF NOT EXISTS montessori_teacher_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS montessori_completed boolean DEFAULT false;

-- Rehberlik öğretmeni alanlarını ekle
ALTER TABLE periodic_development_reports 
ADD COLUMN IF NOT EXISTS guidance_evaluation text,
ADD COLUMN IF NOT EXISTS guidance_teacher_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS guidance_completed boolean DEFAULT false;

-- Alan isimlerini güncelle (strengths → montessori_interests)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodic_development_reports' AND column_name = 'strengths'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodic_development_reports' AND column_name = 'montessori_interests'
  ) THEN
    ALTER TABLE periodic_development_reports 
    RENAME COLUMN strengths TO montessori_interests;
  END IF;
END $$;

-- Alan isimlerini güncelle (areas_for_improvement → learning_process_evaluation)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodic_development_reports' AND column_name = 'areas_for_improvement'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodic_development_reports' AND column_name = 'learning_process_evaluation'
  ) THEN
    ALTER TABLE periodic_development_reports 
    RENAME COLUMN areas_for_improvement TO learning_process_evaluation;
  END IF;
END $$;

-- İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_periodic_reports_english_teacher ON periodic_development_reports(english_teacher_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_quran_teacher ON periodic_development_reports(quran_teacher_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_moral_values_teacher ON periodic_development_reports(moral_values_teacher_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_etiquette_teacher ON periodic_development_reports(etiquette_teacher_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_art_music_teacher ON periodic_development_reports(art_music_teacher_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_montessori_teacher ON periodic_development_reports(montessori_teacher_id);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_guidance_teacher ON periodic_development_reports(guidance_teacher_id);

-- Likert alanları için indeksler (raporlama için)
CREATE INDEX IF NOT EXISTS idx_periodic_reports_focus_duration ON periodic_development_reports(focus_duration);
CREATE INDEX IF NOT EXISTS idx_periodic_reports_communication_skills ON periodic_development_reports(communication_skills);

-- Mevcut UPDATE politikasını kaldır
DROP POLICY IF EXISTS "Teachers can update reports for assigned children" ON periodic_development_reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON periodic_development_reports;

-- Branş öğretmenleri için UPDATE politikası
CREATE POLICY "Branch teachers can update their own course"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
    )
  );

-- Sınıf öğretmenleri için UPDATE politikası (Montessori, Likert, genel değerlendirme)
CREATE POLICY "Class teachers can update montessori and evaluations"
  ON periodic_development_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.child_id = periodic_development_reports.child_id
      AND tc.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_children tc
      WHERE tc.child_id = periodic_development_reports.child_id
      AND tc.teacher_id = auth.uid()
    )
  );

-- Rehberlik öğretmenleri için UPDATE politikası
CREATE POLICY "Guidance counselors can update guidance evaluation"
  ON periodic_development_reports FOR UPDATE
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

-- Admin için UPDATE politikası
CREATE POLICY "Admins can update all periodic reports"
  ON periodic_development_reports FOR UPDATE
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

-- Branş öğretmenleri için SELECT politikası güncelle
DROP POLICY IF EXISTS "Branch teachers can view reports for their branch" ON periodic_development_reports;

CREATE POLICY "Branch teachers can view reports for their assigned branch"
  ON periodic_development_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_branch_assignments tba
      JOIN children c ON c.class_name = tba.class_name
      WHERE c.id = periodic_development_reports.child_id
      AND tba.teacher_id = auth.uid()
    )
  );