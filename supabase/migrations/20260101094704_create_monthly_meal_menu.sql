/*
  # Create Monthly Meal Menu System

  1. New Tables
    - `monthly_menu`
      - `id` (uuid, primary key)
      - `menu_date` (date) - The date for this menu
      - `meal_type` (text) - breakfast, lunch, afternoon_snack
      - `menu_items` (text) - Description of the meal/menu items
      - `photo_url` (text, nullable) - URL to the meal photo
      - `created_by` (uuid, references profiles.id)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Create `menu-photos` bucket for meal photos
    - Public read access
    - Authenticated users can upload

  3. Security
    - Enable RLS on `monthly_menu` table
    - Everyone can view menu (parents and teachers)
    - Only admin can create, update, delete menu items
*/

-- Create monthly_menu table
CREATE TABLE IF NOT EXISTS monthly_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'afternoon_snack')),
  menu_items text NOT NULL,
  photo_url text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_monthly_menu_date ON monthly_menu(menu_date);

-- Create unique constraint to prevent duplicate meal types on same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_menu_date_meal_type ON monthly_menu(menu_date, meal_type);

-- Enable RLS
ALTER TABLE monthly_menu ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_menu
CREATE POLICY "Anyone authenticated can view menu"
  ON monthly_menu FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admin can insert menu"
  ON monthly_menu FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Only admin can update menu"
  ON monthly_menu FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

CREATE POLICY "Only admin can delete menu"
  ON monthly_menu FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approved = true
    )
  );

-- Create storage bucket for menu photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-photos', 'menu-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-photos bucket
CREATE POLICY "Public can view menu photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'menu-photos');

CREATE POLICY "Authenticated users can upload menu photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-photos'
    AND (storage.foldername(name))[1] = 'meals'
  );

CREATE POLICY "Admin can update menu photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'menu-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete menu photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
