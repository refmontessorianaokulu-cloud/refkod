/*
  # Iyzico Ödeme Sistemi Kaldırma

  Bu migration, Iyzico ödeme entegrasyonunu tamamen kaldırır.

  1. Silinen Tablolar
    - `subscription_plans` - Abonelik planları tablosu
    - `user_subscriptions` - Kullanıcı abonelikleri tablosu
    - `installment_options` - Taksit seçenekleri tablosu
    - `payment_cards` - Kayıtlı kartlar tablosu
    - `recurring_payment_logs` - Düzenli ödeme logları tablosu

  2. Payments Tablosundan Silinen Kolonlar
    - `iyzico_payment_id` - Iyzico ödeme ID
    - `iyzico_conversation_id` - Iyzico konuşma ID
    - `installment_count` - Taksit sayısı
    - `payment_type` - Ödeme tipi
    - `three_ds_html_content` - 3D Secure HTML içeriği

  3. Silinen İndeksler ve Politikalar
    - Tüm Iyzico ile ilgili RLS politikaları
    - Performans indeksleri

  Not: Bu işlem veri kaybına neden olabilir. Üretim ortamında dikkatli kullanılmalıdır.
*/

-- Drop RLS policies first
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Anyone can view active installment options" ON installment_options;
DROP POLICY IF EXISTS "Admins can manage installment options" ON installment_options;
DROP POLICY IF EXISTS "Users can view own cards" ON payment_cards;
DROP POLICY IF EXISTS "Users can manage own cards" ON payment_cards;
DROP POLICY IF EXISTS "Users can view own payment logs" ON recurring_payment_logs;
DROP POLICY IF EXISTS "System can create payment logs" ON recurring_payment_logs;

-- Drop indexes
DROP INDEX IF EXISTS idx_subscription_plans_type;
DROP INDEX IF EXISTS idx_subscription_plans_active;
DROP INDEX IF EXISTS idx_user_subscriptions_user;
DROP INDEX IF EXISTS idx_user_subscriptions_status;
DROP INDEX IF EXISTS idx_user_subscriptions_next_billing;
DROP INDEX IF EXISTS idx_installment_options_bank;
DROP INDEX IF EXISTS idx_payment_cards_user;
DROP INDEX IF EXISTS idx_recurring_payment_logs_subscription;
DROP INDEX IF EXISTS idx_payments_iyzico_payment_id;

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS recurring_payment_logs;
DROP TABLE IF EXISTS payment_cards;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS installment_options;
DROP TABLE IF EXISTS subscription_plans;

-- Remove Iyzico columns from payments table
ALTER TABLE payments DROP COLUMN IF EXISTS iyzico_payment_id;
ALTER TABLE payments DROP COLUMN IF EXISTS iyzico_conversation_id;
ALTER TABLE payments DROP COLUMN IF EXISTS installment_count;
ALTER TABLE payments DROP COLUMN IF EXISTS payment_type;
ALTER TABLE payments DROP COLUMN IF EXISTS three_ds_html_content;
