/*
  # Anaokulu Yönetim Sistemi

  1. Yeni Tablolar
    - `profiles`
      - `id` (uuid, primary key, auth.users referansı)
      - `email` (text)
      - `full_name` (text)
      - `role` (text: 'admin', 'teacher', 'parent')
      - `created_at` (timestamptz)
    
    - `children`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `birth_date` (date)
      - `class_name` (text)
      - `created_at` (timestamptz)
    
    - `parent_children`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, profiles referansı)
      - `child_id` (uuid, children referansı)
      - `created_at` (timestamptz)
    
    - `meal_logs`
      - `id` (uuid, primary key)
      - `child_id` (uuid, children referansı)
      - `teacher_id` (uuid, profiles referansı)
      - `meal_type` (text: 'breakfast', 'lunch', 'snack')
      - `amount_eaten` (text: 'all', 'most', 'some', 'none')
      - `notes` (text)
      - `log_date` (date)
      - `created_at` (timestamptz)
    
    - `sleep_logs`
      - `id` (uuid, primary key)
      - `child_id` (uuid, children referansı)
      - `teacher_id` (uuid, profiles referansı)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `notes` (text)
      - `log_date` (date)
      - `created_at` (timestamptz)
  
  2. Güvenlik
    - Tüm tablolarda RLS aktif
    - Yöneticiler: Tüm verilere tam erişim
    - Öğretmenler: Tüm çocukları görebilir, kayıt ekleyebilir
    - Veliler: Sadece kendi çocuklarının verilerini görebilir
*/

-- Profiles tablosu
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'parent')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Children tablosu
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  class_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Parent-Children ilişki tablosu
CREATE TABLE IF NOT EXISTS parent_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

-- Meal logs tablosu
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack')),
  amount_eaten text NOT NULL CHECK (amount_eaten IN ('all', 'most', 'some', 'none')),
  notes text DEFAULT '',
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- Sleep logs tablosu
CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  notes text DEFAULT '',
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları: Profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
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

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Politikaları: Children
CREATE POLICY "Admins can view all children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can view all children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Parents can view their children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children
      WHERE parent_children.child_id = children.id
      AND parent_children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage children"
  ON children FOR ALL
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

-- RLS Politikaları: Parent-Children
CREATE POLICY "Admins can view all parent-child relationships"
  ON parent_children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Parents can view their relationships"
  ON parent_children FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Admins can manage parent-child relationships"
  ON parent_children FOR ALL
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

-- RLS Politikaları: Meal Logs
CREATE POLICY "Admins can view all meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can view all meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Parents can view their children's meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children
      WHERE parent_children.child_id = meal_logs.child_id
      AND parent_children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert meal logs"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
    AND teacher_id = auth.uid()
  );

CREATE POLICY "Teachers can update their meal logs"
  ON meal_logs FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Admins can manage all meal logs"
  ON meal_logs FOR ALL
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

-- RLS Politikaları: Sleep Logs
CREATE POLICY "Admins can view all sleep logs"
  ON sleep_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can view all sleep logs"
  ON sleep_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Parents can view their children's sleep logs"
  ON sleep_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_children
      WHERE parent_children.child_id = sleep_logs.child_id
      AND parent_children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert sleep logs"
  ON sleep_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
    AND teacher_id = auth.uid()
  );

CREATE POLICY "Teachers can update their sleep logs"
  ON sleep_logs FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Admins can manage all sleep logs"
  ON sleep_logs FOR ALL
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