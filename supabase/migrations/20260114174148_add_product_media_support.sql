/*
  # Ürün Medya Desteği - Fotoğraf ve Video

  1. Yeni Tablolar
    - `product_videos` - Ürün videoları
      - `id` (uuid, primary key)
      - `product_id` (uuid) - Ürün referansı
      - `video_url` (text) - Video URL (yüklenen veya YouTube/Vimeo)
      - `video_type` (text) - Video tipi (uploaded, youtube, vimeo)
      - `title` (text) - Video başlığı
      - `is_primary` (boolean) - Ana video mi?
      - `display_order` (integer) - Sıralama
      - `created_at` (timestamptz)

  2. Storage Buckets
    - `product-images` - Ürün görselleri için
    - `product-videos` - Ürün videoları için

  3. Security
    - RLS politikaları ekleniyor
    - Public read, admin write erişimi
    - Storage politikaları ile dosya yükleme/okuma izinleri
*/

-- Product Videos Table
CREATE TABLE IF NOT EXISTS product_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  video_url text NOT NULL,
  video_type text CHECK (video_type IN ('uploaded', 'youtube', 'vimeo', 'other')) DEFAULT 'uploaded',
  title text DEFAULT '',
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Product Videos
CREATE POLICY "Anyone can view product videos"
  ON product_videos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product videos"
  ON product_videos FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('product-videos', 'product-videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Product Images
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (bucket_id = 'product-images' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Storage Policies for Product Videos
CREATE POLICY "Anyone can view product videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-videos');

CREATE POLICY "Admins can upload product videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-videos' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update product videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-videos' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (bucket_id = 'product-videos' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete product videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-videos' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_videos_product ON product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_primary ON product_videos(product_id, is_primary);
