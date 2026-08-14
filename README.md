# E-MESEM Başvuru Sistemi — Sürüm 3.0 (Çok Kurumlu Web Uygulaması)

Mesleki Eğitim Merkezi başvurularının tek yerden toplandığı, her kurumun kendi
kullanıcı adı ve şifresiyle girdiği ve girilen bilgilerin E-MESEM formuna tek
tuşla aktarıldığı web uygulaması.

Bu sürümde neler değişti:

| | Sürüm 2.x | Sürüm 3.0 |
|---|---|---|
| Veri nerede durur | Tarayıcı + Google Sheets | Postgres veritabanı (Neon) |
| Kurum ayrımı | Yok | Her kurum ayrı hesap, verisi başkasına görünmez |
| Ortak çalışma | Sheets üzerinden | Aynı kurumdaki herkes aynı listeyi anında görür |
| Kurum yönetimi | Elle | `/yonetim.html` sayfası |
| E-MESEM'e aktarım | Elle yazma | Tarayıcı yardımcısı ile otomatik doldurma |

---

## 1. Kurulum (yaklaşık 15 dakika, kod yazmak gerekmez)

### 1.1 Dosyaları GitHub deposuna yükleyin

Şu anda deponuzda (`mesem-basvuru-sistemi`) tek bir `index.html` var. Bunun yerine
bu klasördeki tüm dosya ve klasörleri yükleyeceksiniz.

Tarayıcıdan yükleme yolu:

1. GitHub'da deponuzu açın.
2. Eski `index.html` dosyasına tıklayın → sağ üstteki çöp kutusu simgesi →
   sayfanın altındaki **Commit changes** ile silin. (Yeni sürüm `public/index.html`
   olarak yükleneceği için kökte kalmasına gerek yok.)
3. **Add file → Upload files** deyin.
4. Bilgisayarınızdaki proje klasörünü açın ve şu öğeleri sürükleyip bırakın:

   ```
   api/            (veri.js, kurum.js)
   lib/            (db.js, kimlik.js)
   public/         (index.html, yonetim.html, emesem-yardimci.js)
   package.json
   vercel.json
   README.md
   ```

   > Klasörleri sürükleyip bıraktığınızda GitHub klasör yapısını korur.
   > `node_modules` klasörünü **yüklemeyin**; gerekmiyor.

5. Alttaki **Commit changes** düğmesine basın.

### 1.2 Veritabanını bağlayın (Neon)

1. [Vercel](https://vercel.com/) panelinde projenizi açın.
2. Üst menüden **Storage** → **Create Database** → **Neon** (Serverless Postgres) seçin.
3. Bölge olarak **Frankfurt (eu-central-1)** seçin (Türkiye'ye en yakın olanı, en hızlı yanıt verir).
4. **Connect** deyin ve projenize bağlayın.

Vercel, `DATABASE_URL` değişkenini projeye kendiliğinden ekler; elle bir şey
yazmanız gerekmez. Neon'un ücretsiz kademesi bu uygulama için fazlasıyla yeterlidir.

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

Ya da hazır bir çevrimiçi üretici kullanın. Bu iki değeri bir kere üretip
güvenli bir yere (örneğin kurumun şifre kasasına) kaydedin.

### 1.4 Yeniden yayınlayın

Vercel panelinde **Deployments** → en üstteki dağıtımın yanındaki üç nokta →
**Redeploy**. Ortam değişkenleri ancak yeni bir yayından sonra devreye girer.

### 1.5 Çalıştığını doğrulayın

Sitenizin adresine `/api/veri` ekleyip açmayın (o adres yalnızca POST kabul eder).
Bunun yerine doğrudan sitenizin ana adresini açın. Giriş ekranının altında

* "Sürüm 3.0 - kurum verileri sunucuda saklanır..." yazıyorsa kurulum **tamamdır**.
* "YEREL MOD: Sunucuya ulaşılamadı..." yazıyorsa veritabanı bağlanmamış veya
  yeniden yayın yapılmamıştır. Bu durumda uygulama çalışmaya devam eder ama veriler
  yalnızca o bilgisayarda kalır.

---

## 2. Kurum hesabı açma

1. Sitenizin adresine `/yonetim.html` ekleyerek açın
   (örnek: `https://siteniz.vercel.app/yonetim.html`).
2. `ADMIN_ANAHTARI` değerini girin, **Kurumları Getir** deyin.
3. **Yeni kurum ekle** bölümünü doldurun:
   * **Kurum kodu**: kurumun giriş ekranında yazacağı ad (örn. `ANKARA_MESEM`).
     Büyük harfe çevrilir, boşluklar alt çizgi olur.
   * **Kurumun tam adı**: isteğe bağlı, yalnızca bu listede görünür.
   * **Şifre**: **Rastgele Şifre Üret** düğmesini kullanmanız önerilir.
4. **Kurumu Ekle** deyin. Yeşil kutuda görünen şifreyi kuruma güvenli bir yolla
   iletin — bu şifre bir daha görüntülenemez (veritabanında yalnızca özeti tutulur).

Bu sayfadan ayrıca:

* **Şifre Değiştir** — şifresini unutan kuruma yeni şifre verir, kayıtları etkilemez.
* **Askıya Al / Yeniden Aç** — kurumun girişini kapatır veya açar, kayıtları silinmez.
* **Kayıt sayısı** — her kurumun kaç başvuru girdiğini gösterir.

> `/yonetim.html` adresini kurumlara vermeyin. Anahtarı bilmeyen kimse bu sayfadan
> hiçbir şey yapamaz; sayfa arama motorlarına da kapatılmıştır.

---

## 3. Kurumlar sistemi nasıl kullanır

1. Sitenin ana adresini açar, kurum kodu ve şifresiyle girer.
2. Başvuruları girer. Her kayıt kaydedildiğinde sunucuya kendiliğinden gönderilir;
   sağ üstteki rozet **"Bulutla eşit"** olduğunda veri güvendedir.
3. Aynı kurumdan başka bir bilgisayar giriş yaptığında aynı listeyi görür.
   **Buluta Eşitle** düğmesi listeyi anında tazeler.
4. Bir kurumun verisi başka bir kuruma **hiçbir koşulda** görünmez.

Oturum 8 saat sonra kendiliğinden düşer, yeniden giriş gerekir.
Şifre 5 kez hatalı girilirse hesap 15 dakika kilitlenir.

---

## 4. E-MESEM'e otomatik aktarım

E-MESEM'in dışa açık bir veri aktarım servisi (API) veya toplu Excel yükleme
özelliği bulunmuyor; giriş yalnızca MEBBİS ve e-Devlet üzerinden yapılıyor.
Bu nedenle aktarım, E-MESEM ekranında çalışan küçük bir **tarayıcı yardımcısı**
ile yapılır. Yardımcı, kaydın alanlarını E-MESEM formundaki kutulara yazar;
kaydetme tuşuna siz basarsınız, böylece gönderilen her başvuruyu görmüş olursunuz.

### Bir kerelik kurulum

1. Uygulamada **E-MESEM Yardımcısı** düğmesine basın.
2. Açılan penceredeki mor **E-MESEM Doldur** bağlantısını fareyle tutup
   tarayıcının **yer imleri (favoriler) çubuğuna** bırakın.
   Çubuk görünmüyorsa `Ctrl+Shift+B` ile açın.

### Her kayıt için

1. Listede kaydın satırındaki **E-MESEM** düğmesine basın (kayıt panoya alınır).
2. E-MESEM sekmesine geçip başvuru ekranını açın.
3. Yer imlerindeki **E-MESEM Doldur**'a tıklayın — sağ üstte yardımcı paneli açılır.
4. **Panodan Al** deyin.
5. **İlk seferde**: her alan adının yanındaki **+** düğmesine basıp E-MESEM'deki
   ilgili kutuya tıklayın. Alan adı yeşil ✓ olur. Bu eşleştirme tarayıcıya
   kaydedilir, bir daha yapmanız gerekmez.
6. **Doldur** deyin. Eşleştirdiğiniz tüm kutular dolar.

Sonraki kayıtlarda yalnızca **E-MESEM → Panodan Al → Doldur** yeterlidir.

### İşe yarayan ayrıntılar

* Yardımcı açılır listeleri (Alan, Dal, Kapsam) seçenek metnine göre eşleştirir.
* İşaret kutularını (kalfalık sınavına girecek vb.) işaretler.
* Eşleştirilemeyen alanlar panelde `+` olarak kalır; değere tıklayarak tek tek
  kopyalayıp elle yapıştırabilirsiniz.
* Eşleştirme her E-MESEM sayfası için ayrı tutulur; farklı ekranlarda
  (başvuru, denklik vb.) ayrı ayrı öğretirsiniz.
* Yer imi bazı kurum bilgisayarlarında güvenlik ayarları nedeniyle engellenebilir.
  O durumda pencereden **Betiği Kopyala** deyip E-MESEM sayfasında `F12` →
  **Console** sekmesine yapıştırıp Enter'a basın.
* **Eşleşmeyi Sıfırla**, E-MESEM ekranı değiştiğinde öğretilenleri temizler.

---

## 5. Veri güvenliği

* Şifreler veritabanında açık tutulmaz; `scrypt` ile her kuruma ayrı tuz
  kullanılarak özetlenir. Şifreyi hiç kimse, siz de dahil, geri okuyamaz.
* Her istekte oturum anahtarındaki kurum ile istenen kurum karşılaştırılır;
  eşleşmezse istek reddedilir. Kurumlar arası veri sızması bu katmanda engellenir.
* Kayıt silme işlemi veriyi hemen yok etmez, 60 gün "silindi" olarak işaretli tutar
  (yanlış silmelerde ve eşitleme çakışmalarında koruma sağlar).
* **Verileri Sıfırla** işlemi öncesinde tüm kayıtların bir kopyası veritabanında
  `YEDEK_<KURUM>_<tarih>` adıyla saklanır.
* Eşitlemede her kaydın güncelleme zamanı karşılaştırılır; eski bilgi yeni bilgiyi
  asla ezemez. Aynı kaydı iki kişi aynı anda değiştirirse son kaydeden geçerli olur.
* Kişisel veri işlendiği için (TC kimlik numarası, doğum tarihi) kurum kodlarını
  ve şifreleri paylaşırken KVKK yükümlülüklerinizi göz önünde bulundurun.

---

## 6. Sorun giderme

| Belirti | Sebebi ve çözümü |
|---|---|
| Giriş ekranında "YEREL MOD" yazıyor | Veritabanı bağlı değil ya da değişkenlerden sonra yeniden yayın yapılmadı. Vercel → Storage'da Neon bağlı mı, Deployments'ta Redeploy yapıldı mı bakın. |
| "Kurum adı veya şifre hatalı" | Kurum kodu büyük/küçük harften etkilenmez ama boşluk yerine alt çizgi kullanılır. `/yonetim.html`'de listelenen kodu birebir yazın. |
| "Çok fazla hatalı deneme" | 5 hatalı girişten sonra 15 dakika kilit. Bekleyin veya yönetim sayfasından yeni şifre verin. |
| Rozet "Bekleyen değişiklik" olarak kalıyor | İnternet kesilmiş olabilir. Kayıtlar tarayıcıda durur, bağlantı gelince **Buluta Eşitle** deyin. |
| Yönetim sayfası "Yetkisiz" diyor | `ADMIN_ANAHTARI` yanlış veya Vercel'de tanımlı değil. |
| Yer imi tıklandığında hiçbir şey olmuyor | Sayfa güvenlik ayarı engelliyor. **Betiği Kopyala** yöntemini kullanın. |
| Yardımcı "Hiç alan eşleştirilmemiş" diyor | O E-MESEM ekranı için henüz öğretme yapılmamış. **+** düğmeleriyle öğretin. |
| Yardımcı "kutu bulunamadı" diyor | E-MESEM ekranı değişmiş. **Eşleşmeyi Sıfırla** deyip yeniden öğretin. |

---

## 7. Geliştiriciler için teknik özet

```
api/veri.js       Kurum girişi ve kayıt işlemleri (ping, login, load, sync, clear)
api/kurum.js      Yönetim işlemleri (listele, ekle, sifreDegistir, durum)
lib/db.js         Postgres bağlantısı + şemanın kendiliğinden kurulması
lib/kimlik.js     scrypt şifre özeti, HMAC imzalı oturum anahtarı
public/index.html Tek dosyalık ön yüz (HTML + CSS + JS)
public/yonetim.html          Kurum yönetim paneli
public/emesem-yardimci.js    E-MESEM sayfasına enjekte edilen yardımcı
yerel-sunucu.js   Yalnızca yerel deneme için; Vercel'de kullanılmaz
```

Veritabanı tabloları: `kurumlar`, `kayitlar` (JSONB, `(kurum, id)` birincil anahtar),
`giris_denemeleri`. Tümü ilk istekte kendiliğinden oluşur.

Yerel çalıştırma:

```bash
npm install
DATABASE_URL=postgres://... OTURUM_SIRRI=... ADMIN_ANAHTARI=... node yerel-sunucu.js
node api-test.js        # API testleri
python3 uctan-uca.py    # tarayıcıda uçtan uca test
```

### Kaynaklar

* [e-MESEM giriş ekranı (MEBBİS / e-Devlet)](https://e-mesem.meb.gov.tr/) — dışa açık
  aktarım servisi bulunmadığının doğrulandığı sayfa
* [Vercel Neon Postgres kurulumu](https://vercel.com/docs/storage/vercel-postgres)
* [Vercel ortam değişkenleri](https://vercel.com/docs/projects/environment-variables)
