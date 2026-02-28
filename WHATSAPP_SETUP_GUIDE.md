# Manuel WhatsApp Business Kullanım Rehberi

Bu rehber, oyun grubu rezervasyonları için manuel WhatsApp Business bildirimlerinin nasıl kullanılacağını açıklar.

## Sistem Özeti

Sistem şu şekilde çalışır:
1. Admin, oyun grubu rezervasyonunu onaylar ve ödeme linki ekler
2. Rezervasyon detayları sayfasında "WhatsApp ile Bildir" butonu görünür
3. Admin butona tıkladığında WhatsApp Web/App açılır
4. Mesaj otomatik olarak hazırlanmış halde gelir
5. Admin "Gönder" butonuna basarak mesajı gönderir

## Avantajlar

- Hızlı ve kolay kurulum (API token'a gerek yok)
- Meta Business doğrulaması gerektirmez
- Ücretsiz (WhatsApp Business API ücretlendirmesi yok)
- Anında çalışır
- Mesaj şablonu onayı gerektirmez
- Telefon numarası kayıt sorunları yaşanmaz

## Gereksinimler

- WhatsApp Business uygulaması (mobil veya web)
- İşletme telefon numarası: **05315504454**
- Telefon numarası WhatsApp'a kayıtlı olmalı

## Kurulum Adımları

### 1. WhatsApp Business Kurulumu

#### Mobil Kurulum (Önerilen)
1. App Store veya Google Play'den "WhatsApp Business" uygulamasını indirin
2. Uygulamayı açın ve telefon numaranızı girin: **05315504454**
3. SMS ile doğrulama kodunu alın ve girin
4. İşletme profili oluşturun:
   - İşletme adı: **Ref Çocuk Akademisi**
   - Kategori: Eğitim/Anaokulu
   - Açıklama: Oyun grubu ve eğitim hizmetleri
   - Çalışma saatleri, adres, web sitesi gibi bilgileri ekleyin

#### Web Kurulumu
1. https://web.whatsapp.com adresine gidin
2. Mobil telefonunuzdan QR kodu okutun
3. Web üzerinden mesaj gönderebilirsiniz

### 2. Sistem Kullanımı

#### 2.1 Rezervasyon Onaylama
1. Admin paneline giriş yapın
2. "Oyun Grubu Yönetimi" bölümüne gidin
3. Onaylamak istediğiniz rezervasyona tıklayın
4. Ödeme linki alanına ödeme URL'ini yapıştırın
5. "Onayla" butonuna tıklayın

#### 2.2 WhatsApp Mesajı Gönderme
1. Rezervasyon onaylandıktan sonra "WhatsApp ile Bildir" butonu görünür
2. Butona tıklayın
3. WhatsApp açılır ve mesaj otomatik olarak hazırlanır:
   ```
   Merhaba [Veli Adı], [Çocuk Adı] için [Tema]'lı oyun grubu rezervasyonunuz onaylanmıştır.

   Tarih: [DD.MM.YYYY]
   Saat: [HH:MM]

   Ödeme Linki: [URL]

   Ref Çocuk Akademisi
   ```
4. Mesajı kontrol edin (gerekirse düzenleyin)
5. "Gönder" butonuna basın

## Mesaj Formatı

Sistem aşağıdaki formatta WhatsApp mesajı hazırlar:

```
Merhaba [Veli Adı], [Çocuk Adı] için [Tema]'lı oyun grubu rezervasyonunuz onaylanmıştır.

Tarih: [DD.MM.YYYY]
Saat: [HH:MM]

Ödeme Linki: [URL]

Ref Çocuk Akademisi
```

Örnek:
```
Merhaba Ayşe Yılmaz, Mehmet için Yaratıcı Sanat Etkinliği'li oyun grubu rezervasyonunuz onaylanmıştır.

Tarih: 15 Mart 2026
Saat: 14:00

Ödeme Linki: https://example.com/payment/abc123

Ref Çocuk Akademisi
```

## İpuçları

### Hızlı Mesaj Gönderme
- Birden fazla rezervasyon için sırayla "WhatsApp ile Bildir" butonuna tıklayın
- Her mesaj yeni sekmede açılır
- Mesajları kontrol edip hızlıca gönderin

### Toplu Mesaj Gönderme
- WhatsApp Business'ın "Yayın Listeleri" özelliğini kullanabilirsiniz
- Ancak her veli için özel bilgi (çocuk adı, tarih vb.) farklı olduğu için tek tek göndermek daha uygundur

### Mesaj Şablonları (İsteğe Bağlı)
WhatsApp Business'ta "Hızlı Yanıtlar" oluşturabilirsiniz:
1. WhatsApp Business > Ayarlar > İş Ayarları > Hızlı Yanıtlar
2. Yeni yanıt ekleyin
3. Kısayol: `/oyungrubu`
4. Mesaj: Yukarıdaki format (ihtiyaç halinde manuel değiştirin)

### Otomatik Yanıtlar
WhatsApp Business'ta otomatik mesajlar ayarlayabilirsiniz:
- **Karşılama Mesajı**: İlk kez yazan velilere otomatik yanıt
- **Dışarıdayken Mesajı**: Çalışma saatleri dışında otomatik yanıt
- **Hızlı Yanıtlar**: Sık sorulan sorular için hazır cevaplar

## Teknik Detaylar

### WhatsApp Link Formatı
Sistem `wa.me` API'sini kullanır:
```
https://wa.me/90XXXXXXXXXX?text=[mesaj]
```

### Telefon Numarası Formatı
- Kullanıcı numarası: `05XX XXX XX XX` formatında girerse
- Sistem otomatik olarak: `90XXXXXXXXXX` formatına çevirir
- WhatsApp için uluslararası format gereklidir

### Güvenlik
- Ödeme linkleri URL encode edilir
- Kişisel bilgiler güvenli şekilde iletilir
- Mesajlar sadece ilgili veli numarasına gönderilir

## WhatsApp Business API'ye Geçiş (İsteğe Bağlı)

İleride tamamen otomatik sistem istiyorsanız WhatsApp Business API'ye geçebilirsiniz:

### API Avantajları
- Tam otomatik mesaj gönderimi (admin tıklaması gerektirmez)
- Toplu mesaj gönderme
- Mesaj raporlama ve analitik
- CRM entegrasyonu

### API Dezavantajları
- Meta Business doğrulaması gerekli
- Telefon numarası kayıt süreci
- Aylık ücretlendirme (1000 konuşma sonrası)
- Mesaj şablonu onayı gerekli
- Karmaşık kurulum

Eğer ileride API'ye geçmek isterseniz, mevcut sistem ile paralel çalışabilir.

## Sorun Giderme

### WhatsApp Açılmıyor
- **Çözüm**: WhatsApp Business uygulamasının yüklü olduğundan emin olun
- Alternatif: WhatsApp Web (web.whatsapp.com) kullanın

### Mesaj Bozuk Görünüyor
- **Çözüm**: Tarayıcınızı güncelleyin
- Alternatif: Farklı tarayıcı deneyin (Chrome önerilir)

### Telefon Numarası Hatalı
- **Çözüm**: Velinin telefon numarasını doğru formatta girin
- Format: 05XX XXX XX XX veya +90 5XX XXX XX XX

### Ödeme Linki Çalışmıyor
- **Çözüm**: Ödeme linkinin tam URL olduğundan emin olun
- Örnek: `https://example.com/payment/abc123`

## Destek ve Kaynaklar

- [WhatsApp Business Kullanım Kılavuzu](https://www.whatsapp.com/business)
- [WhatsApp Business İndirme](https://www.whatsapp.com/business/download)
- [WhatsApp Web](https://web.whatsapp.com)

## Güvenlik Notları

- WhatsApp Business hesabınızı güvende tutun
- İki faktörlü kimlik doğrulamayı (2FA) aktif edin
- Ödeme linklerini güvenli kaynaklardan alın
- Veli telefon numaralarını gizli tutun

## Kullanım Checklist

- [ ] WhatsApp Business uygulaması kuruldu
- [ ] İşletme telefon numarası (05315504454) eklendi
- [ ] İşletme profili oluşturuldu
- [ ] WhatsApp Web bağlantısı yapıldı (isteğe bağlı)
- [ ] Test rezervasyonu oluşturuldu
- [ ] Test WhatsApp mesajı gönderildi
- [ ] Mesaj veliye ulaştı

---

**Son Güncelleme**: 28 Şubat 2026
**Sistem**: Manuel WhatsApp Business (wa.me API)
**Telefon**: 05315504454
