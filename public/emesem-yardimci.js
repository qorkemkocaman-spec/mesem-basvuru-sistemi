/* ==================================================================
   E-MESEM Sınav Öğrenci Ön Kayıt & Otomasyon Robotu (v4.0)
   Geliştirici: Görkem Kocaman © 2026
   ------------------------------------------------------------------
   MEB E-MESEM (emesem.meb.gov.tr) portalında "Sınav Öğrenci Ön Kayıt"
   ekranında tam otomatik, hatasız ve adım adım kayıt motoru.

   Kesin İş Akışı:
     1. İlgili kategori sekmesini seçer (Kalfalık Sınavı / Ustalık Sınavı / İş Pedagojisi Kursu)
     2. Üst bardaki "Yeni Kayıt" butonuna tıklar
     3. Açılan formda:
        - Öğrenim Yılını seçer (2025-2026 vb.)
        - Kimlik No ve Doğum Tarihini girip "Sorgula"ya tıklar
        - MERNİS sorgusunun tamamlanmasını bekler (Ad, Soyad, Cinsiyet vb. otomatik gelir)
        - Kapsam seçer (Kalfalık: 35. Madde | Ustalık: 28.c, 35.Madde, 29.Madde, G.1.b.2 | İş Pedagojisi: 31.Madde)
        - Telefon, e-Posta ve Adres bilgilerini doldurur
        - En Son Mezuniyeti seçer (İlkokul, İlköğretim (Ortaokul), Lise, Meslek Lisesi, Ön Lisans, Lisans, Yüksek Lisans, Doktora)
        - Getirdiği Belgeyi seçer (Diploma, Tastikname, Diğer)
        - Belge Tarihini doldurur
     4. Sağ üstteki "Kaydet" butonuna tıklar
     5. Onay/kapanış sonrası sıradaki adaya geçer.
================================================================== */
(function () {
    'use strict';

    if (window.__mesemYardimci) {
        window.__mesemYardimci.gosterGizle();
        return;
    }

    var SURUM = "4.0";
    var tumKayitlar = [];          // Sisteme yüklenen tüm adaylar
    var filtreliKayitlar = [];     // Seçili kategoriye göre filtrelenmiş liste
    var aktifKategori = 'TUMU';    // 'KALFALIK', 'USTALIK', 'PEDAGOJI', 'TUMU'
    var aktifIndeks = 0;           // Filtreli listedeki aktif aday sırası
    var otomatikCalisiyor = false; // Toplu aktarım döngü durumu
    var manuelOnayModu = false;    // Kaydetmeden önce duraklayıp kullanıcı onayı bekleme
    var mernisBeklemeSuresi = 2200;// MERNİS sorgu bekleme süresi (ms)
    var genelBeklemeSuresi = 1000; // Adımlar arası bekleme süresi (ms)
    
    // UI Bileşenleri
    var panel, listeKutusu, durumYazi, sayacKutusu, btnToplu, btnManuelOnay, dosyaGirdi;
    var yapistirmaKutusu, yapistirmaAlani;
    var tabBtnKalfalik, tabBtnUstalik, tabBtnPedagoji, tabBtnTumu;

    /* ---------------- Sesli Bildirim Sistemi (Web Audio API) ---------------- */
    var sesContext = null;
    function sesCal(tur) {
        try {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!sesContext) sesContext = new AudioCtx();
            if (sesContext.state === 'suspended') sesContext.resume();

            var osc = sesContext.createOscillator();
            var gain = sesContext.createGain();
            osc.connect(gain);
            gain.connect(sesContext.destination);

            var simdi = sesContext.currentTime;
            if (tur === 'basari') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, simdi); // D5
                osc.frequency.setValueAtTime(880, simdi + 0.1); // A5
                gain.gain.setValueAtTime(0.15, simdi);
                gain.gain.exponentialRampToValueAtTime(0.01, simdi + 0.3);
                osc.start(simdi);
                osc.stop(simdi + 0.3);
            } else if (tur === 'hata') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, simdi);
                osc.frequency.setValueAtTime(160, simdi + 0.15);
                gain.gain.setValueAtTime(0.2, simdi);
                gain.gain.exponentialRampToValueAtTime(0.01, simdi + 0.4);
                osc.start(simdi);
                osc.stop(simdi + 0.4);
            } else if (tur === 'tik') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(700, simdi);
                gain.gain.setValueAtTime(0.08, simdi);
                gain.gain.exponentialRampToValueAtTime(0.01, simdi + 0.08);
                osc.start(simdi);
                osc.stop(simdi + 0.08);
            }
        } catch (e) { }
    }

    /* ---------------- DOM & Metin Yardımcıları ---------------- */
    function el(etiket, stil, metin) {
        var e = document.createElement(etiket);
        if (stil) e.setAttribute('style', stil);
        if (metin != null) e.textContent = metin;
        return e;
    }

    function durum(metin, renk) {
        if (!durumYazi) return;
        durumYazi.textContent = metin;
        durumYazi.style.color = renk || '#cbd5e1';
    }

    function bekle(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function trTemizle(s) {
        return String(s || '')
            .toLocaleLowerCase('tr-TR')
            .replace(/[\s._\-\/\(\):,]/g, '')
            .replace(/i̇/g, 'i')
            .trim();
    }

    /* Tüm DOM Ağacını (Iframe'ler Dahil) Tarayan Kapsam Bulucu */
    function tumBelgeleriGetir() {
        var belgeler = [document];
        try {
            var iframeler = document.querySelectorAll('iframe, frame');
            for (var i = 0; i < iframeler.length; i++) {
                try {
                    var doc = iframeler[i].contentDocument || (iframeler[i].contentWindow && iframeler[i].contentWindow.document);
                    if (doc && doc.body) {
                        belgeler.push(doc);
                        // İç içe iframe kontrolü
                        var icIframeler = doc.querySelectorAll('iframe, frame');
                        for (var j = 0; j < icIframeler.length; j++) {
                            try {
                                var icDoc = icIframeler[j].contentDocument || (icIframeler[j].contentWindow && icIframeler[j].contentWindow.document);
                                if (icDoc && icDoc.body) belgeler.push(icDoc);
                            } catch (e2) { }
                        }
                    }
                } catch (e1) { }
            }
        } catch (e) { }
        return belgeler;
    }

    /* Evrensel Element Arayıcı: Metin, ID, Name, Placeholder veya Label üzerinden arar */
    function evrenselMetinleBul(etiketSecici, metinListesi, sadeceGorunur) {
        var arananlar = metinListesi.map(trTemizle);
        var belgeler = tumBelgeleriGetir();

        for (var b = 0; b < belgeler.length; b++) {
            var doc = belgeler[b];
            var adaylar = Array.prototype.slice.call(doc.querySelectorAll(etiketSecici));

            for (var i = 0; i < adaylar.length; i++) {
                var a = adaylar[i];
                if (sadeceGorunur && (a.offsetParent === null && a.offsetWidth === 0 && a.offsetHeight === 0)) {
                    continue;
                }

                var t = trTemizle(a.textContent || a.value || a.placeholder || a.getAttribute('aria-label') || a.title || a.name || a.id || '');
                for (var j = 0; j < arananlar.length; j++) {
                    var aranan = arananlar[j];
                    if (t === aranan || (aranan.length > 3 && t.indexOf(aranan) !== -1)) {
                        return a;
                    }
                }
            }
        }
        return null;
    }

    /* Evrensel Input / Select Bulucu */
    function evrenselInputBul(anahtarListesi, hedefDoc) {
        var arananlar = anahtarListesi.map(trTemizle);
        var belgeler = hedefDoc ? [hedefDoc] : tumBelgeleriGetir();

        for (var b = 0; b < belgeler.length; b++) {
            var doc = belgeler[b];
            var inputs = Array.prototype.slice.call(doc.querySelectorAll('input, select, textarea'));

            for (var i = 0; i < inputs.length; i++) {
                var inp = inputs[i];
                if (inp.type === 'file' || inp.type === 'submit' || inp.type === 'button' || inp.type === 'reset' || inp.type === 'image') {
                    continue;
                }

                var attrMetin = trTemizle([
                    inp.name, inp.id, inp.placeholder,
                    inp.getAttribute('aria-label'), inp.title,
                    inp.getAttribute('data-field'), inp.className
                ].join(' '));

                var labelMetin = '';
                if (inp.id) {
                    try {
                        var lbl = doc.querySelector('label[for="' + CSS.escape(inp.id) + '"]');
                        if (lbl) labelMetin = trTemizle(lbl.textContent);
                    } catch (e) { }
                }
                if (!labelMetin && inp.closest && inp.closest('label')) {
                    labelMetin = trTemizle(inp.closest('label').textContent);
                }
                if (!labelMetin && inp.parentElement) {
                    var prev = inp.previousElementSibling;
                    if (prev) labelMetin = trTemizle(prev.textContent);
                    if (!labelMetin && inp.parentElement.previousElementSibling) {
                        labelMetin = trTemizle(inp.parentElement.previousElementSibling.textContent);
                    }
                }

                for (var j = 0; j < arananlar.length; j++) {
                    var k = arananlar[j];
                    if (attrMetin.indexOf(k) !== -1 || labelMetin.indexOf(k) !== -1) {
                        return inp;
                    }
                }
            }
        }
        return null;
    }

    /* Form Elemanına Değer Atama ve Olayları Tetikleme */
    function degerYaz(hedef, deger) {
        if (!hedef) return false;
        if (hedef.type === 'file') return false;

        var etiket = (hedef.tagName || '').toLowerCase();

        if (etiket === 'select') {
            var bulundu = false;
            var aranan = trTemizle(deger);

            // 1. Adım: Tam eşleşme
            for (var i = 0; i < hedef.options.length; i++) {
                var o = hedef.options[i];
                var m = trTemizle(o.textContent);
                var v = trTemizle(o.value);
                if (aranan && (m === aranan || v === aranan)) {
                    try {
                        hedef.value = o.value;
                        hedef.selectedIndex = i;
                        bulundu = true;
                        break;
                    } catch (e) { }
                }
            }

            // 2. Adım: Kısmi eşleşme
            if (!bulundu && aranan) {
                for (var j = 0; j < hedef.options.length; j++) {
                    var opt = hedef.options[j];
                    var optText = trTemizle(opt.textContent);
                    var optVal = trTemizle(opt.value);
                    if (optText && (optText.indexOf(aranan) !== -1 || aranan.indexOf(optText) !== -1 ||
                                   (optVal && (optVal.indexOf(aranan) !== -1 || aranan.indexOf(optVal) !== -1)))) {
                        try {
                            hedef.value = opt.value;
                            hedef.selectedIndex = j;
                            bulundu = true;
                            break;
                        } catch (e) { }
                    }
                }
            }

            if (!bulundu && hedef.options.length > 1 && !deger) {
                return false;
            }
        } else if (hedef.type === 'checkbox' || hedef.type === 'radio') {
            var acik = deger === true || deger === 'Evet' || deger === 'true' || deger === '1' || deger === 1;
            try {
                if (hedef.checked !== acik) {
                    hedef.checked = acik;
                    hedef.click();
                }
            } catch (e) { }
            return true;
        } else {
            var strDeger = String(deger != null ? deger : '');
            var atandi = false;

            try {
                var proto = etiket === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                var yerlestirici = Object.getOwnPropertyDescriptor(proto, 'value');
                if (yerlestirici && yerlestirici.set) {
                    yerlestirici.set.call(hedef, strDeger);
                    atandi = true;
                }
            } catch (e) { }

            if (!atandi) {
                try { hedef.value = strDeger; } catch (e) { return false; }
            }
        }

        try {
            ['input', 'change', 'blur'].forEach(function (tur) {
                hedef.dispatchEvent(new Event(tur, { bubbles: true }));
            });
        } catch (e) { }

        try {
            hedef.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
        } catch (e) { }

        return true;
    }

    function vurgula(hedef, renk) {
        if (!hedef) return;
        try {
            var eski = hedef.style.outline;
            hedef.style.outline = '3px solid ' + (renk || '#f59e0b');
            setTimeout(function () { hedef.style.outline = eski; }, 1800);
        } catch (e) { }
    }

    /* ---------------- Kategori & Veri Normalizasyonu ---------------- */
    function kategoriBelirle(k) {
        var tur = trTemizle(k.basvuruTuru || '');
        if (tur.indexOf('pedagoji') !== -1 || tur.indexOf('ustaogretici') !== -1) return 'PEDAGOJI';
        if (tur.indexOf('ustalik') !== -1 || k.ustalikSinav || k.dogrudanUstalik) return 'USTALIK';
        return 'KALFALIK';
    }

    function kategoriAdiTr(kat) {
        if (kat === 'PEDAGOJI') return 'İş Pedagojisi Kursu';
        if (kat === 'USTALIK') return 'Ustalık Sınavı';
        if (kat === 'KALFALIK') return 'Kalfalık Sınavı';
        return 'Tüm Kayıtlar';
    }

    function veriyiCoz(metin) {
        try {
            if (!metin || typeof metin !== 'string') return null;
            var temiz = metin.trim();
            var nesne = JSON.parse(temiz);
            if (Array.isArray(nesne)) return nesne;
            if (nesne && Array.isArray(nesne.kayitlar)) return nesne.kayitlar;
            if (nesne && (nesne.alanlar || nesne.tc || nesne.ad)) return [nesne];
            return null;
        } catch (e) {
            return null;
        }
    }

    function kayitlariYukle(liste) {
        tumKayitlar = liste.map(function (k) {
            var duz = { durum: 'bekliyor' };
            if (k.alanlar && Array.isArray(k.alanlar)) {
                duz.baslik = k.baslik || '';
                k.alanlar.forEach(function (a) { duz[a.id] = a.deger; });
            }
            ['id', 'basvuruNo', 'tc', 'ad', 'soyad', 'dogumTarihi', 'basvuruTuru', 'ogrenimYili', 'kapsam',
             'eposta', 'telefon', 'adres', 'enSonMezuniyet', 'mezunOlduguOkul', 'getirdigiBelge', 'belgeTarihi',
             'alan', 'dal', 'kalfalikSinav', 'dogrudanKalfalik', 'kalfalikVeUstalik', 'kalfalikVeBasariliUstalik',
             'ustalikSinav', 'dogrudanUstalik', 'ustaTalepTuru', 'ustaDayanakBelge', 'ustaBelgeSayisi'].forEach(function (anahtar) {
                if (k[anahtar] !== undefined && duz[anahtar] === undefined) {
                    duz[anahtar] = k[anahtar];
                }
            });
            duz.kategori = kategoriBelirle(duz);
            return duz;
        });

        aktifIndeks = 0;
        kategoriFiltrele(aktifKategori);
        sesCal('basari');
        durum(`✓ Toplam ${tumKayitlar.length} aday robot paneline yüklendi.`, '#4ade80');
    }

    function kategoriFiltrele(kat) {
        aktifKategori = kat;
        if (kat === 'TUMU') {
            filtreliKayitlar = tumKayitlar;
        } else {
            filtreliKayitlar = tumKayitlar.filter(function (k) { return k.kategori === kat; });
        }
        aktifIndeks = 0;

        // Sekme butonlarını güncelle
        [tabBtnKalfalik, tabBtnUstalik, tabBtnPedagoji, tabBtnTumu].forEach(function (btn) {
            if (btn) btn.style.background = '#1e293b';
        });
        if (kat === 'KALFALIK' && tabBtnKalfalik) tabBtnKalfalik.style.background = '#0284c7';
        if (kat === 'USTALIK' && tabBtnUstalik) tabBtnUstalik.style.background = '#d97706';
        if (kat === 'PEDAGOJI' && tabBtnPedagoji) tabBtnPedagoji.style.background = '#7c3aed';
        if (kat === 'TUMU' && tabBtnTumu) tabBtnTumu.style.background = '#334155';

        // Sayaçları güncelle
        var kSayi = tumKayitlar.filter(function (k) { return k.kategori === 'KALFALIK'; }).length;
        var uSayi = tumKayitlar.filter(function (k) { return k.kategori === 'USTALIK'; }).length;
        var pSayi = tumKayitlar.filter(function (k) { return k.kategori === 'PEDAGOJI'; }).length;
        if (sayacKutusu) {
            sayacKutusu.textContent = `Kalfalık: ${kSayi} | Ustalık: ${uSayi} | Pedagoji: ${pSayi} | Aktif: ${filtreliKayitlar.length}`;
        }

        listeyiCiz();
    }

    async function panodanAl() {
        durum('Pano kontrol ediliyor...', '#38bdf8');
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                var metin = await navigator.clipboard.readText();
                var veri = veriyiCoz(metin);
                if (veri && veri.length) {
                    kayitlariYukle(veri);
                    if (yapistirmaKutusu) yapistirmaKutusu.style.display = 'none';
                    return;
                }
            }
            yapistirmaKutusuAc('Panodan otomatik okunamadı. Veriyi aşağıdaki alana yapıştırıp "Yükle" butonuna basın.');
        } catch (e) {
            yapistirmaKutusuAc('Tarayıcı pano erişimine izin vermedi. Lütfen Ctrl+V ile aşağıdaki kutuya yapıştırın.');
        }
    }

    function yapistirmaKutusuAc(mesaj) {
        durum(mesaj, '#fbbf24');
        if (yapistirmaKutusu) {
            yapistirmaKutusu.style.display = 'block';
            if (yapistirmaAlani) {
                yapistirmaAlani.value = '';
                yapistirmaAlani.focus();
            }
        }
    }

    function dosyaSecildi(e) {
        var dosya = e.target.files && e.target.files[0];
        if (!dosya) return;
        var okuyucu = new FileReader();
        okuyucu.onload = function (evt) {
            var veri = veriyiCoz(evt.target.result);
            if (veri && veri.length) {
                kayitlariYukle(veri);
                if (yapistirmaKutusu) yapistirmaKutusu.style.display = 'none';
            } else {
                durum('Seçilen dosyada aday kaydı bulunamadı.', '#f87171');
            }
        };
        okuyucu.readAsText(dosya);
        try { e.target.value = ''; } catch (err) { }
    }

    /* ============================================================
       MEB E-MESEM TAM OTOMATİK İŞ AKIŞI MOTORU
       ============================================================ */
    async function adimiIsle(k) {
        if (!k) throw new Error('İşlenecek aday kaydı bulunamadı.');

        var kat = k.kategori;
        durum(`[${k.tc || k.ad}] 1. Adım: ${kategoriAdiTr(kat)} sekmesi seçiliyor...`, '#38bdf8');
        sesCal('tik');

        // ADIM 1: Kategori Sekmesini Seç (Kalfalık / Ustalık / İş Pedagojisi)
        var arananSekmeler = [];
        if (kat === 'PEDAGOJI') {
            arananSekmeler = ['İş Pedagojisi Kursu', 'İş Pedagojisi', 'Usta Öğreticilik Kursu', 'Usta Öğreticilik'];
        } else if (kat === 'USTALIK') {
            arananSekmeler = ['Ustalık Sınavı', 'Ustalık'];
        } else {
            arananSekmeler = ['Kalfalık Sınavı', 'Kalfalık'];
        }

        var sekmeDugmesi = evrenselMetinleBul('button, a, input[type="button"], input[type="radio"], .tab, span, td, div', arananSekmeler, false);
        if (sekmeDugmesi) {
            vurgula(sekmeDugmesi, '#38bdf8');
            sekmeDugmesi.click();
            await bekle(genelBeklemeSuresi);
        }

        // ADIM 2: Üst Bardaki "Yeni Kayıt" Butonuna Bas
        durum(`[${k.tc}] 2. Adım: "Yeni Kayıt" butonuna tıklanıyor...`, '#38bdf8');
        var yeniKayitBtn = evrenselMetinleBul('button, a, input[type="button"], .btn', ['Yeni Kayıt', 'Yeni Ekle', 'Yeni'], true);
        if (!yeniKayitBtn) {
            yeniKayitBtn = evrenselMetinleBul('button, a, input[type="button"], .btn', ['Yeni Kayıt', 'Yeni Ekle', 'Yeni'], false);
        }

        if (yeniKayitBtn) {
            vurgula(yeniKayitBtn, '#22c55e');
            yeniKayitBtn.click();
            await bekle(genelBeklemeSuresi + 300);
        }

        // ADIM 3: Açılan Pencere/Modal İçi Alanları Doldur
        durum(`[${k.tc}] 3. Adım: Öğrenim Yılı ve Kimlik bilgileri dolduruluyor...`, '#38bdf8');

        // 3.1: Öğrenim Yılı Seçimi
        var ogrenimYiliInput = evrenselInputBul(['ogrenimyili', 'donem', 'ogretimyili', 'egitimyili']);
        if (ogrenimYiliInput) {
            var yilDegeri = k.ogrenimYili || '2025-2026';
            degerYaz(ogrenimYiliInput, yilDegeri);
            vurgula(ogrenimYiliInput, '#38bdf8');
        }

        // 3.2: TC Kimlik No
        var tcInput = evrenselInputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc']);
        if (tcInput && k.tc) {
            degerYaz(tcInput, k.tc);
            vurgula(tcInput, '#38bdf8');
        }

        // 3.3: Doğum Tarihi
        var dogumInput = evrenselInputBul(['dogumtarihi', 'dogum', 'txtdogum']);
        if (dogumInput && k.dogumTarihi) {
            var dStr = k.dogumTarihi;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
                var dp = dStr.split('-');
                dStr = dp[2] + '.' + dp[1] + '.' + dp[0];
            }
            degerYaz(dogumInput, dStr);
            vurgula(dogumInput, '#38bdf8');
        }

        // 3.4: "Sorgula" Butonuna Bas & MERNİS Bekle
        await bekle(400);
        var sorgulaBtn = evrenselMetinleBul('button, a, input[type="button"], .btn', ['Sorgula', 'MERNİS Sorgula', 'Mernis', 'Getir'], false);
        if (sorgulaBtn) {
            durum(`[${k.tc}] MERNİS sorgulanıyor (${mernisBeklemeSuresi / 1000} sn bekleniyor)...`, '#fbbf24');
            vurgula(sorgulaBtn, '#eab308');
            sorgulaBtn.click();
            await bekle(mernisBeklemeSuresi);
        }

        // 3.5: Kapsam Seçimi
        durum(`[${k.tc}] Kapsam, İletişim ve Mezuniyet bilgileri dolduruluyor...`, '#38bdf8');
        var kapsamDeger = k.kapsam;
        if (!kapsamDeger) {
            if (kat === 'PEDAGOJI') kapsamDeger = '31.Madde';
            else if (kat === 'USTALIK') kapsamDeger = '35.Madde';
            else kapsamDeger = '35. Madde';
        }

        var kapsamInput = evrenselInputBul(['kapsam', 'madde', 'kapsamturu']);
        if (kapsamInput) {
            degerYaz(kapsamInput, kapsamDeger);
            vurgula(kapsamInput, '#38bdf8');
        }

        // 3.6: e-Posta & Telefon & Adres
        var epostaInput = evrenselInputBul(['eposta', 'email', 'mail']);
        if (epostaInput && k.eposta) degerYaz(epostaInput, k.eposta);

        var telInput = evrenselInputBul(['telefon', 'tel', 'cep', 'gsm']);
        if (telInput && k.telefon) degerYaz(telInput, k.telefon);

        var adresInput = evrenselInputBul(['adres', 'ikametgah']);
        if (adresInput && k.adres) degerYaz(adresInput, k.adres);

        // 3.7: En Son Mezuniyeti
        var mezuniyetInput = evrenselInputBul(['ensonmezuniyet', 'mezuniyet', 'ogrenimdurumu', 'mezuniyetdurumu']);
        if (mezuniyetInput) {
            degerYaz(mezuniyetInput, k.enSonMezuniyet || 'Lise');
            vurgula(mezuniyetInput, '#38bdf8');
        }

        // 3.8: Getirdiği Belge (Diploma, Tastikname, Diğer)
        var belgeInput = evrenselInputBul(['getirdigibelge', 'belgeturu', 'ogrenimbelgesi']);
        if (belgeInput) {
            var bTur = k.getirdigiBelge || 'Diploma';
            // Tasdikname / Tastikname MEB eşleme
            if (trTemizle(bTur).indexOf('tas') !== -1) bTur = 'Tastikname';
            degerYaz(belgeInput, bTur);
            vurgula(belgeInput, '#38bdf8');
        }

        // 3.9: Belge Tarihi
        var belgeTarihInput = evrenselInputBul(['belgetarihi', 'diplomatarihi']);
        if (belgeTarihInput && k.belgeTarihi) {
            var bTStr = k.belgeTarihi;
            if (/^\d{4}-\d{2}-\d{2}$/.test(bTStr)) {
                var btp = bTStr.split('-');
                bTStr = btp[2] + '.' + btp[1] + '.' + btp[0];
            }
            degerYaz(belgeTarihInput, bTStr);
        }

        // 3.10: Alan & Dal
        var alanInput = evrenselInputBul(['alan', 'alanadi', 'meslek']);
        if (alanInput && k.alan) degerYaz(alanInput, k.alan);

        var dalInput = evrenselInputBul(['dal', 'daladi']);
        if (dalInput && k.dal) degerYaz(dalInput, k.dal);

        await bekle(600);

        // Manuel Onay Modu Kontrolü
        if (manuelOnayModu) {
            durum(`[${k.tc}] Bilgiler dolduruldu. Lütfen formu inceleyip E-MESEM'de Kaydet'e basın veya panelden Devam Edin.`, '#fbbf24');
            k.durum = 'onay_bekliyor';
            return;
        }

        // ADIM 4: "Kaydet" Butonuna Bas
        durum(`[${k.tc}] 4. Adım: Kaydet butonuna tıklanıyor...`, '#22c55e');
        var kaydetBtn = evrenselMetinleBul('button, a, input[type="submit"], input[type="button"], .btn-success, .btn-primary', ['Kaydet', 'Ön Kaydı Tamamla', 'Kaydet ve Kapat'], false);
        if (kaydetBtn) {
            vurgula(kaydetBtn, '#22c55e');
            kaydetBtn.click();
            await bekle(genelBeklemeSuresi + 500);
        }

        k.durum = 'tamamlandi';
        sesCal('basari');
        durum(`✓ [${k.tc}] ${k.ad || ''} ${k.soyad || ''} başarıyla kaydedildi.`, '#4ade80');
    }

    async function seciliKaydiDoldur() {
        if (!filtreliKayitlar.length) {
            durum('Aktarılacak aday bulunamadı.', '#f87171');
            return;
        }
        var k = filtreliKayitlar[aktifIndeks];
        try {
            await adimiIsle(k);
            listeyiCiz();
            if (aktifIndeks < filtreliKayitlar.length - 1) {
                aktifIndeks++;
                listeyiCiz();
            }
        } catch (e) {
            if (k) k.durum = 'hata';
            sesCal('hata');
            listeyiCiz();
            durum('Hata: ' + e.message, '#f87171');
        }
    }

    async function topluAktarimBaslat() {
        if (!filtreliKayitlar.length) {
            durum('Aktarılacak aday yok. Panodan veya JSON dosyasından aktarın.', '#f87171');
            return;
        }

        otomatikCalisiyor = true;
        cubukBtnGuncelle();
        durum(`Toplu aktarım başlatıldı (${filtreliKayitlar.length} aday)...`, '#38bdf8');

        for (var i = aktifIndeks; i < filtreliKayitlar.length; i++) {
            if (!otomatikCalisiyor) break;
            aktifIndeks = i;
            listeyiCiz();
            try {
                await adimiIsle(filtreliKayitlar[i]);
                listeyiCiz();
                await bekle(genelBeklemeSuresi + 600);
            } catch (err) {
                if (filtreliKayitlar[i]) filtreliKayitlar[i].durum = 'hata';
                sesCal('hata');
                listeyiCiz();
                durum(`HATA (${filtreliKayitlar[i].tc}): ${err.message}. Durduruldu.`, '#f87171');
                otomatikCalisiyor = false;
                break;
            }
        }

        otomatikCalisiyor = false;
        cubukBtnGuncelle();
        if (aktifIndeks >= filtreliKayitlar.length - 1 && filtreliKayitlar[aktifIndeks].durum === 'tamamlandi') {
            sesCal('basari');
            durum(`🎉 Seçili kategorideki tüm adayların (${filtreliKayitlar.length} kişi) E-MESEM kayıtları tamamlandı!`, '#4ade80');
        }
    }

    function topluAktarimDurdur() {
        otomatikCalisiyor = false;
        cubukBtnGuncelle();
        durum('Toplu aktarım duraklatıldı.', '#fbbf24');
    }

    function siradakiniGec() {
        if (aktifIndeks < filtreliKayitlar.length - 1) {
            aktifIndeks++;
            listeyiCiz();
            durum(`Sıradaki adaya geçildi (${aktifIndeks + 1} / ${filtreliKayitlar.length}).`, '#60a5fa');
        }
    }

    /* ============================================================
       PANEL VE ARAYÜZ OLUŞTURMA
       ============================================================ */
    panel = el('div', [
        'position:fixed', 'top:16px', 'right:16px', 'width:440px', 'max-height:92vh',
        'background:#0f172a', 'color:#f8fafc', 'border:1px solid #334155', 'border-radius:12px',
        'box-shadow:0 25px 50px -12px rgba(0,0,0,0.85)', 'z-index:2147483647',
        'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'display:flex', 'flex-direction:column', 'overflow:hidden', 'font-size:13px'
    ].join(';'));
    panel.id = 'mesemYardimciPanel';

    // Header
    var baslik = el('div', 'display:flex; align-items:center; gap:8px; padding:12px 14px; background:#1e293b; cursor:move; user-select:none; border-bottom:1px solid #334155;');
    baslik.appendChild(el('strong', 'flex:1; font-size:13.5px; color:#f59e0b; display:flex; align-items:center; gap:6px;', '⚡ E-MESEM Robotu v' + SURUM));
    var kucultDugme = el('button', 'border:0; background:#334155; color:#f8fafc; width:26px; height:26px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px;', '–');
    var kapatDugme = el('button', 'border:0; background:#dc2626; color:#fff; width:26px; height:26px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px; margin-left:4px;', '×');
    baslik.appendChild(kucultDugme); baslik.appendChild(kapatDugme);

    var govde = el('div', 'display:flex; flex-direction:column; min-height:0;');

    // Dosya Seçici
    dosyaGirdi = el('input');
    dosyaGirdi.type = 'file';
    dosyaGirdi.accept = '.json';
    dosyaGirdi.style.display = 'none';
    dosyaGirdi.addEventListener('change', dosyaSecildi);

    // Kategori Sekmeleri Barı
    var kategoriBar = el('div', 'display:flex; gap:4px; padding:8px 10px; background:#0b1120; border-bottom:1px solid #334155;');
    
    function sekmeBtnOlustur(metin, kat) {
        var b = el('button', 'flex:1; padding:6px 4px; font-size:11px; font-weight:700; border:0; border-radius:4px; cursor:pointer; color:#fff; background:#1e293b; transition:background .15s;', metin);
        b.onclick = function () { kategoriFiltrele(kat); };
        return b;
    }

    tabBtnKalfalik = sekmeBtnOlustur('Kalfalık', 'KALFALIK');
    tabBtnUstalik = sekmeBtnOlustur('Ustalık', 'USTALIK');
    tabBtnPedagoji = sekmeBtnOlustur('İş Pedagojisi', 'PEDAGOJI');
    tabBtnTumu = sekmeBtnOlustur('Tümü', 'TUMU');

    kategoriBar.appendChild(tabBtnKalfalik);
    kategoriBar.appendChild(tabBtnUstalik);
    kategoriBar.appendChild(tabBtnPedagoji);
    kategoriBar.appendChild(tabBtnTumu);

    // Ana Butonlar
    var dugmeCubugu = el('div', 'display:flex; flex-wrap:wrap; gap:6px; padding:8px 10px; border-bottom:1px solid #334155; background:#1e293b;');
    
    var btnPano = el('button', 'padding:6px 10px; font-size:11.5px; font-weight:600; cursor:pointer; background:#2563eb; color:#fff; border:0; border-radius:6px;', '📋 Panodan Al');
    btnPano.onclick = panodanAl;

    var btnJson = el('button', 'padding:6px 10px; font-size:11.5px; font-weight:600; cursor:pointer; background:#0d9488; color:#fff; border:0; border-radius:6px;', '📂 JSON Yükle');
    btnJson.onclick = function () { if (dosyaGirdi) dosyaGirdi.click(); };

    var btnTekDoldur = el('button', 'padding:6px 10px; font-size:11.5px; font-weight:600; cursor:pointer; background:#16a34a; color:#fff; border:0; border-radius:6px;', '▶ Bu Adayı Kaydet');
    btnTekDoldur.onclick = seciliKaydiDoldur;

    btnToplu = el('button', 'padding:6px 10px; font-size:11.5px; font-weight:600; cursor:pointer; background:#8b5cf6; color:#fff; border:0; border-radius:6px;', '⏩ Sırayla Kaydet');
    btnToplu.onclick = function () {
        if (otomatikCalisiyor) topluAktarimDurdur(); else topluAktarimBaslat();
    };

    var btnGec = el('button', 'padding:6px 8px; font-size:11.5px; font-weight:600; cursor:pointer; background:#475569; color:#fff; border:0; border-radius:6px;', '⏭ Geç');
    btnGec.title = 'Sıradaki adaya geç';
    btnGec.onclick = siradakiniGec;

    function cubukBtnGuncelle() {
        if (!btnToplu) return;
        if (otomatikCalisiyor) {
            btnToplu.textContent = '⏸ Duraklat';
            btnToplu.style.background = '#dc2626';
        } else {
            btnToplu.textContent = '⏩ Sırayla Kaydet';
            btnToplu.style.background = '#8b5cf6';
        }
    }

    dugmeCubugu.appendChild(btnPano);
    dugmeCubugu.appendChild(btnJson);
    dugmeCubugu.appendChild(btnTekDoldur);
    dugmeCubugu.appendChild(btnToplu);
    dugmeCubugu.appendChild(btnGec);

    // Durum ve Sayaç
    durumYazi = el('div', 'padding:8px 10px; font-size:11.5px; color:#cbd5e1; border-bottom:1px solid #334155; line-height:1.4; background:#090d16;',
        'Robot hazır. Başvuru verilerini aktarmak için "📋 Panodan Al" veya "📂 JSON Yükle"ye tıklayın.');

    sayacKutusu = el('div', 'padding:4px 10px; font-size:10.5px; color:#94a3b8; background:#0b1120; border-bottom:1px solid #1e293b;',
        'Kalfalık: 0 | Ustalık: 0 | Pedagoji: 0 | Aktif: 0');

    // Yapıştırma Kutusu
    yapistirmaKutusu = el('div', 'display:none; padding:8px 10px; background:#1e293b; border-bottom:1px solid #334155;');
    var yapistirmaBaslik = el('div', 'font-size:11px; color:#fbbf24; margin-bottom:4px; font-weight:600;', '📝 Pano Verisini Buraya Yapıştırın (Ctrl+V):');
    yapistirmaAlani = el('textarea', 'width:100%; box-sizing:border-box; height:60px; background:#0f172a; color:#e2e8f0; border:1px solid #475569; border-radius:6px; font-size:11px; padding:6px; resize:vertical;');
    var yapistirmaButonlar = el('div', 'display:flex; justify-content:flex-end; gap:6px; margin-top:4px;');
    var btnYukleText = el('button', 'padding:4px 10px; background:#16a34a; color:#fff; border:0; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;', '✓ Yükle');
    var btnIptalText = el('button', 'padding:4px 8px; background:#475569; color:#fff; border:0; border-radius:4px; font-size:11px; cursor:pointer;', 'İptal');
    
    btnYukleText.onclick = function () {
        var v = veriyiCoz(yapistirmaAlani.value);
        if (v && v.length) {
            kayitlariYukle(v);
            yapistirmaKutusu.style.display = 'none';
            yapistirmaAlani.value = '';
        } else {
            durum('Yapıştırılan metin geçerli aday JSON verisi içermiyor.', '#f87171');
        }
    };
    btnIptalText.onclick = function () { yapistirmaKutusu.style.display = 'none'; };

    yapistirmaButonlar.appendChild(btnIptalText);
    yapistirmaButonlar.appendChild(btnYukleText);
    yapistirmaKutusu.appendChild(yapistirmaBaslik);
    yapistirmaKutusu.appendChild(yapistirmaAlani);
    yapistirmaKutusu.appendChild(yapistirmaButonlar);

    // Aday Listesi
    listeKutusu = el('div', 'overflow-y:auto; min-height:80px; max-height:42vh; padding:4px 0; background:#0b1120;');

    function listeyiCiz() {
        listeKutusu.textContent = '';
        if (!filtreliKayitlar.length) {
            listeKutusu.appendChild(el('div', 'padding:16px 12px; color:#94a3b8; text-align:center; font-size:12px; line-height:1.5;',
                'Seçili kategoride aday bulunamadı. Başvuru yönetim sisteminden verileri panoya kopyalayıp buradaki "📋 Panodan Al"a tıklayın.'));
            return;
        }

        filtreliKayitlar.forEach(function (k, i) {
            var satir = el('div', 'display:flex; align-items:center; gap:8px; padding:7px 10px; border-bottom:1px solid #1e293b; cursor:pointer; background:' + (i === aktifIndeks ? '#1e3a8a' : 'transparent') + ';');
            
            var durumRozet = el('span', 'font-size:10px; padding:2px 5px; border-radius:4px; font-weight:bold; color:#fff;', (i + 1));
            if (k.durum === 'tamamlandi') {
                durumRozet.textContent = '✓ ' + (i + 1);
                durumRozet.style.background = '#16a34a';
            } else if (k.durum === 'hata') {
                durumRozet.textContent = '! ' + (i + 1);
                durumRozet.style.background = '#dc2626';
            } else if (k.durum === 'onay_bekliyor') {
                durumRozet.textContent = '? ' + (i + 1);
                durumRozet.style.background = '#f59e0b';
            } else {
                durumRozet.style.background = (i === aktifIndeks ? '#3b82f6' : '#334155');
            }
            
            var icerikKutu = el('div', 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;');
            var adSoyad = el('div', 'font-weight:600; color:#f8fafc; font-size:12px;', `${k.ad || ''} ${k.soyad || ''} (${k.tc || '-'})`);
            var detay = el('div', 'font-size:10.5px; color:#94a3b8;', `${k.alan || '-'} / ${k.dal || '-'} • [${k.kapsam || '35. Madde'}]`);
            icerikKutu.appendChild(adSoyad);
            icerikKutu.appendChild(detay);

            satir.onclick = function () {
                aktifIndeks = i;
                listeyiCiz();
                durum(`Seçili: ${k.ad || ''} ${k.soyad || ''} (${k.tc}) - ${kategoriAdiTr(k.kategori)}`, '#60a5fa');
            };
            satir.appendChild(durumRozet);
            satir.appendChild(icerikKutu);
            listeKutusu.appendChild(satir);
        });
    }

    // Ayarlar Barı (Bekleme Süresi & Manuel Onay)
    var ayarSatiri = el('div', 'display:flex; align-items:center; justify-content:space-between; padding:6px 10px; font-size:11px; color:#94a3b8; border-top:1px solid #334155; background:#1e293b; flex-wrap:wrap; gap:6px;');
    
    var solAyar = el('div', 'display:flex; align-items:center; gap:6px;');
    solAyar.appendChild(el('span', null, 'MERNİS:'));
    var selGecikme = el('select', 'background:#0f172a; color:#fff; border:1px solid #475569; border-radius:4px; padding:2px 4px; font-size:11px;');
    [['1200', '1.2s'], ['2200', '2.2s'], ['3200', '3.2s'], ['4800', '4.8s']].forEach(function (opt) {
        var o = el('option', null, opt[1]);
        o.value = opt[0];
        if (opt[0] === '2200') o.selected = true;
        selGecikme.appendChild(o);
    });
    selGecikme.onchange = function () { mernisBeklemeSuresi = Number(selGecikme.value) || 2200; };
    solAyar.appendChild(selGecikme);

    var sagAyar = el('label', 'display:inline-flex; align-items:center; gap:4px; cursor:pointer; user-select:none; font-size:11px;');
    var chkManuel = el('input');
    chkManuel.type = 'checkbox';
    chkManuel.onchange = function () { manuelOnayModu = chkManuel.checked; };
    sagAyar.appendChild(chkManuel);
    sagAyar.appendChild(el('span', null, 'Kaydetmeden Önce Dur'));

    ayarSatiri.appendChild(solAyar);
    ayarSatiri.appendChild(sagAyar);

    govde.appendChild(kategoriBar);
    govde.appendChild(dugmeCubugu);
    govde.appendChild(durumYazi);
    govde.appendChild(sayacKutusu);
    govde.appendChild(yapistirmaKutusu);
    govde.appendChild(listeKutusu);
    govde.appendChild(ayarSatiri);

    panel.appendChild(baslik);
    panel.appendChild(govde);
    document.body.appendChild(panel);
    document.body.appendChild(dosyaGirdi);

    // Panel kontrolleri
    kucultDugme.onclick = function () {
        var kapali = govde.style.display === 'none';
        govde.style.display = kapali ? 'flex' : 'none';
        kucultDugme.textContent = kapali ? '–' : '+';
    };
    kapatDugme.onclick = function () {
        panel.remove();
        if (dosyaGirdi) dosyaGirdi.remove();
        window.__mesemYardimci = null;
    };

    // Sürükleme Mantığı
    (function () {
        var suruklu = false, bx = 0, by = 0;
        baslik.addEventListener('mousedown', function (o) {
            if (o.target !== baslik && o.target.tagName === 'BUTTON') return;
            suruklu = true;
            bx = o.clientX - panel.offsetLeft;
            by = o.clientY - panel.offsetTop;
            o.preventDefault();
        });
        document.addEventListener('mousemove', function (o) {
            if (!suruklu) return;
            panel.style.left = Math.max(0, o.clientX - bx) + 'px';
            panel.style.top = Math.max(0, o.clientY - by) + 'px';
            panel.style.right = 'auto';
        });
        document.addEventListener('mouseup', function () { suruklu = false; });
    })();

    kategoriFiltrele('TUMU');

    window.__mesemYardimci = {
        gosterGizle: function () {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        },
        kayitlariYukle: kayitlariYukle,
        adimiIsle: adimiIsle
    };
})();
