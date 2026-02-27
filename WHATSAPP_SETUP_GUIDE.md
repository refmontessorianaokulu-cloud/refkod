# WhatsApp Business API Kurulum Rehberi

Bu rehber, oyun grubu rezervasyonları için WhatsApp bildirimi sistemini aktif hale getirmek için gerekli adımları açıklar.

## Sistem Özeti

Sistem şu şekilde çalışır:
1. Admin, oyun grubu rezervasyonunu onaylar ve ödeme linki ekler
2. Otomatik olarak veritabanı trigger'ı tetiklenir
3. Edge Function (`send-play-group-whatsapp`) çalışır
4. Velinin telefon numarasına WhatsApp mesajı gönderilir

## Gereksinimler

- Meta (Facebook) Business hesabı
- WhatsApp Business hesabı
- Doğrulanmış telefon numarası: **05315504454**
- Supabase project erişimi

## Adım 1: Meta for Developers Kurulumu

### 1.1 Meta for Developers Hesabı Oluşturma

1. https://developers.facebook.com adresine gidin
2. Facebook hesabınızla giriş yapın (yoksa oluşturun)
3. "Get Started" veya "Create App" butonuna tıklayın

### 1.2 WhatsApp Business App Oluşturma

1. "Create App" butonuna tıklayın
2. "Business" veya "Other" kategorisini seçin
3. Uygulama adı girin (örn: "Ref Çocuk Akademisi WhatsApp")
4. İş e-posta adresi girin
5. Business Account seçin veya yeni oluşturun

### 1.3 WhatsApp Product Ekleme

1. Dashboard'da "Add Product" bölümüne gidin
2. "WhatsApp" ürününü bulun ve "Set Up" butonuna tıklayın
3. WhatsApp Business API setup sayfası açılacak

## Adım 2: WhatsApp Telefon Numarası Yapılandırması

### 2.1 Telefon Numarası Ekleme

1. WhatsApp API Dashboard'da "Phone Numbers" sekmesine gidin
2. "Add Phone Number" butonuna tıklayın
3. Telefon numaranızı girin: **05315504454**
4. SMS veya telefon ile doğrulama yapın
5. İşletme profili bilgilerini doldurun:
   - İşletme adı: **Ref Çocuk Akademisi**
   - Kategori: Eğitim/Anaokulu
   - Açıklama: Oyun grubu ve eğitim hizmetleri

### 2.2 Phone Number ID Alma

1. WhatsApp API Dashboard'da telefon numaranızın yanında "Phone Number ID" göreceksiniz
2. Bu numarayı kopyalayın (örn: `123456789012345`)
3. Güvenli bir yere not edin

## Adım 3: Access Token Alma

### 3.1 Geçici Token (Test için)

1. WhatsApp API Dashboard'da "API Setup" sekmesine gidin
2. "Temporary access token" bölümünde token'ı göreceksiniz
3. "Copy" butonuna tıklayarak kopyalayın
4. **Not**: Geçici token 24 saat geçerlidir

### 3.2 Kalıcı Token (Üretim için - ÖNERİLİR)

1. Meta Business Suite'e gidin (business.facebook.com)
2. "System Users" bölümüne gidin
3. "Add" butonuna tıklayarak yeni sistem kullanıcısı oluşturun
4. İsim verin (örn: "WhatsApp API User")
5. "Admin" rolünü seçin
6. "Generate New Token" butonuna tıklayın
7. WhatsApp uygulamanızı seçin
8. Şu izinleri seçin:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
9. Token'ı oluşturun ve güvenli bir yere kaydedin

## Adım 4: Supabase Secret'larını Ekleme

### 4.1 Supabase Dashboard ile Ekleme (Kolay Yöntem)

1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin
3. Sol menüden **"Project Settings"** (⚙️) > **"Edge Functions"** bölümüne gidin
4. **"Secrets"** sekmesine tıklayın
5. **"Add Secret"** butonuna tıklayın
6. İlk secret'ı ekleyin:
   - Name: `WHATSAPP_API_TOKEN`
   - Value: Meta'dan aldığınız Access Token'ı yapıştırın
   - "Create" butonuna tıklayın
7. İkinci secret'ı ekleyin:
   - Name: `WHATSAPP_PHONE_NUMBER_ID`
   - Value: Meta'dan aldığınız Phone Number ID'yi yapıştırın
   - "Create" butonuna tıklayın

### 4.2 Supabase CLI ile Ekleme (Alternatif Yöntem)

```bash
# Supabase CLI kurulu değilse:
npm install -g supabase

# Supabase'e login olun:
npx supabase login

# Secret'ları ekleyin:
npx supabase secrets set WHATSAPP_API_TOKEN="your_access_token_here"
npx supabase secrets set WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id_here"

# Secret'ların eklendiğini doğrulayın:
npx supabase secrets list
```

## Adım 5: Test ve Doğrulama

### 5.1 Test Mesajı Gönderme

1. Admin paneline giriş yapın
2. "Oyun Grubu Yönetimi" bölümüne gidin
3. Yeni bir rezervasyon oluşturun:
   - Veli telefon numarası: Test telefon numaranız
   - Çocuk bilgileri
   - Oturum tarihi ve saati
4. "Onayla" butonuna tıklayın
5. Ödeme linki ekleyin
6. WhatsApp mesajının geldiğini kontrol edin

### 5.2 Log Kontrolü

1. Supabase Dashboard'da "Edge Functions" bölümüne gidin
2. "send-play-group-whatsapp" fonksiyonunu seçin
3. "Logs" sekmesine tıklayın
4. Mesaj gönderim loglarını kontrol edin:
   - Başarılı: "WhatsApp message sent successfully"
   - Hatalı: Hata mesajını okuyun ve düzeltin

### 5.3 Yaygın Hatalar ve Çözümleri

**Hata**: "WhatsApp API credentials not configured"
- **Çözüm**: Secret'ların doğru eklendiğinden emin olun

**Hata**: "Invalid access token"
- **Çözüm**: Token'ın geçerli olduğunu kontrol edin (geçici token 24 saat geçerlidir)

**Hata**: "Phone number not registered"
- **Çözüm**: Telefon numarasının WhatsApp Business'a kayıtlı olduğunu doğrulayın

**Hata**: "Message template not approved"
- **Çözüm**: Meta Business'ta mesaj şablonunu onaylatın (üretim kullanımı için gerekli)

## Adım 6: Üretim Kullanımı

### 6.1 Meta Business Doğrulaması

Test modundan çıkıp üretim kullanımına geçmek için:

1. Meta Business Suite'de işletmenizi doğrulayın
2. Resmi belgeler yükleyin (vergi levhası, ticaret sicil vb.)
3. Business verification süreci 1-5 iş günü sürebilir

### 6.2 Mesaj Şablonları (Template Messages)

Üretim ortamında Meta, mesajların önceden onaylanmış şablonlar kullanmasını gerektirir:

1. WhatsApp Manager'a gidin
2. "Message Templates" bölümüne gidin
3. "Create Template" butonuna tıklayın
4. Mevcut mesaj formatını şablon olarak ekleyin:

```
Merhaba {{1}}, {{2}} için {{3}}'lı oyun grubu rezervasyonunuz onaylanmıştır.

Tarih: {{4}}
Saat: {{5}}

Ödeme Linki: {{6}}

Ref Çocuk Akademisi
```

5. Şablonu onaya gönderin (genellikle birkaç saat içinde onaylanır)
6. Onaylanan şablon adını not edin
7. Edge Function kodunu şablon kullanacak şekilde güncelleyin (gerekirse)

### 6.3 Ücretlendirme

- **Test Modu**: Ücretsiz, 1000 mesaj/ay limiti, sadece kayıtlı test numaralarına
- **Üretim Modu**:
  - İlk 1000 konuşma/ay ücretsiz
  - Sonrası konuşma başına ücret (Türkiye için ~$0.05-0.10/konuşma)
  - Ödeme yöntemi eklemeniz gerekir

## Mesaj Formatı

Sistem aşağıdaki formatta WhatsApp mesajı gönderir:

```
Merhaba [Veli Adı], [Çocuk Adı] için [Tema]'lı oyun grubu rezervasyonunuz onaylanmıştır.

Tarih: [DD.MM.YYYY]
Saat: [HH:MM]

Ödeme Linki: [URL]

Ref Çocuk Akademisi
```

## Teknik Detaylar

### Edge Function Endpoint

```
https://[your-project-id].supabase.co/functions/v1/send-play-group-whatsapp
```

### Gerekli Environment Variables

- `WHATSAPP_API_TOKEN`: Meta Access Token
- `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp Business Phone Number ID

### Veritabanı Trigger

Trigger otomatik olarak `play_group_bookings` tablosunda `payment_link` güncellendiğinde tetiklenir.

## Destek ve Kaynaklar

- [Meta for Developers WhatsApp Docs](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Business API Getting Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [WhatsApp Business Manager](https://business.facebook.com/wa/manage/)

## Güvenlik Notları

- Access Token'ınızı asla kod içinde saklamayın
- Secret'ları sadece Supabase environment variables olarak saklayın
- Kalıcı token kullanın (geçici token test için uygundur)
- Token'ları düzenli olarak yenileyin (güvenlik için)
- Meta Business hesabınızda 2FA aktif edin

## Sorun Giderme Checklist

- [ ] Meta for Developers hesabı oluşturuldu
- [ ] WhatsApp Business App oluşturuldu
- [ ] Telefon numarası (05315504454) doğrulandı
- [ ] Phone Number ID alındı
- [ ] Access Token oluşturuldu
- [ ] Supabase secret'lar eklendi (WHATSAPP_API_TOKEN)
- [ ] Supabase secret'lar eklendi (WHATSAPP_PHONE_NUMBER_ID)
- [ ] Edge Function deploy edildi
- [ ] Test mesajı başarıyla gönderildi
- [ ] Meta Business doğrulaması yapıldı (üretim için)
- [ ] Mesaj şablonları onaylandı (üretim için)

---

**Son Güncelleme**: 27 Şubat 2026
**Edge Function**: `send-play-group-whatsapp`
**Trigger**: `notify_parent_on_booking_approval`
