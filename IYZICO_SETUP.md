# Iyzico Ödeme Sistemi Kurulum Rehberi

Bu proje, Iyzico ödeme gateway'i ile entegre edilmiş kapsamlı bir ödeme sistemi içermektedir. 3D Secure, tek seferlik ödemeler, taksitli ödemeler, abonelik yönetimi ve düzenli ödeme özelliklerini destekler.

## Özellikler

- ✅ 3D Secure ile güvenli ödeme
- ✅ Tek seferlik ödemeler
- ✅ Taksitli ödeme seçenekleri (9 aya kadar)
- ✅ Abonelik sistemi (Online kurslar ve oyun grupları için)
- ✅ Düzenli aylık ödemeler
- ✅ Kayıtlı kart yönetimi
- ✅ Gerçek zamanlı taksit hesaplama
- ✅ Kapsamlı admin paneli

## Kurulum Adımları

### 1. Iyzico Hesabı Oluşturma

1. [Iyzico](https://www.iyzico.com) sitesine gidin ve ücretsiz bir hesap oluşturun
2. Sandbox (test) ortamı için [Iyzico Sandbox](https://sandbox-merchant.iyzipay.com) adresine gidin
3. API anahtarlarınızı alın:
   - API Key
   - Secret Key

### 2. Environment Variables Yapılandırması

`.env` dosyanızda aşağıdaki değerleri güncelleyin:

```env
# Iyzico Payment Gateway Configuration
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

**Üretim (Production) için:**
```env
IYZICO_BASE_URL=https://api.iyzipay.com
```

### 3. Supabase Edge Functions Deploy

Edge function'ları deploy etmek için:

```bash
# Her bir fonksiyonu ayrı ayrı deploy edin
supabase functions deploy iyzico-checkout
supabase functions deploy iyzico-callback
supabase functions deploy iyzico-installment-options
supabase functions deploy iyzico-subscription-create
supabase functions deploy iyzico-recurring-payment
```

**Not:** Edge function'lar import_map.json kullanır. Deploy sırasında `--import-map supabase/functions/import_map.json` parametresini ekleyin.

### 4. Veritabanı Migration

Migration zaten uygulanmış durumda. Aşağıdaki tablolar oluşturuldu:

- `subscription_plans` - Abonelik planları
- `user_subscriptions` - Kullanıcı abonelikleri
- `installment_options` - Taksit seçenekleri
- `payment_cards` - Kayıtlı kartlar
- `recurring_payment_logs` - Düzenli ödeme logları
- `payments` - Ödeme kayıtları (Iyzico alanları eklendi)

## Kullanım

### Tek Seferlik Ödeme

1. Kullanıcı sepetine ürün/kurs ekler
2. "Siparişi Tamamla" butonuna tıklar
3. Teslimat bilgilerini doldurur
4. "Kredi Kartı" ödeme yöntemini seçer
5. Kart bilgilerini girer
6. BIN numarasına göre taksit seçenekleri otomatik yüklenir
7. Taksit seçer ve "Güvenli Ödeme Yap" butonuna tıklar
8. 3D Secure doğrulaması için yeni pencere açılır
9. Banka doğrulamasını tamamlar
10. Ödeme sonucu sayfası görüntülenir

### Abonelik Satın Alma

1. Abonelik planları sayfasına git
2. Uygun planı seç
3. Kart bilgilerini gir (kart otomatik kaydedilir)
4. İlk ödeme 3D Secure ile yapılır
5. Abonelik aktif olur
6. Sonraki ödemeler otomatik olarak her ay kayıtlı karttan çekilir

### Abonelik Planları Yönetimi (Admin)

1. Admin paneline giriş yapın
2. "Abonelik Planları" menüsüne gidin
3. "Yeni Plan" butonuna tıklayın
4. Plan bilgilerini doldurun:
   - Plan adı
   - Plan tipi (Online Kurs / Oyun Grubu)
   - Aylık ücret
   - Süre (ay)
   - Deneme süresi (gün)
   - Özellikler listesi
5. Planı aktif edin ve kaydedin

### Düzenli Ödemeler (Cron Job)

`iyzico-recurring-payment` Edge Function'ı manuel veya cron job ile çalıştırılmalıdır.

**Manuel Çalıştırma:**
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/iyzico-recurring-payment \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Cron Job ile Otomatik Çalıştırma:**

Supabase'de bir pg_cron job oluşturun:

```sql
SELECT cron.schedule(
  'process-recurring-payments',
  '0 2 * * *', -- Her gün saat 02:00'de çalışır
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/iyzico-recurring-payment',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

Bu job:
- Her gün çalışır
- `next_billing_date` bugün veya öncesi olan aktif abonelikleri bulur
- Kayıtlı kartlarla ödeme alır
- Başarılı ödemelerde aboneliği 1 ay uzatır
- Başarısız ödemelerde sayacı artırır (3 başarısız denemeden sonra abonelik askıya alınır)
- Tüm işlemleri `recurring_payment_logs` tablosuna kaydeder

## Test Kartları

Iyzico sandbox ortamında test için kullanabileceğiniz kartlar:

### Başarılı İşlem
```
Kart Numarası: 5528790000000008
Son Kullanma: 12/30
CVV: 123
3D Secure Şifre: 123456
```

### Başarısız İşlem
```
Kart Numarası: 5406670000000009
Son Kullanma: 12/30
CVV: 123
```

### Taksit Testi
```
Kart Numarası: 5451030000000003 (Bonus)
Son Kullanma: 12/30
CVV: 123
```

## API Endpoints

### 1. Checkout (3D Secure Başlatma)
```
POST /functions/v1/iyzico-checkout
Authorization: Bearer SUPABASE_ANON_KEY
Content-Type: application/json

{
  "orderId": "uuid",
  "orderItems": [...],
  "buyer": {...},
  "shippingAddress": {...},
  "billingAddress": {...},
  "price": "100.00",
  "paidPrice": "100.00",
  "installment": 1,
  "cardDetails": {...},
  "conversationId": "unique-id",
  "callbackUrl": "https://..."
}
```

### 2. Callback (3D Secure Sonuç)
```
POST /functions/v1/iyzico-callback
(Form data from Iyzico)
```

### 3. Taksit Seçenekleri
```
POST /functions/v1/iyzico-installment-options
Authorization: Bearer SUPABASE_ANON_KEY
Content-Type: application/json

{
  "binNumber": "552879",
  "price": "100.00"
}
```

### 4. Abonelik Oluşturma
```
POST /functions/v1/iyzico-subscription-create
Authorization: Bearer SUPABASE_ANON_KEY
Content-Type: application/json

{
  "userId": "uuid",
  "subscriptionPlanId": "uuid",
  "buyer": {...},
  "shippingAddress": {...},
  "billingAddress": {...},
  "cardDetails": {...},
  "callbackUrl": "https://..."
}
```

### 5. Düzenli Ödeme İşlemi
```
POST /functions/v1/iyzico-recurring-payment
Authorization: Bearer SERVICE_ROLE_KEY

(Body gerekmez, otomatik çalışır)
```

## Güvenlik Notları

1. **API Anahtarları:** API Key ve Secret Key'i asla frontend kodunda kullanmayın. Sadece Edge Function'larda kullanın.

2. **Service Role Key:** Recurring payment fonksiyonu için Service Role Key gereklidir. Bu key'i güvenli tutun.

3. **3D Secure:** Tüm ödemeler 3D Secure ile korunmaktadır. Bu zorunlu bir güvenlik katmanıdır.

4. **Kart Saklama:** Kart bilgileri Iyzico'da token olarak saklanır. Gerçek kart numarası asla veritabanınıza kaydedilmez.

5. **PCI DSS:** Tüm işlemler PCI DSS uyumludur.

## Sorun Giderme

### Edge Function Deploy Hatası

Eğer edge function deploy edilirken hata alırsanız:

1. Supabase CLI'ın güncel olduğundan emin olun
2. Import map'in doğru konumda olduğunu kontrol edin
3. Manuel deploy deneyin:
```bash
cd supabase/functions/iyzico-checkout
supabase functions deploy iyzico-checkout --import-map ../import_map.json
```

### Ödeme Başarısız Oluyor

1. Sandbox ortamında olduğunuzdan emin olun
2. Test kartlarını kullandığınızdan emin olun
3. API anahtarlarının doğru olduğunu kontrol edin
4. Edge function loglarını kontrol edin:
```bash
supabase functions logs iyzico-checkout
```

### Taksit Seçenekleri Gelmiyor

1. BIN numarasının (ilk 6 hane) doğru girildiğinden emin olun
2. Minimum tutar kontrolünü kontrol edin
3. Iyzico sandbox'ta taksit ayarlarını kontrol edin

## Üretim (Production) Geçişi

1. `.env` dosyasında `IYZICO_BASE_URL`'i production URL ile değiştirin
2. Production API anahtarlarını alın ve güncelleyin
3. Gerçek kart ile test edin
4. Webhook URL'lerini Iyzico dashboard'dan ayarlayın
5. Cron job'u üretim ortamında aktif edin

## Destek

Herhangi bir sorun yaşarsanız:

1. [Iyzico Dökümantasyonu](https://dev.iyzipay.com)
2. [Iyzico Destek](https://www.iyzico.com/destek)
3. Proje README dosyası

## Lisans

Bu proje MIT lisansı altındadır.
