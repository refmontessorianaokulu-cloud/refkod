/*
  # Create REF Evaluation System (Performance Evaluation)

  ## Overview
  This migration creates a comprehensive performance evaluation system where:
  - Teachers can evaluate: other teachers, cooks, cleaning staff, guidance counselors, administration, and parents
  - Cleaning staff can evaluate: teachers, guidance counselors, cooks, administration
  - Cooks can evaluate: administration, teachers, guidance counselors, cleaning staff
  - Parents can evaluate: teachers, guidance counselors, administration, meals, cleanliness, bus service
  - Admins can evaluate: teachers, cooks, cleaning staff, guidance counselors
  - Guest users cannot access the evaluation system
  - Each criterion is scored 0-10
  - Only admins can view all evaluation results and analytics

  ## New Tables

  ### `evaluation_categories`
  - `id` (uuid, primary key) - Unique category identifier
  - `category_name` (text, not null) - Category name (teacher, cook, cleaning, counselor, administration, parent, meals, facility_cleanliness, bus_service)
  - `display_name` (text, not null) - Display name in Turkish
  - `created_at` (timestamptz) - Record creation timestamp

  ### `evaluation_questions`
  - `id` (uuid, primary key) - Unique question identifier
  - `category_id` (uuid, foreign key) - Related category
  - `question_text` (text, not null) - Question text
  - `display_order` (integer) - Display order
  - `created_at` (timestamptz) - Record creation timestamp

  ### `evaluations`
  - `id` (uuid, primary key) - Unique evaluation identifier
  - `evaluator_id` (uuid, foreign key to profiles) - User submitting evaluation
  - `evaluated_category` (text, not null) - Category being evaluated
  - `evaluated_user_id` (uuid, foreign key to profiles, nullable) - Specific user being evaluated (for individual evaluations)
  - `evaluation_period` (text, not null) - Period (e.g., "2026-02")
  - `scores` (jsonb, not null) - Question scores as {question_id: score}
  - `comments` (text) - Additional comments
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security (RLS)
  - Authenticated users (non-guests) can submit evaluations
  - Users can view their own submitted evaluations
  - Only admins can view all evaluations and analytics
  - Guest users have no access

  ## Notes
  - Evaluation questions are predefined per category
  - Scores range from 0-10
  - Analytics aggregation happens at application level
*/

-- Create evaluation_categories table
CREATE TABLE IF NOT EXISTS evaluation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create evaluation_questions table
CREATE TABLE IF NOT EXISTS evaluation_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES evaluation_categories(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluated_category text NOT NULL,
  evaluated_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  evaluation_period text NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}',
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_evaluation_per_period UNIQUE (evaluator_id, evaluated_category, evaluated_user_id, evaluation_period)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_category ON evaluations(evaluated_category);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluated_user ON evaluations(evaluated_user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON evaluations(evaluation_period);
CREATE INDEX IF NOT EXISTS idx_evaluation_questions_category ON evaluation_questions(category_id);

-- Enable RLS
ALTER TABLE evaluation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for evaluation_categories
CREATE POLICY "Authenticated users can view evaluation categories"
  ON evaluation_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage evaluation categories"
  ON evaluation_categories
  FOR ALL
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

-- RLS Policies for evaluation_questions
CREATE POLICY "Authenticated users can view evaluation questions"
  ON evaluation_questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage evaluation questions"
  ON evaluation_questions
  FOR ALL
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

-- RLS Policies for evaluations
CREATE POLICY "Authenticated users can create evaluations"
  ON evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = evaluator_id
  );

CREATE POLICY "Users can view their own evaluations"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (
    evaluator_id = auth.uid()
  );

CREATE POLICY "Admins can view all evaluations"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own evaluations"
  ON evaluations
  FOR UPDATE
  TO authenticated
  USING (evaluator_id = auth.uid())
  WITH CHECK (evaluator_id = auth.uid());

CREATE POLICY "Admins can delete evaluations"
  ON evaluations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at();

-- Insert evaluation categories
INSERT INTO evaluation_categories (category_name, display_name) VALUES
  ('teacher', 'Öğretmen'),
  ('cook', 'Aşçı'),
  ('cleaning_staff', 'Temizlik Personeli'),
  ('guidance_counselor', 'Rehberlik Servisi'),
  ('administration', 'Kurum İdaresi'),
  ('parent', 'Veli'),
  ('meals', 'Kurum Yemekleri'),
  ('facility_cleanliness', 'Kurumun Temizliği'),
  ('bus_service', 'Kurum Servisi')
ON CONFLICT (category_name) DO NOTHING;

-- Insert evaluation questions for each category

-- Teacher evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Öğrencilerle iletişimi ve etkileşimi', 1 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Sınıf yönetimi ve disiplin', 2 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Ders planlaması ve materyal hazırlığı', 3 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Montessori felsefesine uygunluk', 4 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Velilerle iletişim ve işbirliği', 5 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Mesleki gelişime açıklık', 6 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Takım çalışmasına yatkınlık', 7 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Sorun çözme becerisi', 8 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Zamanında ve düzenli olma', 9 FROM evaluation_categories WHERE category_name = 'teacher'
UNION ALL
SELECT id, 'Genel memnuniyet', 10 FROM evaluation_categories WHERE category_name = 'teacher';

-- Cook evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Yemek lezzeti ve kalitesi', 1 FROM evaluation_categories WHERE category_name = 'cook'
UNION ALL
SELECT id, 'Menü çeşitliliği', 2 FROM evaluation_categories WHERE category_name = 'cook'
UNION ALL
SELECT id, 'Hijyen ve temizlik standartları', 3 FROM evaluation_categories WHERE category_name = 'cook'
UNION ALL
SELECT id, 'Besin değeri ve sağlıklı beslenme', 4 FROM evaluation_categories WHERE category_name = 'cook'
UNION ALL
SELECT id, 'Özel diyet ihtiyaçlarına uyum', 5 FROM evaluation_categories WHERE category_name = 'cook'
UNION ALL
SELECT id, 'Yemek hazırlama zamanlaması', 6 FROM evaluation_categories WHERE category_name = 'cook'
UNION ALL
SELECT id, 'Mutfak organizasyonu', 7 FROM evaluation_categories WHERE category_name = 'cook'
UNION ALL
SELECT id, 'Personel ile iletişim', 8 FROM evaluation_categories WHERE category_name = 'cook'
UNION ALL
SELECT id, 'Genel memnuniyet', 9 FROM evaluation_categories WHERE category_name = 'cook';

-- Cleaning staff evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Temizlik kalitesi ve detaylılık', 1 FROM evaluation_categories WHERE category_name = 'cleaning_staff'
UNION ALL
SELECT id, 'Düzenli ve sistematik çalışma', 2 FROM evaluation_categories WHERE category_name = 'cleaning_staff'
UNION ALL
SELECT id, 'Hijyen standartlarına uygunluk', 3 FROM evaluation_categories WHERE category_name = 'cleaning_staff'
UNION ALL
SELECT id, 'Temizlik malzemelerinin doğru kullanımı', 4 FROM evaluation_categories WHERE category_name = 'cleaning_staff'
UNION ALL
SELECT id, 'Acil durumları hızlı çözme', 5 FROM evaluation_categories WHERE category_name = 'cleaning_staff'
UNION ALL
SELECT id, 'Personel ile iletişim', 6 FROM evaluation_categories WHERE category_name = 'cleaning_staff'
UNION ALL
SELECT id, 'Zamanında ve düzenli olma', 7 FROM evaluation_categories WHERE category_name = 'cleaning_staff'
UNION ALL
SELECT id, 'Genel memnuniyet', 8 FROM evaluation_categories WHERE category_name = 'cleaning_staff';

-- Guidance counselor evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Öğrencilerle etkili iletişim', 1 FROM evaluation_categories WHERE category_name = 'guidance_counselor'
UNION ALL
SELECT id, 'Velilerle işbirliği ve danışmanlık', 2 FROM evaluation_categories WHERE category_name = 'guidance_counselor'
UNION ALL
SELECT id, 'Davranış olaylarına müdahale etkinliği', 3 FROM evaluation_categories WHERE category_name = 'guidance_counselor'
UNION ALL
SELECT id, 'Gelişim raporlarının kalitesi', 4 FROM evaluation_categories WHERE category_name = 'guidance_counselor'
UNION ALL
SELECT id, 'Öğretmenlerle işbirliği', 5 FROM evaluation_categories WHERE category_name = 'guidance_counselor'
UNION ALL
SELECT id, 'Gizlilik ve etik kurallara uyum', 6 FROM evaluation_categories WHERE category_name = 'guidance_counselor'
UNION ALL
SELECT id, 'Sorun çözme ve öneriler sunma', 7 FROM evaluation_categories WHERE category_name = 'guidance_counselor'
UNION ALL
SELECT id, 'Ulaşılabilirlik ve erişilebilirlik', 8 FROM evaluation_categories WHERE category_name = 'guidance_counselor'
UNION ALL
SELECT id, 'Genel memnuniyet', 9 FROM evaluation_categories WHERE category_name = 'guidance_counselor';

-- Administration evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Yönetim ve liderlik becerisi', 1 FROM evaluation_categories WHERE category_name = 'administration'
UNION ALL
SELECT id, 'İletişim ve şeffaflık', 2 FROM evaluation_categories WHERE category_name = 'administration'
UNION ALL
SELECT id, 'Sorunlara çözüm üretme', 3 FROM evaluation_categories WHERE category_name = 'administration'
UNION ALL
SELECT id, 'Personel motivasyonu ve desteği', 4 FROM evaluation_categories WHERE category_name = 'administration'
UNION ALL
SELECT id, 'Karar alma ve uygulama', 5 FROM evaluation_categories WHERE category_name = 'administration'
UNION ALL
SELECT id, 'Kurumsal değerlere bağlılık', 6 FROM evaluation_categories WHERE category_name = 'administration'
UNION ALL
SELECT id, 'Mali yönetim ve kaynak kullanımı', 7 FROM evaluation_categories WHERE category_name = 'administration'
UNION ALL
SELECT id, 'Veli memnuniyeti', 8 FROM evaluation_categories WHERE category_name = 'administration'
UNION ALL
SELECT id, 'Genel memnuniyet', 9 FROM evaluation_categories WHERE category_name = 'administration';

-- Parent evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Veli-okul iletişimi', 1 FROM evaluation_categories WHERE category_name = 'parent'
UNION ALL
SELECT id, 'Okul etkinliklerine katılım', 2 FROM evaluation_categories WHERE category_name = 'parent'
UNION ALL
SELECT id, 'Öğretmenlerle işbirliği', 3 FROM evaluation_categories WHERE category_name = 'parent'
UNION ALL
SELECT id, 'Zamanında ödeme ve sorumluluklar', 4 FROM evaluation_categories WHERE category_name = 'parent'
UNION ALL
SELECT id, 'Çocuk gelişimine destek', 5 FROM evaluation_categories WHERE category_name = 'parent'
UNION ALL
SELECT id, 'Okul kurallarına uyum', 6 FROM evaluation_categories WHERE category_name = 'parent'
UNION ALL
SELECT id, 'Genel işbirliği', 7 FROM evaluation_categories WHERE category_name = 'parent';

-- Meals evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Yemek lezzeti', 1 FROM evaluation_categories WHERE category_name = 'meals'
UNION ALL
SELECT id, 'Porsiyon miktarı', 2 FROM evaluation_categories WHERE category_name = 'meals'
UNION ALL
SELECT id, 'Menü çeşitliliği', 3 FROM evaluation_categories WHERE category_name = 'meals'
UNION ALL
SELECT id, 'Sağlıklı ve besleyici olma', 4 FROM evaluation_categories WHERE category_name = 'meals'
UNION ALL
SELECT id, 'Yemek sunumu', 5 FROM evaluation_categories WHERE category_name = 'meals'
UNION ALL
SELECT id, 'Hijyen standartları', 6 FROM evaluation_categories WHERE category_name = 'meals'
UNION ALL
SELECT id, 'Genel memnuniyet', 7 FROM evaluation_categories WHERE category_name = 'meals';

-- Facility cleanliness evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Sınıfların temizliği', 1 FROM evaluation_categories WHERE category_name = 'facility_cleanliness'
UNION ALL
SELECT id, 'Tuvaletlerin temizliği', 2 FROM evaluation_categories WHERE category_name = 'facility_cleanliness'
UNION ALL
SELECT id, 'Ortak alanların temizliği', 3 FROM evaluation_categories WHERE category_name = 'facility_cleanliness'
UNION ALL
SELECT id, 'Oyun alanlarının temizliği', 4 FROM evaluation_categories WHERE category_name = 'facility_cleanliness'
UNION ALL
SELECT id, 'Hijyen malzemelerinin yeterliliği', 5 FROM evaluation_categories WHERE category_name = 'facility_cleanliness'
UNION ALL
SELECT id, 'Genel düzen ve tertip', 6 FROM evaluation_categories WHERE category_name = 'facility_cleanliness'
UNION ALL
SELECT id, 'Genel memnuniyet', 7 FROM evaluation_categories WHERE category_name = 'facility_cleanliness';

-- Bus service evaluation questions
INSERT INTO evaluation_questions (category_id, question_text, display_order)
SELECT id, 'Servis zamanlaması ve düzenlilik', 1 FROM evaluation_categories WHERE category_name = 'bus_service'
UNION ALL
SELECT id, 'Servis aracının temizliği', 2 FROM evaluation_categories WHERE category_name = 'bus_service'
UNION ALL
SELECT id, 'Sürücünün güvenli sürüşü', 3 FROM evaluation_categories WHERE category_name = 'bus_service'
UNION ALL
SELECT id, 'Sürücünün nezaketi', 4 FROM evaluation_categories WHERE category_name = 'bus_service'
UNION ALL
SELECT id, 'Çocuklara karşı davranış', 5 FROM evaluation_categories WHERE category_name = 'bus_service'
UNION ALL
SELECT id, 'İletişim ve bilgilendirme', 6 FROM evaluation_categories WHERE category_name = 'bus_service'
UNION ALL
SELECT id, 'Genel memnuniyet', 7 FROM evaluation_categories WHERE category_name = 'bus_service';
