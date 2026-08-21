# E-MESEM Başvuru Sistemi — Sürüm 4.0 (Çok Kurumlu Web Uygulaması)

Mesleki Eğitim Merkezi başvurularının tek yerden toplandığı, her kurumun kendi
kullanıcı adı ve şifresiyle girdiği ve girilen bilgilerin E-MESEM formuna tek
tuşla aktarıldığı web uygulaması.

## Sürüm 4.0'da neler var?

| | Sürüm 3.x | Sürüm 4.0 |
|---|---|---|
| E-MESEM'e otomatik aktarım | Elle eşleme yapılan tarayıcı yardımcısı | Tam otomatik **E-MESEM Ön Kayıt Robotu (v9.0)** |
| Telerik RadComboBox | Destek yok | `$find` API + DropDown DOM motoru |
| Telerik RadDatePicker | Destek yok | API + Maskeli Tarih Giriş Motoru (GG.AA.YYYY) |
| Öğrenim Yılı | Dönem seçimi yok | **4 Dönemli** Öğrenim Yılı Motoru (I. / II. / III. / IV. Dönem) |
| Alan/Dal seçimi | Elle yazma | Kademeli (Cascading) cmbAlan -> cmbDal otomatik seçim |
| Yerleşik seçici haritası | Öğretme gerekli | **Sıfır konfigürasyonla** çalışan sabitlenmiş Telerik profili |
| Alan öğretme | Yok | 🎯 Akıllı Alan Öğretici & Eşleme Modu (Profil JSON dışa/içe aktarma) |
| Canlı eleman analizi | Yok | 🔬 Canlı Eleman Analizörü & Telerik DOM Dumper |
| Adım adım denetim | Yok | 🐾 Adım Adım Manuel Denetim (Step-by-Step Test Modu) |
| Sesli bildirim | Yok | 📟 Canlı Log Konsolu & Web Audio Bildirim Sistemi |
| Telefon girişi | Düz metin | 📞 Garantili Maskeli Telefon Girişi Simülatörü (+90 Maskesi) |
| Arşiv | Yok | **📦 Arşiv Sekmesi** — kayıtları ana listeden çıkarıp arşivler |
| İstatistik | Liste | Özet tablo + Excel'e ayrı "Ozet_Istatistik" sayfası |
| Komisyon | Sabit | Özelleştirilebilir **Kurum & Komisyon Ayarları** (EK-2, EK-3) |
| Resmi çıktı | En az | EK-3 Başvuru Sonuç Belgesi, EK-2 Değerlendirme Listesi, Belge Denklik Defteri, Boş Form |
| MYK Eşleştirme | Yok | MYK yeterlilik koduna göre Alan/Dal otomatik doldurma |
| Hızlı giriş | Elle | Tablo kopyala/yapıştır + Excel'den toplu aktarım |

---

## 1. Kurulum

### 1.1 Dosyaları GitHub / Vercel'e yükleyin

Proje klasörü şu yapıdadır:

```
api/                  (veri.js, kurum.js)
lib/                  (db.js, kimlik.js)
public/               (index.html, yonetim.html, emesem-yardimci.js, arsiv.js, myk-data.js)
package.json
vercel.json
README.md
```

> `node_modules` klasörünü yüklemeyin; gerekmiyor.

### 1.2 Veritabanını bağlayın (Neon)

1. [Vercel](https://vercel.com/) panelinde projenizi açın.
2. Üst menüden **Storage** → **Create Database** → **Neon** (Serverless Postgres) seçin.
3. Bölge olarak **Frankfurt (eu-central-1)** seçin (Türkiye'ye en yakın olanı).
4. **Connect** deyin ve projenize bağlayın.

Vercel, `DATABASE_URL` değişkenini projeye kendiliğinden ekler; elle bir şey
yazmanız gerekmez.

**Tablo oluşturmanız gerekmez.** Uygulama ilk istekte gerekli tabloları kendisi kurar.

### 1.3 İki gizli anahtar tanımlayın

Vercel panelinde: **Settings → Environment Variables**. Aşağıdaki iki değeri ekleyin
(hepsi için Production, Preview ve Development kutularının üçünü de işaretleyin):

| Ad | Ne işe yarar | Değer nasıl olmalı |
|---|---|---|
| `OTURUM_SIRRI` | Giriş oturumlarını imzalar | En az 32 karakter, rastgele. Değiştirirseniz herkes yeniden giriş yapar. |
| `ADMIN_ANAHTARI` | Kurum yönetim sayfasının şifresi | En az 20 karakter, rastgele. Sadece siz bilin. |

Rastgele değer üretmek için tarayıcınızın adres çubuğuna aşağıdakini yazıp
Enter'a basabilirsiniz; çıkan yazıyı kopyalayın:

```
javascript:alert(crypto.randomUUID()+crypto.randomUUID())
```

### 1.4 Yeniden yayınlayın

Vercel panelinde **Deployments** → en üstteki dağıtımın yanındaki üç nokta →
**Redeploy**. Ortam değişkenleri ancak yeni bir yayından sonra devreye girer.

### 1.5 Çalıştığını doğrulayın

Sitenizin ana adresini açın. Giriş ekranının altında:

* "BULUT ENTEGRE MOD: Kurum verileri güvenli sunucuda saklanmakta ve anlık eşitlenmektedir." yazıyorsa kurulum **tamamdır**.
* "YEREL ÇALIŞMA MODU..." yazıyorsa sunucuya ulaşılamamıştır; uygulama yine de çalışır ama veriler yalnızca o cihazda kalır.

---

## 2. Kurum hesabı açma

1. Sitenizin adresine `/yonetim.html` ekleyerek açın.
2. `ADMIN_ANAHTARI` değerini girin, **Kurumları Getir** deyin.
3. **Yeni kurum ekle** bölümünü doldurun:
   * **Kurum kodu**: kurumun giriş ekranında yazacağı ad (örn. `MILLI_MESEM`).
   * **Kurumun tam adı**: isteğe bağlı, yalnızca bu listede görünür.
   * **Şifre**: **Rastgele Şifre Üret** düğmesini kullanmanız önerilir.
4. **Kurumu Ekle** deyin. Yeşil alanda görünen şifreyi kuruma güvenli bir yolla iletin.

Bu sayfadan ayrıca:

* **Şifre Değiştir** — şifresini unutan kuruma yeni şifre verir, kayıtları etkilemez.
* **Askıya Al / Yeniden Aç** — kurumun girişini kapatır veya açar, kayıtları silinmez.
* **Kayıt sayısı** — her kurumun kaç başvuru girdiğini gösterir.

> `/yonetim.html` adresini kurumlara vermeyin. Anahtarı bilmeyen kimse bu sayfadan
> hiçbir şey yapamaz; sayfa arama motorlarına da kapatılmıştır.

---

## 3. Sistemi kullanma

1. Sitenin ana adresini açın, kurum kodu ve şifresiyle girin.
2. **Kalfalık Sınavı** / **Ustalık Sınavı** / **İş Pedagojisi Kursu** sekmeleriyle
   başvuruları yönetin.
3. Formu doldurup **Kaydet (Başvuru Ekle)** deyin. Her kayıt kaydedildiğinde
   otomatik olarak buluta eşitlenir; sağ üstteki rozet **"Bulutla eşit"** olduğunda
   veri güvendedir.
4. **Ara** kutusundan TC, ad, soyad, alan veya başvuru no ile arama yapabilirsiniz.
5. Sınav/denklik kararı verildikten sonra ✅ kutucuğunu işaretleyerek kaydı **arşive taşıyın**.

### E-MESEM Robotu (Otomatik Form Doldurma)

1. **🤖 E-MESEM Ön Kayıt Robotu** butonuna basın.
2. Açılan pencerede **Kalfalık/Ustalık/İş Pedagojisi Adaylarını Kopyala** butonlarından
   birine basın (ya da **Tümünü Kopyala**).
3. Sol taraftaki mor **⚡ E-MESEM Ön Kayıt Robotu (Sürükleyin)** bağlantısını sürükleyip
   tarayıcının **Yer İmleri çubuğuna** bırakın.
4. MEB E-MESEM sitesine gidin (`emesem.meb.gov.tr`), giriş yapın, Sınav Öğrenci Ön Kayıt ekranını açın.
5. Yer imine tıklayın — robot paneli sağ üstte açılır.
6. **📋 Panodan Al** deyin, ardından **Doldur** deyin.

Robot, Telerik RadComboBox (`$find` API + DropDown DOM motoru), RadDatePicker ve
ASP.NET AJAX UpdatePanel PostBack senkronizasyonu dahil tüm form akışını tam otomatik yürütür.
İsterseniz **🐾 Adım Adım Manuel Denetim** moduyla her adımda onay isteyerek ilerleyebilirsiniz.

### Resmi Raporlar ve Çıktılar

**📑 Resmi Rapor & Çıktılar** menüsünden:

* **EK-3 Başvuru Sonuç Belgesi** — tek aday için resmi sonuç belgesi
* **EK-2 İl Denklik Komisyonu Değerlendirme Listesi** — tüm filtrelenmiş adayların listesi
* **Belge Denklik Defteri** — denklik defteri şablonu
* **Boş Başvuru Formu** — fotoğraflı boş form

Komisyon üyeleri, dönem, belge numarası öneki gibi bilgiler **⚙️ Komisyon & Kurum Ayarları**
butonu kullanılarak özelleştirilebilir.

---

## 4. Veri güvenliği

* Şifreler veritabanında açık tutulmaz; `scrypt` ile her kuruma ayrı tuz
  kullanılarak özetlenir. Şifreyi hiç kimse, siz de dahil, geri okuyamaz.
* Her istekte oturum anahtarındaki kurum ile istenen kurum karşılaştırılır;
  eşleşmezse istek reddedilir. Kurumlar arası veri sızması bu katmanda engellenir.
* Kayıt silme işlemi veriyi hemen yok etmez, 60 gün "silindi" olarak işaretli tutar.
* **Verileri Sıfırla** işlemi öncesinde tüm kayıtların bir kopyası veritabanında
  `YEDEK_<KURUM>_<tarih>` adıyla saklanır.
* Eşitlemede her kaydın güncelleme zamanı karşılaştırılır; eski bilgi yeni bilgiyi
  asla ezemez. Aynı kaydı iki kişi aynı anda değiştirirse son kaydeden geçerli olur.
* Kişisel veri işlendiği için kurum kodlarını ve şifreleri paylaşırken KVKK
  yükümlülüklerinizi göz önünde bulundurun.

---

## 5. Sorun giderme

| Belirti | Sebebi ve çözümü |
|---|---|
| Giriş ekranında "YEREL ÇALIŞMA MODU" yazıyor | Veritabanı bağlı değil ya da değişkenlerden sonra yeniden yayın yapılmadı. Vercel → Storage'da Neon bağlı mı, Deployments'ta Redeploy yapıldı mı bakın. |
| "Kurum adı veya şifre hatalı" | Kurum kodu büyük/küçük harften etkilenmez ama boşluk yerine alt çizgi kullanılır. `/yonetim.html`'de listelenen kodu birebir yazın. |
| "Çok fazla hatalı deneme" | 5 hatalı girişten sonra hesap 15 dakika kilitlenir. Bekleyin veya yönetim sayfasından yeni şifre verin. |
| Rozet "Eşitlenmedi" olarak kalıyor | İnternet kesilmiş olabilir. Kayıtlar tarayıcının deposunda bekler; bağlantı gelince **Buluta Eşitle** deyin. |
| Yönetim sayfası "Yetkisiz" diyor | `ADMIN_ANAHTARI` yanlış veya Vercel'de tanımlı değil. |
| E-MESEM Robotu sayfada açılmıyor | Güvenlik ayarı tarayıcıda yer imlerini engelliyor olabilir. **Konsol Betiğini Kopyala (F12)** yöntemini deneyin. |
| Robot "kutu bulunamadı" diyor | E-MESEM ekranı değişmiş. **Alan Öğret** modu ile yeniden öğretin veya **Eşleşmeyi Sıfırla** deyin. |
| Excel aktarımında başlık tanınmıyor | İlk satırda alan adları Türkçe olmalı. **Başlık Satırını Panoya Kopyala** butonunu kullanarak üretilen başlığı yapıştırın. |

---

## 6. Geliştiriciler için teknik özet

```
api/veri.js               Kurum girişi ve kayıt işlemleri (ping, login, load, sync, clear)
api/kurum.js              Yönetim işlemleri (listele, ekle, sifreDegistir, durum)
lib/db.js                 Postgres bağlantısı + şemanın kendiliğinden kurulması
lib/kimlik.js             scrypt şifre özeti, HMAC imzalı oturum anahtarı
public/index.html         Tek dosyalık önyüz (HTML + CSS + JS) — ana uygulama
public/yonetim.html       Kurum yönetim paneli
public/emesem-yardimci.js E-MESEM tarayıcı robot (v9.0)
public/arsiv.js           Arşiv uyumluluk katmanı
public/myk-data.js        MYK yeterlilik listesi (Alan/Dal eşleştirmesi)
yerel-sunucu.js           Yalnızca yerel deneme için; Vercel'de kullanılmaz
```

Veritabanı tabloları: `kurumlar`, `kayitlar` (JSONB, `(kurum, id)` birincil anahtar) ve
`giris_denemeleri`. Tümü ilk istekte kendiliğinden oluşur.

Yerel çalıştırma:

```bash
npm install
DATABASE_URL=postgres://... OTURUM_SIRRI=... ADMIN_ANAHTARI=... node yerel-sunucu.js
node api-test.js          # API testleri
python3 uctan-uca.py      # tarayıcı üzerinden uçtan uca test
```

---

## 7. Dokümanlar

* `KULLANIM_KILAVUZU.md` — Sistemin baştan sona kullanımı, E-MESEM Robotu kurma
  ve **fotoğraf ekleme alanının (Alan Öğret) detaylı öğretimi** dahil.
* `KOD_AKIS.md` — Mimari, dosyalar, giriş/eşitleme/fotoğraf/robot akışları ve
  güvenlik katmanları (geliştiriciler için).

---

## 8. Kaynaklar

* [E-Mesem giriş (MEBBİS / E-Devlet)](https://emesem.meb.gov.tr/)
* [Vercel Neon Postgres kurulumu](https://vercel.com/docs/storage/vercel-postgres)
* [Vercel ortam değişkenleri](https://vercel.com/docs/projects/environment-variables)