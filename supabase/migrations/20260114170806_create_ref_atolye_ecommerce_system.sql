/*
  # Ref Atölye E-Ticaret Sistemi

  1. Yeni Tablolar
    - `product_categories` - Ürün kategorileri
      - `id` (uuid, primary key)
      - `name` (text) - Kategori adı
      - `description` (text) - Kategori açıklaması
      - `parent_id` (uuid, nullable) - Üst kategori
      - `age_group` (text) - Yaş grubu (0-3, 3-6, 6+, hepsi)
      - `is_active` (boolean) - Aktif mi?
      - `display_order` (integer) - Sıralama
      - `created_at` (timestamptz)
    
    - `products` - Ürünler
      - `id` (uuid, primary key)
      - `category_id` (uuid) - Kategori referansı
      - `name` (text) - Ürün adı
      - `description` (text) - Ürün açıklaması
      - `product_type` (text) - Ürün tipi (physical, digital)
      - `base_price` (decimal) - Temel fiyat
      - `is_active` (boolean) - Aktif mi?
      - `sku` (text) - Stok kodu
      - `weight` (decimal, nullable) - Ağırlık (kg)
      - `dimensions` (jsonb, nullable) - Boyutlar {width, height, depth}
      - `tags` (text[], nullable) - Etiketler
      - `featured` (boolean) - Öne çıkan mı?
      - `created_by` (uuid) - Oluşturan
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `product_variants` - Ürün varyantları
      - `id` (uuid, primary key)
      - `product_id` (uuid) - Ürün referansı
      - `variant_name` (text) - Varyant adı (örn: "Kırmızı - Büyük")
      - `attributes` (jsonb) - Varyant özellikleri {color, size, material}
      - `price_adjustment` (decimal) - Fiyat farkı (+/-)
      - `sku` (text) - Varyant stok kodu
      - `stock_quantity` (integer) - Stok miktarı
      - `is_active` (boolean) - Aktif mi?
      - `created_at` (timestamptz)
    
    - `product_images` - Ürün görselleri
      - `id` (uuid, primary key)
      - `product_id` (uuid) - Ürün referansı
      - `image_url` (text) - Görsel URL
      - `is_primary` (boolean) - Ana görsel mi?
      - `display_order` (integer) - Sıralama
      - `created_at` (timestamptz)
    
    - `stock_movements` - Stok hareketleri
      - `id` (uuid, primary key)
      - `variant_id` (uuid) - Varyant referansı
      - `movement_type` (text) - Hareket tipi (in, out, adjustment)
      - `quantity` (integer) - Miktar
      - `notes` (text, nullable) - Notlar
      - `created_by` (uuid) - Oluşturan
      - `created_at` (timestamptz)
    
    - `online_courses` - Online kurslar
      - `id` (uuid, primary key)
      - `title` (text) - Kurs başlığı
      - `description` (text) - Kurs açıklaması
      - `instructor_name` (text) - Eğitmen adı
      - `instructor_bio` (text, nullable) - Eğitmen biyografisi
      - `price` (decimal) - Kurs fiyatı
      - `duration_hours` (integer) - Süre (saat)
      - `thumbnail_url` (text, nullable) - Kapak görseli
      - `intro_video_url` (text, nullable) - Tanıtım videosu
      - `is_active` (boolean) - Aktif mi?
      - `certificate_available` (boolean) - Sertifika var mı?
      - `created_by` (uuid) - Oluşturan
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `course_modules` - Kurs modülleri
      - `id` (uuid, primary key)
      - `course_id` (uuid) - Kurs referansı
      - `module_title` (text) - Modül başlığı
      - `module_description` (text, nullable) - Modül açıklaması
      - `display_order` (integer) - Sıralama
      - `created_at` (timestamptz)
    
    - `course_videos` - Kurs videoları
      - `id` (uuid, primary key)
      - `module_id` (uuid) - Modül referansı
      - `video_title` (text) - Video başlığı
      - `video_url` (text) - Video URL
      - `duration_minutes` (integer) - Süre (dakika)
      - `display_order` (integer) - Sıralama
      - `resources` (jsonb, nullable) - Kaynaklar/materyaller
      - `created_at` (timestamptz)
    
    - `shopping_cart` - Alışveriş sepeti
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Kullanıcı referansı
      - `product_id` (uuid, nullable) - Ürün referansı
      - `variant_id` (uuid, nullable) - Varyant referansı
      - `course_id` (uuid, nullable) - Kurs referansı
      - `quantity` (integer) - Miktar
      - `created_at` (timestamptz)
    
    - `orders` - Siparişler
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Kullanıcı referansı
      - `order_number` (text) - Sipariş numarası
      - `status` (text) - Durum (pending, confirmed, processing, shipped, delivered, cancelled)
      - `subtotal` (decimal) - Ara toplam
      - `discount_amount` (decimal) - İndirim tutarı
      - `shipping_cost` (decimal) - Kargo ücreti
      - `total_amount` (decimal) - Toplam tutar
      - `shipping_address` (jsonb) - Teslimat adresi
      - `billing_address` (jsonb) - Fatura adresi
      - `notes` (text, nullable) - Notlar
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `order_items` - Sipariş kalemleri
      - `id` (uuid, primary key)
      - `order_id` (uuid) - Sipariş referansı
      - `product_id` (uuid, nullable) - Ürün referansı
      - `variant_id` (uuid, nullable) - Varyant referansı
      - `course_id` (uuid, nullable) - Kurs referansı
      - `item_name` (text) - Ürün/kurs adı
      - `quantity` (integer) - Miktar
      - `unit_price` (decimal) - Birim fiyat
      - `total_price` (decimal) - Toplam fiyat
      - `created_at` (timestamptz)
    
    - `payments` - Ödeme işlemleri
      - `id` (uuid, primary key)
      - `order_id` (uuid) - Sipariş referansı
      - `payment_method` (text) - Ödeme yöntemi (credit_card, bank_transfer, cash)
      - `payment_status` (text) - Durum (pending, completed, failed, refunded)
      - `amount` (decimal) - Tutar
      - `transaction_id` (text, nullable) - İşlem ID
      - `payment_date` (timestamptz, nullable) - Ödeme tarihi
      - `created_at` (timestamptz)
    
    - `shipping_info` - Kargo bilgileri
      - `id` (uuid, primary key)
      - `order_id` (uuid) - Sipariş referansı
      - `carrier` (text) - Kargo firması
      - `tracking_number` (text, nullable) - Takip numarası
      - `shipping_date` (timestamptz, nullable) - Kargo tarihi
      - `estimated_delivery` (timestamptz, nullable) - Tahmini teslimat
      - `actual_delivery` (timestamptz, nullable) - Gerçek teslimat
      - `notes` (text, nullable) - Notlar
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_course_enrollments` - Kullanıcı kurs kayıtları
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Kullanıcı referansı
      - `course_id` (uuid) - Kurs referansı
      - `order_id` (uuid) - Sipariş referansı
      - `enrollment_date` (timestamptz) - Kayıt tarihi
      - `completion_percentage` (integer) - Tamamlanma yüzdesi
      - `certificate_issued` (boolean) - Sertifika verildi mi?
      - `certificate_url` (text, nullable) - Sertifika URL
      - `last_accessed` (timestamptz, nullable) - Son erişim
      - `created_at` (timestamptz)
    
    - `course_progress` - Kurs ilerleme takibi
      - `id` (uuid, primary key)
      - `enrollment_id` (uuid) - Kayıt referansı
      - `video_id` (uuid) - Video referansı
      - `completed` (boolean) - Tamamlandı mı?
      - `watch_time_seconds` (integer) - İzlenme süresi
      - `completed_at` (timestamptz, nullable) - Tamamlanma tarihi
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `product_reviews` - Ürün yorumları
      - `id` (uuid, primary key)
      - `product_id` (uuid, nullable) - Ürün referansı
      - `course_id` (uuid, nullable) - Kurs referansı
      - `user_id` (uuid) - Kullanıcı referansı
      - `rating` (integer) - Puan (1-5)
      - `title` (text, nullable) - Başlık
      - `comment` (text) - Yorum
      - `images` (text[], nullable) - Görseller
      - `is_verified_purchase` (boolean) - Onaylı alışveriş mi?
      - `is_approved` (boolean) - Onaylandı mı?
      - `helpful_count` (integer) - Yararlı sayısı
      - `created_at` (timestamptz)
    
    - `discount_coupons` - İndirim kuponları
      - `id` (uuid, primary key)
      - `code` (text) - Kupon kodu
      - `description` (text) - Açıklama
      - `discount_type` (text) - İndirim tipi (percentage, fixed_amount)
      - `discount_value` (decimal) - İndirim değeri
      - `min_purchase_amount` (decimal, nullable) - Min. alışveriş tutarı
      - `max_discount_amount` (decimal, nullable) - Max. indirim tutarı
      - `usage_limit` (integer, nullable) - Kullanım limiti
      - `usage_count` (integer) - Kullanım sayısı
      - `valid_from` (timestamptz) - Geçerlilik başlangıç
      - `valid_until` (timestamptz) - Geçerlilik bitiş
      - `is_active` (boolean) - Aktif mi?
      - `created_by` (uuid) - Oluşturan
      - `created_at` (timestamptz)

  2. Security
    - RLS politikaları tüm tablolar için eklenecek
    - Admin: Tam erişim
    - Kullanıcılar: Kendi kayıtlarını görüntüleme ve yönetme
    - Misafirler: Ürünleri ve kursları görüntüleme
*/

-- Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  parent_id uuid REFERENCES product_categories(id),
  age_group text CHECK (age_group IN ('0-3', '3-6', '6+', 'all')) DEFAULT 'all',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES product_categories(id),
  name text NOT NULL,
  description text DEFAULT '',
  product_type text CHECK (product_type IN ('physical', 'digital')) DEFAULT 'physical',
  base_price decimal(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  sku text UNIQUE NOT NULL,
  weight decimal(10,2),
  dimensions jsonb,
  tags text[],
  featured boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  attributes jsonb DEFAULT '{}',
  price_adjustment decimal(10,2) DEFAULT 0,
  sku text UNIQUE NOT NULL,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Stock Movements Table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES product_variants(id),
  movement_type text CHECK (movement_type IN ('in', 'out', 'adjustment')) NOT NULL,
  quantity integer NOT NULL,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Online Courses Table
CREATE TABLE IF NOT EXISTS online_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  instructor_name text NOT NULL,
  instructor_bio text,
  price decimal(10,2) NOT NULL,
  duration_hours integer DEFAULT 0,
  thumbnail_url text,
  intro_video_url text,
  is_active boolean DEFAULT true,
  certificate_available boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Course Modules Table
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES online_courses(id) ON DELETE CASCADE,
  module_title text NOT NULL,
  module_description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Course Videos Table
CREATE TABLE IF NOT EXISTS course_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES course_modules(id) ON DELETE CASCADE,
  video_title text NOT NULL,
  video_url text NOT NULL,
  duration_minutes integer DEFAULT 0,
  display_order integer DEFAULT 0,
  resources jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS shopping_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  course_id uuid REFERENCES online_courses(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT cart_item_check CHECK (
    (product_id IS NOT NULL AND course_id IS NULL) OR
    (product_id IS NULL AND course_id IS NOT NULL)
  )
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  order_number text UNIQUE NOT NULL,
  status text CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  subtotal decimal(10,2) NOT NULL,
  discount_amount decimal(10,2) DEFAULT 0,
  shipping_cost decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  shipping_address jsonb NOT NULL,
  billing_address jsonb NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  course_id uuid REFERENCES online_courses(id),
  item_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  payment_method text CHECK (payment_method IN ('credit_card', 'bank_transfer', 'cash')) NOT NULL,
  payment_status text CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  amount decimal(10,2) NOT NULL,
  transaction_id text,
  payment_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Shipping Info Table
CREATE TABLE IF NOT EXISTS shipping_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  carrier text NOT NULL,
  tracking_number text,
  shipping_date timestamptz,
  estimated_delivery timestamptz,
  actual_delivery timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Course Enrollments Table
CREATE TABLE IF NOT EXISTS user_course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES online_courses(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  enrollment_date timestamptz DEFAULT now(),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  certificate_issued boolean DEFAULT false,
  certificate_url text,
  last_accessed timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Course Progress Table
CREATE TABLE IF NOT EXISTS course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES user_course_enrollments(id) ON DELETE CASCADE,
  video_id uuid REFERENCES course_videos(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  watch_time_seconds integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, video_id)
);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  course_id uuid REFERENCES online_courses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  images text[],
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT review_target_check CHECK (
    (product_id IS NOT NULL AND course_id IS NULL) OR
    (product_id IS NULL AND course_id IS NOT NULL)
  )
);

-- Discount Coupons Table
CREATE TABLE IF NOT EXISTS discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount')) NOT NULL,
  discount_value decimal(10,2) NOT NULL,
  min_purchase_amount decimal(10,2),
  max_discount_amount decimal(10,2),
  usage_limit integer,
  usage_count integer DEFAULT 0,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Product Categories (Public Read, Admin Write)
CREATE POLICY "Anyone can view active categories"
  ON product_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON product_categories FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Products (Public Read, Admin Write)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Product Variants
CREATE POLICY "Anyone can view active variants"
  ON product_variants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage variants"
  ON product_variants FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Product Images
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage images"
  ON product_images FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Stock Movements
CREATE POLICY "Admins can view stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Online Courses (Public Read, Admin Write)
CREATE POLICY "Anyone can view active courses"
  ON online_courses FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage courses"
  ON online_courses FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Course Modules
CREATE POLICY "Anyone can view course modules"
  ON course_modules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage modules"
  ON course_modules FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Course Videos
CREATE POLICY "Enrolled users can view videos"
  ON course_videos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_course_enrollments uce
      INNER JOIN course_modules cm ON cm.id = course_videos.module_id
      WHERE uce.user_id = auth.uid() AND uce.course_id = cm.course_id
    ) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage videos"
  ON course_videos FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Shopping Cart
CREATE POLICY "Users can view own cart"
  ON shopping_cart FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own cart"
  ON shopping_cart FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Order Items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- RLS Policies for Payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Shipping Info
CREATE POLICY "Users can view own shipping info"
  ON shipping_info FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = shipping_info.order_id AND orders.user_id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage shipping info"
  ON shipping_info FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for User Course Enrollments
CREATE POLICY "Users can view own enrollments"
  ON user_course_enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "System can create enrollments"
  ON user_course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update own enrollments"
  ON user_course_enrollments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Course Progress
CREATE POLICY "Users can view own progress"
  ON course_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_course_enrollments WHERE user_course_enrollments.id = course_progress.enrollment_id AND user_course_enrollments.user_id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can manage own progress"
  ON course_progress FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_course_enrollments WHERE user_course_enrollments.id = course_progress.enrollment_id AND user_course_enrollments.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_course_enrollments WHERE user_course_enrollments.id = course_progress.enrollment_id AND user_course_enrollments.user_id = auth.uid())
  );

-- RLS Policies for Product Reviews
CREATE POLICY "Anyone can view approved reviews"
  ON product_reviews FOR SELECT
  USING (is_approved = true OR user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Discount Coupons
CREATE POLICY "Users can view active coupons"
  ON discount_coupons FOR SELECT
  TO authenticated
  USING (is_active = true AND valid_from <= now() AND valid_until >= now());

CREATE POLICY "Admins can manage coupons"
  ON discount_coupons FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_module ON course_videos(module_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user ON shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON user_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON product_reviews(course_id);
