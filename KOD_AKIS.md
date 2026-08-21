# E-MESEM Basvuru Sistemi - Kod Akisi ve Mimari Dokumani (v4.0)

Bu dokuman, kodun nasil calistigini dosya dosya ve akis akis anlatir.
Hedef kitle: gelistiriciler, bakim yapanlar ve sistem sorumlulari.

## 1. Dosya Yapisi ve Gorevleri

```
api/veri.js         Ana API ucu. Giris, kayit, esitleme ve FOTOGRAF
                    islemleri. Endpoint: POST /api/veri
api/kurum.js        Yonetim API'si. Kurum listele/ekle/sifreDegistir/durum.
lib/db.js           Postgres baglantisi + sema (tablolar) otomatik kurulum.
lib/kimlik.js       scrypt sifre ozeti, HMAC imzali oturum tokeni, kurum
                    adi normallestirme.
public/index.html   Ana web uygulamasi (giris, form, liste, Excel, raporlar,
                    fotograf buluta yukleme, robot yukleme sekmesi).
public/yonetim.html Kurumhesap yonetim paneli.
public/emesem-yardimci.js  E-MESEM On Kayit Robotu (v9.0). Bookmarklet.
public/arsiv.js     Arsiv uyumluluk katmani (eski surum verileri).
public/myk-data.js  MYK yeterlilik listesi (Alan/Dal esleme).
yerel-sunucu.js     Yalnizca yerel deneme icin; Vercel'de kullanilmaz.
package.json        Bagimliliklar (yalnizca pg). Surum 4.0.
vercel.json         Guvenlik basliklari + yeniden yazma kurallari.
```

Veritabani tablolari: `kurumlar`, `kayitlar` (JSONB, (kurum,id) anahtar),
`giris_denemeleri`, `fotograflar`. Tumu ilk istekte `semayiHazirla()` ile kurulur.

## 2. Ortam Degiskenleri

| Degisken | Nerede okunur | Gorevi |
|---|---|---|
| DATABASE_URL | lib/db.js | Neon Postgres baglanti adresi (Vercel doldurur) |
| OTURUM_SIRRI | lib/kimlik.js | Giris tokenini HMAC ile imzalar |
| ADMIN_ANAHTARI | api/kurum.js | Yonetim paneli (yonetim.html) yetkisi |

## 3. Giris Akisi (login)

```
index.html              api/veri.js (action=login)
   |  kurum+sifre          |  kurumAdiniDuzelt -> kurumlar tablosu
   |---------------------->|  giris_denemeleri: 5 hata / 15dk kilidi
   |                       |  sifreDogruMu(sifre, tuz, ozet) [scrypt]
   |<----------------------|  basarili: anahtarUret(kurum) -> 8 saat token
   |  token + logo         |
```
- Bilgi sizintisini onlemek icin kurum yoksa da ayni tek mesaj doner:
  "Kurum adi veya sifre hatali".
- 5 hatali deneme sonrasi 429 dondurulur + kalan dakika bilgisi.

## 4. Oturum ve Kurumlar Arasi Ayrim

- Token HMAC ile imzalanir (OTURUM_SIRRI).
- Her istekte `anahtariCoz(token)` -> `oturum.kurum` alanir.
- `oturum.kurum !== kurum` ise 401 "unauthorized" doner; bir kurum digerinin
  verisine erisemez (kurumlar arasi izolasyon).

## 5. Kayit Islemleri (load / sync / clear)

- load: `SELECT ... WHERE kurum=$kurum AND NOT silindi` orderli dondurur.
- sync: `kayitlar` tablosuna upsert. Her kayitta guncelleme zamani karsilastirilir;
  eski bilgi yeni bilgiyi asla ezmez. Ayni kaydi iki kisi degistirirse son
  kaydeden gecerli olur.
- clear: once `YEDEK_<KURUM>_<tarih>` adli yedek satir olusturur, sonra siler.

## 6. Fotograf Akisi

### 6a. Web Uygulamasi: fotolariBulutaYukle()
```
index.html
  fotograf TC-adli dosyalar (11 hane dogrulama)
  dosyayiBoyutlandiripCevir -> max 394x512 px PNG dataURL
  paketle (50'lik) -> apiIstegi('fotoEkle', paket)
        |
        v
api/veri.js (action=fotoEkle)
  tc 11 hane / medya en az 50 karakter kontrol
  INSERT INTO fotograflar(kurum,tc,veri,guncelleme)
  ON CONFLICT (kurum,tc) DO UPDATE  (son gonderilen kazanir)
```

### 6b. Robot: adim7_FotoYukle()
```
emesem-yardimci.js
  if !(fotoApiAktif && k.tc) git adima devam et / dur
  fetch(API + '/api/veri', {action:'fotoGetir', kurum, token, data:{tc}})
    -> medya base64 dataURL
  1) fotoDosyaBtn.click()        (1. pencere "Dosya")
  2) foto2Dosya: File atar + 'change' olay gonderir (DataTransfer)
  3) foto2Kaydet.click()         (2. pencere "Kaydet" / btnSave)
  4) fotoKapatBtn.click()        (ana pencereyi X ile kapatir)
```

## 7. Robotun On Kayit Akisi (ADIM 1-7)

```
adimiIsle(k):
  ADIM1  kategori sekmesi   (ogretilmisAlanBul veya yerlesik sekme)
  ADIM2  yeni kayit acar
  ADIM3  tc + dogum tarihi  (telerikRadDatePickerYaz + degerYaz)
  ADIM4  MERNIS "Sorgula" + PostBack bitisini bekle
  ADIM5  kapsam / eposta / telefon / mezuniyet / alan/dal (cascading)
  ADIM6  kaydetBtn.click()
  ADIM7  if fotoApiAktif: adim7_FotoYukle(k)   [Bolum 6b]
  ana ekranda "Yenile" -> siradaki aday icin temiz form
```
Telerik RadComboBox icin `$find` API + DropDown motoru; RadDatePicker icin
maskeli tarih giris motoru (GG.AA.YYYY) kullanilir.

## 8. Alan Ogret / Esleme Modu

- `OGRETILEBILIR_ALANLAR` liste alan gruplarini tutar:
  ANA_EKRAN (sekmeler + yeni kayit), POPUP (kayit formu + fotoDosyaBtn +
  fotoKapatBtn), POPUP2 (foto2Dosya + foto2Kaydet).
- `ogretmeModunuBaslat()` fare/tiklama dinleyiciler acar; `ogreticiTiklama()`
  benzersiz selector uretir, `ozelEslemeler[alanId]=selector` yapar ve
  localStorage'a yazar (STORAGE_ESLEME_ANAHTARI).
- `ogretilmisAlanBul(alanId)` oncelikle ozel eslemeyi, sonra yerlesik Telerik
  profilini (`VARSAYILAN_TELERIK_HARITASI`) arar; birden fazla esanim dava
  gorunur olani secer.
- Profil JSON disa/ice aktarilabilir; eslemler "Sifirla" ile temizlenebilir.

## 9. Robotun Fotograf API Baglantisi

- Robot, `mesem_foto_api` (localStorage) anahtarinda adres/kurum/token saklar.
  "API Ayarlari" butonuna webden kopyalanan JSON yapistirilir.
- `fotoBaglantiTestEt()` ilk adayim TC'si ile `fotoGetir` dener:
  basarili (log ok) / 404 (fotograf yok) / unauthorized (token gecersiz).

## 10. Uctan Uca Veri Yolu (Ozet)

```
[Yonetim] -> api/kurum.js -> kurumlar tablosu
   |
[Web Uygulama] --giris/login--> token
   |--load/sync/clear--> kayitlar tablosu
   |--fotoEkle/fotoGetir--> fotograflar tablosu
   |
[Robot (MEB)] --pano/dosya/JSON--> adaylar
   |--ADIM1..7--> MEB formu + kaydet
   |--ADIM7--> fotoGetir(API) -> MEB fotograf penceresine yukle
```

## 11. Guvenlik Notlari

- Sifreler scrypt + tuz ile ozetlenir; duz metin asla saklanmaz.
- Oturum HMAC imzali; kurum eslesmezse istek 401.
- CORS: Access-Control-Allow-Origin "*" yalnizca fotograf API'si icindir
  (robot, emesem.meb.gov.tr uzerinden cagirir).
- Cache-Control: no-store; vercel.json koruyucu guvenlik basliklari ekler.
- Limitler: tek sync en fazla 500 islem; fotograf paketleri 50'lik.