/*
  # Create Favorites Table

  1. New Table
    - `user_favorites` - Kullanıcı favorileri
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Kullanıcı referansı
      - `product_id` (uuid, nullable) - Ürün referansı
      - `course_id` (uuid, nullable) - Kurs referansı
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_favorites` table
    - Add policies for authenticated users to manage their own favorites
*/

-- Create User Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  course_id uuid REFERENCES online_courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT favorites_item_check CHECK (
    (product_id IS NOT NULL AND course_id IS NULL) OR
    (product_id IS NULL AND course_id IS NOT NULL)
  ),
  UNIQUE(user_id, product_id),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User Favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product ON user_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_course ON user_favorites(course_id);