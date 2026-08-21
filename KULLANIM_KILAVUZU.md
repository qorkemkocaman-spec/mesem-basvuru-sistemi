# E-MESEM Basvuru Sistemi (Surum 4.0) - Kullanim Kilavuzu

Bu web uygulamasi, Mesleki Egitim Merkezi (MESEM) basvurularini tek yerden
toplamak, her kurumun kendi kullanici adi ve sifresi ile girmesi ve girilen
bilgilerin E-MESEM (MEBBIS) formuna tek tusla aktarilmasi icindir. Bu
kilavuz, sistemin TUM ozelliklerini bastan sona, adim adim anlatir.

## Icindekiler
1. Onemli Notlar
2. Kurulum (Vercel + Neon)
3. Yonetim - Kurum Hesabi Acma
4. Ana Uygulama - Giris ve Kullanim
5. E-MESEM On Kayit Robotu
6. Fotograf Yukleme - Detayli Ogretme
7. Sorun Giderme

---

## 1. Onemli Notlar

- Veriler "bulut" sunucuda (Vercel + Neon Postgres) saklanir.
- Web sitesi kurulumu (yayinlama) yapilmayan sisteme girilemez; robot yalnizca
  web siteniz acikken ve kurum hesabinizla girisliyken calisir.
- Her kurumun verileri (basvurular ve fotograflar) yalnizca kendi hesabina
  aciktir; kurumlar birbirinin kaydini goremez.
- Sifreler veritabaninda acik tutulmaz; scrypt ile ozetlenir, kimse geri okuyamaz.
- Veriler bulut ile esitlenir. Internet kesilse kayitlar tarayici deposunda
  bekler; baglanti gelince "Bulutla Esit" butonuna basilir.

---

## 2. Kurulum (Vercel + Neon)

### 2.1 Dosyalari Vercel'e / GitHub'a Yukleyin
Klasor yapisi:
```
api/                 (veri.js, kurum.js)
lib/                 (db.js, kimlik.js)
public/              (index.html, yonetim.html, emesem-yardimci.js, arsiv.js, myk-data.js)
package.json
vercel.json
README.md
```
> node_modules dizinini yuklemeyin; gerekmez.

### 2.2 Veritabanini Baglayin (Neon)
1. Vercel panelinde "Add New > Project" ile projeyi acin ve dosyalari yukleyin.
2. "Storage > Create Database > Neon (Serverless Postgres)" secin.
3. Bolge olarak "Frankfurt (eu-central-1)" secin (Turkiye'ye en yakin).
4. "Connect" deyin ve projenize baglayin.

Vercel, DATABASE_URL degiskenini otomatik ekler. Tablo olusturmaya gerek yok;
uygulama ilk istekte gerekli tablolari (kurumlar, kayitlar, giris_denemeleri,
fotograflar) kendisi kurar.

### 2.3 Iki Gizli Anahtar Tanimlayin
Vercel > Settings > Environment Variables bolumune ekleyin:

| Degisken | Gorev | Deger |
|---|---|---|
| OTURUM_SIRRI | Giris oturumlarini imzalar | en az 32 karakter, rastgele |
| ADMIN_ANAHTARI | Yonetim sayfasi sifresi | en az 20 karakter, rastgele |

Rastgele deger uretmek icin tarayicinin adres cebirine su javascript'i yazin:
`javascript:alert(crypto.randomUUID()+crypto.randomUUID())`

### 2.4 Yeniden Yayinlayin
Vercel > Deployments > en ustteki yayinin yanindaki "Redeploy" butonuna basin.
Ortam degiskenleri ancak yeni yayindan sonra devreye girer.

### 2.5 Calistigini Dogrulayin
Giris ekraninin altinda "BULUT ENTEGRE MOD: ..." yaziyorsa kurulum tamamdir.
"YEREL CALISMA MODU..." yaziyorsa sunucuya ulasilamamis; veriler yalnizca o
cihazda kalir, 2.1-2.4 adimlarini tekrar gozden gecirin.

> ONEMLI: Yerel modda fotograf buluta gonderilemez ve robot API'den fotograf
> cekemez. Robotu tam kullanmak icin BULUT modu zorunludur.
---

## 3. Yonetim - Kurum Hesabi Acma (/yonetim.html)

1. Sitenizin adresine ek olarak `/yonetim.html` yazip acin.
2. ADMIN_ANAHTARI degerini girin, "Kurumlari Getir" deyin.
3. "Yeni kurum ekle" bolumunu doldurun:
   - Kurum kodu: kurumun giris ekraninda yazacagi ad (ornek MILLI_MESEM).
   - Kurumun tam adi: istege bagli, yalnizca listede gorunur.
   - Sifre: "Rastgele Sifre Uret" dugmesini kullanmaniz onerilir.
4. "Kurumu Ekle" deyin. Yesil alanda gorunen sifreyi kuruma guvenli yolla bildirin.

Bu sayfadan ayrica:
- Sifre Degistir: sifresini unutan kuruma yeni sifre verir; kayitlari etkilemez.
- Askiya Al / Yeniden Ac: kurumun girisini kapatir veya acar; kayitlari silinmez.
- Kayit sayisi: her kurumun kac basvuru girdigini gosterir.

> /yonetim.html adresini kurumlara vermeyin. Anahtari bilmeyen kimse bu sayfadan
> hicbir sey yapamaz. Sayfa ayrica arama motorlarina kapatilmistir.

---

## 4. Ana Uygulama - Giris ve Kullanim

### 4.1 Giris
1. Sitenin ana adresini acin.
2. Kurum kodu ve sifreyi girip "Giris" deyin.
3. Oturum 8 saat gecerli; oturum sirri degistirilirse herkes yeniden giris yapar.

> 5 hatali giris Sifre hatali denemeden sonra hesap 15 dakika kilitlenir.

### 4.2 Sekmeler (Kategoriler)
Ust menuden basvurularinizi ture gore secin:
- Kalfalik Sinavi: Kalfalik ogrencilerinin basvurulari.
- Ustalik Sinavi: Ustalik ogrencilerinin basvurulari.
- Is Pedagojisi Kursu (Usta Ogreticilik): Bu sekmede yalnizca Bos Basvuru Formu
  kullanilir; EK-3 sonuc belgesi uretilemez.
- Tum Kayitlar / Arsiv: Tum kayitlar (Is Pedagojisi haric) ve arsiv listesi.

Sekme degistiginde formun basvuru turu ve kapsam secenekleri otomatik uyarlanir.

### 4.3 Basvuru Formu Doldurma
1. Formu doldurup "Kaydet (Basvuru Ekle)" butonuna basin.
2. Her kayit otomatik olarak bulutla esitlenir. Sag ustteki rozet "Bulutla esit"
   oldugunda veri guvende demektir.
3. "Temizle" butonu formu bosaltir. "Degisiklikleri Kaydet" mevcut kaydi gunceller.

### 4.4 Arama
Ara kutusundan TC, Ad, Soyad, Alan veya Basvuru No ile arama yapabilirsiniz;
liste aninda filtrelenir.

### 4.5 Excel ve Istatistik
- Excel Indir: listedeki kayitlari Excel dosyasina indirir; "Ozet_Istatistik"
  sayfasi ayrica eklenir.
- Excel'den Ice Aktar: Excel dosyasini sisteme aktarir (ilk satir baslik olmali).
- Hizli Giris: kopyala/yapistir ile toplu giris.
- Baslik Satirini Panoya Kopyala: Excel baslik satirini uretir.

### 4.6 Resmi Raporlar ve Ciktilar
"Resmi Rapor & Ciktilar" menusunden:
- EK-3 Basvuru Sonuc Belgesi: tek aday icin resmi sonuc belgesi.
- EK-2 Il Denklik Komisyonu Degerlendirme Listesi: tum filtrelenmis adaylar.
- Belge Denklik Defteri: denklik defteri sablonu.
- Bos Basvuru Formu: fotografli bos form.

Komisyon uyeleri, donem, belge numarasi oneki gibi bilgiler "Komisyon & Kurum
Ayarlari" butonu ile ozellestirilir (EK-2, EK-3).

### 4.7 Verileri Sifirlama
"Verileri Sifirla" islemi oncesinde tum kayitlarin kopyasi veritabaninda
YEDEK_<KURUM>_<tarih> adiyla saklanir. Silme islemi veriyi hemen yok etmez;
60 gun "silindi" olarak isaretli tutar.

---

## 5. E-MESEM On Kayit Robotu

Robot, MEB E-MESEM (emesem.meb.gov.tr) portalindaki "Sinav Ogrenci On Kayit"
ekraninda formlari tam otomatik doldurup kaydeder. Telerik RadComboBox,
RadDatePicker ve ASP.NET AJAX PostBack senkronizasyonunu kendisi yurutur.

### 5.1 Robotu Tarayiciya Kurmak
Robotu uc sekilde tarayiciya yukleyebilirsiniz:
1. Bookmarklet (onerilen): Ana web uygulamanin robot sekmesindeki mor
   "E-MESEM On Kayit Robotu (Surukleyin)" baglantisini tutup tarayicinin
   "Yer Imleri (Bookmarks)" cubuguna surukleyip birakin.
2. Tampermonkey: "Tampermonkey Betigini Kopyala" ile userscripti kopyalayip
   Tampermonkey'e ekleyin.
3. Konsol (F12): "Konsol Betigini Kopyala (F12)" ile betigi kopyalayip MEB
   sayfasinda F12 konsoluna yapistirip Enter'a basin.

### 5.2 Robotu Baslatmak
1. MEB E-MESEM sitesine girin (emesem.meb.gov.tr) ve giris yapin.
2. "Sinav Ogrenci On Kayit" ekranini acin.
3. Robot yer imine tiklayin; robot paneli sag ustte acilir.

### 5.3 Adaylari Yuklemek (Pano / Dosya)
- Panodan Al: kopyaladiginiz adaylari otomatik okur; okunmazsa panosunu
  alana Ctrl+V ile yapistirip "Yukle" deyin.
- Kalfalik / Ustalik / Is Pedagojisi Adaylarini Kopyala: web uygulamasindaki
  listeyi panoya kopyalar (veya Tumunu Kopyala).
- Bu Adayi Kaydet: listedeki secili adayi tek tek isler.
- Sirayla Kaydet: tum listedeki adaylari sirayla doldurup kaydeder.
- Adim Adim Manuel Onay Modu: her adim icin insan onayi ister.

Robot su adimlarla calisir:
    ADIM 1  Kategori sekmesi (Kalfalik/Ustalik/Pedagoji)
    ADIM 2  Yeni Kayit penceresini acar
    ADIM 3  TC Kimlik No ve Dogum Tarihi girer
    ADIM 4  MERNIS "Sorgula" ile kimlik verisi getirir
    ADIM 5  Kapsam, iletisim, mezuniyet, alan/dal bilgilerini girer
    ADIM 6  "Kaydet" butonuna basar
    ADIM 7  (opsiyonel) Fotograf yukler - bakiniz Bolum 6
Kayit tamamlandiktan sonra "Yenile" butonuyla ana ekran temizlenir ve bir
sonraki aday icin temiz form acilir.

### 5.4 Manuel Onay Modu
Robot panelinde "Manuel Onay" aciksa form bilgilerini doldurur ama "Kaydet"e
basmadan durur; kullanici inceleyip panelden devam eder.

---

## 6. Fotograf Yukleme - Detayli Ogretme

Fotograf yukleme iki adimdan olusur: (1) once fotograflari web sitenizdeki
kurum hesabina "buluta" yuklersiniz; (2) sonra robotu MEB ekraninda "Alan
Ogret" modu ile fotograf butonlarina ogretirsiniz. Ogretim olmadan robot
fotografli otomatik yukleyemez.

### 6.1 Fotograflari Buluta Yukleyin (Web Uygulamasi)
Fotograflar, TC kimlik numarasi ile adlandirilmis dosyalar olmalidir
(ornek: 62263313792.png).
1. Web uygulamanin robot sekmesindeki "Fotograflari Buluta Yukle" butonuna basin.
2. TC adli resim dosyalarini secin (.png, .jpg, .jpeg, .webp; coklu secim mumkun).
3. Yuklenirken goruntuler en fazla 394px genislik ve 512px yukseklige otomatik
   kucultulur (en-boy orani korunur). Buyukler kucultulur, kucuklar aynen kalir.
4. "Yukle" deyin. Her seferinde en fazla 50 dosya sunucuya yollanir; geriye
   kalanlar otomatik devam eder.

> Fotograflar sunucuda "fotograflar" tablosunda (kurum, tc) anahtariyla saklanir.
> Ayni TC tekrar yuklenirse yeni resim eskinin yerine gecer.

### 6.2 Robotu Fotograf API'sine Baglayin
1. Web uygulamasinda "Robot Baglanti Bilgisini Kopyala" butonu ile adres +
   kurum + token panoya kopyalayin.
2. Robot panelindeki "Fotograf Yukle" ayari yanindaki "API Ayarlari" butonunu
   tiklayin.
3. Acilan pencereye Ctrl+V ile yapistirin; adres/kurum/token otomatik cozumlenir
   ve baglanti test edilir.
   - Test basariliysa logda "baglanti calisiyor" yazar.
   - 404 donerse: o kurum ve TC icin fotograf yok; once webde 6.1 ile yukleyin.
   - "unauthorized" donerse: oturum gecersiz; webde yeniden giris yapip yeni
     baglanti bilgisini kopyalayin.
### 6.3 Alan Ogret - Fotograf Alanlarini Ogretme
Robot panelindeki "Alan Ogret / Profil" butonu, MEB ekrani alanlarini tiklayarak
robota ozel eslemeler yaptirir. Ogretilebilir alanlar "Alan Ogret" penceresinde
3 sekmede gorunur:
- Ana Ekran Alanlari (4): Kalfalik/Ustalik/Pedagoji sekmeleri, Yeni Kayit.
- Acilir Kayit Penceresi (POPUP): tc, dogum, sorgula, tum form alanlari +
  "fotoDosyaBtn" (1. pencere Dosya butonu) ve "fotoKapatBtn" (X/Kapat).
- 2. Acilir Pencere (POPUP2): "foto2Dosya" (dosya secim inputu) +
  "foto2Kaydet" (Kaydet butonu / btnSave).
- Tumu: hepsini tek listede gosterir.

### 6.4 Fotograf Ogretme - Adim Adim
Ilk kez ogretirken once fotograf disindaki tum alanlar ogretilir, ardindan
fotograf ekleme bolumu aktiflesir. Adim adim:
1. "Alan Ogret / Profil"e basin; "Yeni Kayit Penceresini Ac" dugmesine basin.
   Boylece kayit penceresi ve icindeki fotograf "Dosya" bolumu gorunur.
2. "Acilir Kayit Penceresi" sekmesinde once fotograf disindaki tum form
   alanlarini (tc, dogum, kapsam, iletisim ve alan/dal) "Ogret" ile tiklayarak
   robota ogretin.
3. Simdi fotograf ekleme kismi aktif; sirayla sunlari ogretin:
   - "Fotograf - 1. Pencere Dosya Butonu (fotoDosyaBtn)" icin "Ogret" deyin
     ve penceredeki gercek "Dosya" butonuna tiklayin. (Vurgulanir ve eslenir.)
   - "Fotograf - 1. Pencere Kapat Butonu (fotoKapatBtn)" icin "Ogret" deyip
     pencerenin sag ust X / kapat dugmesine tiklayin.
4. Dosya butonuna tiklayinca 2. acilir pencere acilir. "2. Acilir Pencere
   (POPUP2)" sekmesine gecin ve:
   - "2. Pencere Dosya / Sec Butonu (foto2Dosya)" icin "Ogret" deyip 2.
     penceredeki dosya secim alanina (uploadLogofile0) tiklayin.
   - "2. Pencere Kaydet Butonu (foto2Kaydet)" icin "Ogret" deyip gercek
     "Kaydet / Save" butonuna tiklayin.
5. Isterseniz "Sirayla Tumunu Ogret" ile tum alanlari akilli sekilde ogretebilir;
   "Profili Disa Aktar (JSON)" ile ogretilenleri yedekleyebilirsiniz.
6. Her eslemede log konsolunda suna benzer satir gorunur:
   "Eslendi: [2. Pencere Kaydet Butonu] -> #btnSave (button)".

### 6.5 Robotu Fotograf Yuklemeyi Test Etmek
1. Robot listesinden bir aday secin.
2. "Bu Adayi Kaydet" deyin. Robot ADIM 1-6 ile formu doldurur, ardindan ADIM 7:
   - API'den medya dataURL'i ceker (fotoGetir, belirtilen TC ile).
   - 1. pencere "Dosya" butonuna basar (fotoDosyaBtn).
   - 2. pencerenin dosya secim inputuna (foto2Dosya) fotograf dosyasini
     (File) atar ve "change" olayi gonderir.
   - 2. pencere "Kaydet" butonuna basar (foto2Kaydet).
   - Son olarak 1. pencereyi kapatir (fotoKapatBtn).
3. Canli log ve sesli bildirim ile sonucu izleyin.

### 6.6 Fotograf Notlari
- Dosyalar 3 MB'den kucuk olmali; kucultme 394x512 px sinirinda otomatiktir.
- Dosya adi 11 haneli TC olmali; degilse atlanir.
- Robot yalnizca bagli oldugu (kurum + token) hesabin fotograflarini ceker.
- Yerel modda fotograf API'si calismaz; robot bulut modduyken fotograf isler.

---

## 7. Sorun Giderme

| Belirti | Cozum |
|---|---|
| Giris ekraninda "YEREL CALISMA MODU" yaziyor | Neon bagli degil veya Redeploy yapilmadi. Vercel > Storage > Neon ve Redeploy adimlarini kontrol edin. |
| "Kurum adi veya sifre hatali" | Kurum kodunu yonetim sayfasindaki ile birebir yazin; 5 hata sonrasi 15 dk kilitlenir. |
| Rozet "Esitlenmedi" | Internet kesilmis; "Buluta Esitle" deyin. |
| Yonetim sayfasi "Yetkisiz" | ADMIN_ANAHTARI yanlis veya Vercel'de tanimli degil. |
| Robot acilmiyor | Yer imini engelleyen guvenlik ayari olabilir; Konsol (F12) yontemini deneyin. |
| Robot "kutu bulunamadı" diyor | E-MESEM ekrani degismis; "Alan Ogret" ile yeniden ogretin veya "Eslemeleri Sifirla" deyin. |
| Fotograf bulunamadi | Once webde o kurumla fotograflari buluta yukleyin; robot baglanti bilgisini yeniden kopyalayin. |
| Excel baslik taninmiyor | Ilk satirda alan adlari Turkce olmali; "Baslik Satirini Panoya Kopyala" ile uretilen basligi yapistirin. |

---

## 8. Veri Guvenligi
- Sifreler scrypt ile, her kurum icin ayri tuz kullanarak ozetlenir.
- Her istekte oturum anahtarindaki kurum ile istenen kurum karsilastirilir;
  eslesmezse istek reddedilir. Kurumlar arasi veri sizintisi bu katmanda engellenir.
- Kayit silme veriyi hemen yok etmez, 60 gun "silindi" olarak isaretli tutar.
- Verileri Sifirla oncesinde yedek olusturulur: YEDEK_<KURUM>_<tarih>.
- Kisisel veri islendigi icin kurum kodlarini ve sifrelerini paylasirken KVKK
  yukumluluklerinizi goz onunde bulundurun.