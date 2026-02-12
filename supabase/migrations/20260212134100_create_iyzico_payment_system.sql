/*
  # Iyzico Ödeme Sistemi Entegrasyonu

  1. Yeni Tablolar
    - `subscription_plans` - Abonelik planları
      - `id` (uuid, primary key)
      - `name` (text) - Plan adı
      - `description` (text) - Plan açıklaması
      - `plan_type` (text) - Plan tipi (course, playgroup)
      - `price` (decimal) - Aylık fiyat
      - `duration_months` (integer) - Süre (ay)
      - `features` (jsonb) - Özellikler listesi
      - `is_active` (boolean) - Aktif mi?
      - `trial_days` (integer) - Deneme süresi (gün)
      - `max_users` (integer, nullable) - Max kullanıcı sayısı
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_subscriptions` - Kullanıcı abonelikleri
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Kullanıcı referansı
      - `subscription_plan_id` (uuid) - Plan referansı
      - `status` (text) - Durum (active, cancelled, expired, suspended)
      - `start_date` (timestamptz) - Başlangıç tarihi
      - `end_date` (timestamptz) - Bitiş tarihi
      - `next_billing_date` (timestamptz, nullable) - Sonraki ödeme tarihi
      - `iyzico_card_token` (text, nullable) - Kayıtlı kart token
      - `auto_renew` (boolean) - Otomatik yenileme
      - `failed_payment_count` (integer) - Başarısız ödeme sayısı
      - `cancelled_at` (timestamptz, nullable) - İptal tarihi
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `installment_options` - Taksit seçenekleri
      - `id` (uuid, primary key)
      - `bank_name` (text) - Banka adı
      - `card_type` (text) - Kart tipi (credit, debit)
      - `card_association` (text) - Kart kuruluşu (visa, mastercard, amex)
      - `installment_count` (integer) - Taksit sayısı
      - `installment_rate` (decimal) - Taksit oranı (%)
      - `min_amount` (decimal) - Minimum tutar
      - `is_active` (boolean) - Aktif mi?
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `payment_cards` - Kayıtlı kartlar
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Kullanıcı referansı
      - `card_token` (text) - Iyzico kart token
      - `card_alias` (text) - Kart takma adı
      - `card_family` (text) - Kart ailesi
      - `card_association` (text) - Kart kuruluşu
      - `card_bank_name` (text) - Banka adı
      - `last_four_digits` (text) - Son 4 hane
      - `is_default` (boolean) - Varsayılan mı?
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `recurring_payment_logs` - Düzenli ödeme logları
      - `id` (uuid, primary key)
      - `subscription_id` (uuid) - Abonelik referansı
      - `payment_id` (uuid, nullable) - Ödeme referansı
      - `attempt_date` (timestamptz) - Deneme tarihi
      - `status` (text) - Durum (success, failed, pending)
      - `amount` (decimal) - Tutar
      - `error_message` (text, nullable) - Hata mesajı
      - `iyzico_payment_id` (text, nullable) - Iyzico ödeme ID
      - `created_at` (timestamptz)

  2. Payments Tablosu Güncellemeleri
    - Iyzico-specific alanlar ekleniyor
    - `iyzico_payment_id` (text) - Iyzico ödeme ID
    - `iyzico_conversation_id` (text) - Iyzico konuşma ID
    - `installment_count` (integer) - Taksit sayısı
    - `payment_type` (text) - Ödeme tipi (one_time, subscription, recurring)
    - `three_ds_html_content` (text) - 3D Secure HTML içeriği

  3. Security
    - RLS politikaları tüm tablolar için etkinleştirilecek
    - Admin: Tam erişim
    - Kullanıcılar: Kendi kayıtlarını görüntüleme ve yönetme
    - Kartlar hassas bilgi olduğu için özel güvenlik
*/

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  plan_type text CHECK (plan_type IN ('course', 'playgroup')) NOT NULL,
  price decimal(10,2) NOT NULL,
  duration_months integer DEFAULT 1 CHECK (duration_months > 0),
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  trial_days integer DEFAULT 0,
  max_users integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status text CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')) DEFAULT 'active',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  next_billing_date timestamptz,
  iyzico_card_token text,
  auto_renew boolean DEFAULT true,
  failed_payment_count integer DEFAULT 0,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Installment Options Table
CREATE TABLE IF NOT EXISTS installment_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  card_type text CHECK (card_type IN ('credit', 'debit')) NOT NULL,
  card_association text CHECK (card_association IN ('visa', 'mastercard', 'amex', 'troy')) NOT NULL,
  installment_count integer NOT NULL CHECK (installment_count >= 1 AND installment_count <= 9),
  installment_rate decimal(5,2) DEFAULT 0 CHECK (installment_rate >= 0),
  min_amount decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bank_name, card_association, installment_count)
);

-- Payment Cards Table
CREATE TABLE IF NOT EXISTS payment_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  card_token text NOT NULL,
  card_alias text NOT NULL,
  card_family text DEFAULT '',
  card_association text NOT NULL,
  card_bank_name text NOT NULL,
  last_four_digits text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, card_token)
);

-- Recurring Payment Logs Table
CREATE TABLE IF NOT EXISTS recurring_payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE NOT NULL,
  payment_id uuid REFERENCES payments(id),
  attempt_date timestamptz DEFAULT now(),
  status text CHECK (status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
  amount decimal(10,2) NOT NULL,
  error_message text,
  iyzico_payment_id text,
  created_at timestamptz DEFAULT now()
);

-- Add Iyzico-specific columns to existing payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'iyzico_payment_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN iyzico_payment_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'iyzico_conversation_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN iyzico_conversation_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'installment_count'
  ) THEN
    ALTER TABLE payments ADD COLUMN installment_count integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_type text DEFAULT 'one_time' CHECK (payment_type IN ('one_time', 'subscription', 'recurring'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'three_ds_html_content'
  ) THEN
    ALTER TABLE payments ADD COLUMN three_ds_html_content text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Subscription Plans
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for User Subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Installment Options
CREATE POLICY "Anyone can view active installment options"
  ON installment_options FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage installment options"
  ON installment_options FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for Payment Cards
CREATE POLICY "Users can view own cards"
  ON payment_cards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own cards"
  ON payment_cards FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Recurring Payment Logs
CREATE POLICY "Users can view own payment logs"
  ON recurring_payment_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_subscriptions WHERE user_subscriptions.id = recurring_payment_logs.subscription_id AND user_subscriptions.user_id = auth.uid()) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "System can create payment logs"
  ON recurring_payment_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON subscription_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_billing ON user_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_installment_options_bank ON installment_options(bank_name);
CREATE INDEX IF NOT EXISTS idx_payment_cards_user ON payment_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payment_logs_subscription ON recurring_payment_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_iyzico_payment_id ON payments(iyzico_payment_id);
