/* ==================================================================
   E-MESEM Sınav Öğrenci Ön Kayıt & Otomasyon Robotu (v4.5)
   Geliştirici: Görkem Kocaman © 2026
   ------------------------------------------------------------------
   MEB E-MESEM (emesem.meb.gov.tr) portalında "Sınav Öğrenci Ön Kayıt"
   ekranında tam otomatik, akıllı alan öğreticili (Selector Mapper),
   adım adım manuel denetimli ve hatasız kayıt motoru.

   Temel Yetenekler:
     1. 🎯 Akıllı Alan Öğretici & Eşleme Modu (Selector Mapper)
     2. 🐾 Adım Adım Manuel Denetim (Step-by-Step Test Modu)
     3. 📟 Canlı Log Konsolu & Sesli Bildirim Sistemi
     4. 🔍 Sayfa Teşhis Aracı (DOM Inspector & Dumper)
     5. ⚡ Full Event Simulation (React / Angular / Vue / ASP.NET / jQuery Uyumlu)
     6. 🛡️ Akıllı MERNİS Bekleme & Erken Kaydetme Koruması
     7. 📅 Dönemli Öğrenim Yılı (örn: 2026-2027 I. Dönem) & Katı Kategori Eşleme
================================================================== */
(function () {
    'use strict';

    if (window.__mesemYardimci) {
        window.__mesemYardimci.gosterGizle();
        return;
    }

    var SURUM = "4.5";
    var STORAGE_ESLEME_ANAHTARI = "mesem_ogretilmis_alanlar_v4";
    
    var tumKayitlar = [];          // Sisteme yüklenen tüm adaylar
    var filtreliKayitlar = [];     // Seçili kategoriye göre filtrelenmiş liste
    var aktifKategori = 'TUMU';    // 'KALFALIK', 'USTALIK', 'PEDAGOJI', 'TUMU'
    var aktifIndeks = 0;           // Filtreli listedeki aktif aday sırası
    var otomatikCalisiyor = false; // Toplu aktarım döngü durumu
    var manuelOnayModu = false;    // Kaydetmeden önce duraklayıp kullanıcı onayı bekleme
    var mernisBeklemeSuresi = 2500;// MERNİS sorgu bekleme süresi (ms)
    var genelBeklemeSuresi = 800;  // Adımlar arası bekleme süresi (ms)
    var ogretmeModuAktif = false;  // Selector mapper aktif mi
    var ogretilenHedefAlan = null; // Sıradaki öğretilen alan kimliği
    var ogretmeListesiSirasi = 0;

    // Özel Alan Eşlemeleri (localStorage)
    var ozelEslemeler = {};
    try {
        var kayitliEslemeler = localStorage.getItem(STORAGE_ESLEME_ANAHTARI);
        if (kayitliEslemeler) ozelEslemeler = JSON.parse(kayitliEslemeler);
    } catch (e) { ozelEslemeler = {}; }

    // Öğretilebilir Alanlar Tanım Listesi
    var OGRETILEBILIR_ALANLAR = [
        { id: 'kalfalikSekme', ad: 'Kalfalık Sınavı Sekmesi', tip: 'buton' },
        { id: 'ustalikSekme', ad: 'Ustalık Sınavı Sekmesi', tip: 'buton' },
        { id: 'pedagojiSekme', ad: 'İş Pedagojisi Sekmesi', tip: 'buton' },
        { id: 'yeniKayitBtn', ad: '"Yeni Kayıt" Butonu', tip: 'buton' },
        { id: 'ogrenimYili', ad: 'Öğrenim Yılı Seçimi', tip: 'select' },
        { id: 'tc', ad: 'T.C. Kimlik No Kutusu', tip: 'input' },
        { id: 'dogumTarihi', ad: 'Doğum Tarihi Kutusu', tip: 'input' },
        { id: 'sorgulaBtn', ad: '"Sorgula" (MERNİS) Butonu', tip: 'buton' },
        { id: 'kapsam', ad: 'Kapsam Maddesi Seçimi', tip: 'select' },
        { id: 'eposta', ad: 'E-posta Kutusu', tip: 'input' },
        { id: 'telefon', ad: 'Telefon Kutusu', tip: 'input' },
        { id: 'adres', ad: 'Adres / İkametgâh', tip: 'input' },
        { id: 'enSonMezuniyet', ad: 'En Son Mezuniyeti Seçimi', tip: 'select' },
        { id: 'getirdigiBelge', ad: 'Getirdiği Belge Seçimi', tip: 'select' },
        { id: 'belgeTarihi', ad: 'Belge Tarihi Kutusu', tip: 'input' },
        { id: 'alan', ad: 'Alan Adı Kutusu', tip: 'input' },
        { id: 'dal', ad: 'Dal Adı Kutusu', tip: 'input' },
        { id: 'kaydetBtn', ad: '"Kaydet" Butonu', tip: 'buton' }
    ];

    // UI Bileşenleri Referansları
    var panel, listeKutusu, durumYazi, sayacKutusu, btnToplu, btnManuelOnay, dosyaGirdi;
    var yapistirmaKutusu, yapistirmaAlani, logKonsolu, logIcerik, teshisModal, ogreticiModal;
    var tabBtnKalfalik, tabBtnUstalik, tabBtnPedagoji, tabBtnTumu;
    var adimAdimKutusu;

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

    /* ---------------- Canlı Log Konsolu & Durum ---------------- */
    function formatZaman() {
        var d = new Date();
        return [
            String(d.getHours()).padStart(2, '0'),
            String(d.getMinutes()).padStart(2, '0'),
            String(d.getSeconds()).padStart(2, '0')
        ].join(':');
    }

    function logEkle(mesaj, tur) {
        var zaman = formatZaman();
        var renk = '#cbd5e1';
        if (tur === 'basari') renk = '#4ade80';
        else if (tur === 'hata') renk = '#f87171';
        else if (tur === 'uyari') renk = '#fbbf24';
        else if (tur === 'islem') renk = '#38bdf8';

        if (logIcerik) {
            var satir = document.createElement('div');
            satir.style.cssText = 'padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.05); color:' + renk + ';';
            satir.textContent = '[' + zaman + '] ' + mesaj;
            logIcerik.appendChild(satir);
            logIcerik.scrollTop = logIcerik.scrollHeight;
        }

        // Konsola da yaz
        if (tur === 'hata') console.error('[E-MESEM Robot]', mesaj);
        else console.log('[E-MESEM Robot]', mesaj);
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

    /* ---------------- DOM & Belge Yardımcıları ---------------- */
    function el(etiket, stil, metin) {
        var e = document.createElement(etiket);
        if (stil) e.setAttribute('style', stil);
        if (metin != null) e.textContent = metin;
        return e;
    }

    function vurgula(hedef, renk) {
        if (!hedef) return;
        try {
            var eski = hedef.style.outline;
            var eskiGolge = hedef.style.boxShadow;
            hedef.style.outline = '3px solid ' + (renk || '#f59e0b');
            hedef.style.boxShadow = '0 0 12px ' + (renk || '#f59e0b');
            setTimeout(function () {
                hedef.style.outline = eski;
                hedef.style.boxShadow = eskiGolge;
            }, 1800);
        } catch (e) { }
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

    /* ---------------- Selector Üretici (Mapper için) ---------------- */
    function benzersizSelectorUret(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
        if (el.id) return '#' + CSS.escape(el.id);
        if (el.name) return el.tagName.toLowerCase() + '[name="' + CSS.escape(el.name) + '"]';

        var yol = [];
        var curr = el;
        while (curr && curr.nodeType === Node.ELEMENT_NODE && curr !== document.body && curr !== document.documentElement) {
            var etiket = curr.tagName.toLowerCase();
            if (curr.id) {
                yol.unshift('#' + CSS.escape(curr.id));
                break;
            }
            var kardesler = curr.parentElement ? Array.prototype.filter.call(curr.parentElement.children, function (k) { return k.tagName === curr.tagName; }) : [];
            if (kardesler.length > 1) {
                var index = kardesler.indexOf(curr) + 1;
                yol.unshift(etiket + ':nth-of-type(' + index + ')');
            } else {
                yol.unshift(etiket);
            }
            curr = curr.parentElement;
        }
        return yol.join(' > ');
    }

    /* Öğretilmiş Selector İle Eleman Bul */
    function ogretilmisAlanBul(alanId) {
        if (!ozelEslemeler || !ozelEslemeler[alanId]) return null;
        var selector = ozelEslemeler[alanId];
        var belgeler = tumBelgeleriGetir();
        for (var i = 0; i < belgeler.length; i++) {
            try {
                var bulunan = belgeler[i].querySelector(selector);
                if (bulunan) return bulunan;
            } catch (e) { }
        }
        return null;
    }

    /* Evrensel Metinle Eleman Bulucu (Katı Eşleşme Desteğiyle) */
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

    /* ============================================================
       GELİŞMİŞ DEĞER YAZMA & FULL EVENT SIMULATION
       ============================================================ */
    function degerYaz(hedef, deger) {
        if (!hedef) return false;
        if (hedef.type === 'file') return false;

        var etiket = (hedef.tagName || '').toLowerCase();

        // 1. SELECT ELEMENTİ
        if (etiket === 'select') {
            return selectDegerSec(hedef, deger);
        }

        // 2. CHECKBOX / RADIO
        if (hedef.type === 'checkbox' || hedef.type === 'radio') {
            var acik = deger === true || deger === 'Evet' || deger === 'true' || deger === '1' || deger === 1;
            try {
                if (hedef.checked !== acik) {
                    hedef.checked = acik;
                    hedef.click();
                    hedef.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } catch (e) { }
            return true;
        }

        // 3. INPUT / TEXTAREA
        var strDeger = String(deger != null ? deger : '');

        // Doğum Tarihi / Date Format Adaptasyonu
        if (hedef.type === 'date' && strDeger.indexOf('.') !== -1) {
            var dp = strDeger.split('.');
            if (dp.length === 3) strDeger = dp[2] + '-' + dp[1] + '-' + dp[0];
        }

        try {
            hedef.focus();
        } catch (e) { }

        var atandi = false;
        try {
            var proto = etiket === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
            var descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
            if (descriptor && descriptor.set) {
                descriptor.set.call(hedef, strDeger);
                atandi = true;
            }
        } catch (e) { }

        if (!atandi) {
            try { hedef.value = strDeger; } catch (e) { return false; }
        }

        // Full Event Trigger Zinciri (React / Vue / ASP.NET / jQuery)
        try {
            hedef.dispatchEvent(new Event('focus', { bubbles: true }));
            hedef.dispatchEvent(new Event('input', { bubbles: true }));
            hedef.dispatchEvent(new Event('change', { bubbles: true }));
            hedef.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13, which: 13 }));
            hedef.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'Enter', keyCode: 13, which: 13 }));
            hedef.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', keyCode: 13, which: 13 }));
            hedef.dispatchEvent(new Event('blur', { bubbles: true }));
            hedef.blur();
        } catch (e) { }

        return true;
    }

    /* Öğrenim Yılı & Dönemli Select Seçim Motoru */
    function selectDegerSec(selectEl, arananDeger) {
        if (!selectEl || !selectEl.options) return false;
        var aranan = trTemizle(arananDeger);
        var options = selectEl.options;
        var bulundu = false;

        // 1. Tam Eşleşme
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var t = trTemizle(opt.textContent);
            var v = trTemizle(opt.value);
            if (aranan && (t === aranan || v === aranan)) {
                selectEl.selectedIndex = i;
                selectEl.value = opt.value;
                bulundu = true;
                break;
            }
        }

        // 2. Kısmi / Dönemli Eşleşme (örn: 2026-2027 I. Dönem)
        if (!bulundu && aranan) {
            // Yıl parçalarını çıkar (örn: 2026, 2027)
            var yillar = String(arananDeger || '').match(/\d{4}/g) || [];
            
            for (var j = 0; j < options.length; j++) {
                var o = options[j];
                var optText = trTemizle(o.textContent);
                var optVal = trTemizle(o.value);

                // Tüm yıl parçalarını içeriyor mu? (Örn hem 2026 hem 2027)
                var yillarUyuyor = yillar.length > 0 && yillar.every(function (y) {
                    return optText.indexOf(y) !== -1 || optVal.indexOf(y) !== -1;
                });

                if (yillarUyuyor || optText.indexOf(aranan) !== -1 || aranan.indexOf(optText) !== -1) {
                    selectEl.selectedIndex = j;
                    selectEl.value = o.value;
                    bulundu = true;
                    break;
                }
            }
        }

        // 3. Fallback: Seçiniz olmayan ilk geçerli seçenek
        if (!bulundu && options.length > 1) {
            for (var k = 0; k < options.length; k++) {
                var op = options[k];
                var txt = trTemizle(op.textContent);
                if (op.value !== '' && txt.indexOf('seciniz') === -1 && txt.indexOf('sec') === -1) {
                    selectEl.selectedIndex = k;
                    selectEl.value = op.value;
                    bulundu = true;
                    logEkle('Select için tam eşleşme bulunamadı, ilk geçerli seçenek seçildi: ' + op.textContent, 'uyari');
                    break;
                }
            }
        }

        if (bulundu) {
            try {
                selectEl.dispatchEvent(new Event('input', { bubbles: true }));
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                selectEl.dispatchEvent(new Event('blur', { bubbles: true }));
            } catch (e) { }
            return true;
        }
        return false;
    }

    /* ---------------- Kategori & Veri Yönetimi ---------------- */
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
            var nesne = JSON.parse(metin.trim());
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
        logEkle('Toplam ' + tumKayitlar.length + ' aday robot paneline yüklendi.', 'basari');
        durum('✓ Toplam ' + tumKayitlar.length + ' aday robot paneline yüklendi.', '#4ade80');
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
            sayacKutusu.textContent = 'Kalfalık: ' + kSayi + ' | Ustalık: ' + uSayi + ' | Pedagoji: ' + pSayi + ' | Aktif Liste: ' + filtreliKayitlar.length;
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
                logEkle('JSON dosyasında aday kaydı okunamadı.', 'hata');
            }
        };
        okuyucu.readAsText(dosya);
        try { e.target.value = ''; } catch (err) { }
    }

    /* ============================================================
       MEB E-MESEM ADIM ADIM İŞLEM FONKSİYONLARI (MODÜLER)
       ============================================================ */

    // ADIM 1: Kategori Sekmesini Seç (Kalfalık / Ustalık / Pedagoji)
    async function adim1_SekmeSec(k) {
        var kat = k.kategori;
        logEkle('1. Adım: ' + kategoriAdiTr(kat) + ' sekmesi aranıyor...', 'islem');

        var ozelSekme = null;
        if (kat === 'PEDAGOJI') ozelSekme = ogretilmisAlanBul('pedagojiSekme');
        else if (kat === 'USTALIK') ozelSekme = ogretilmisAlanBul('ustalikSekme');
        else ozelSekme = ogretilmisAlanBul('kalfalikSekme');

        if (ozelSekme) {
            vurgula(ozelSekme, '#38bdf8');
            ozelSekme.click();
            logEkle('✓ Özel eşlenen ' + kategoriAdiTr(kat) + ' sekmesi tıklandı.', 'basari');
            await bekle(genelBeklemeSuresi);
            return true;
        }

        // Katı Arama Listesi: Yanlış sekme tıklanması engellenir
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
            logEkle('✓ ' + kategoriAdiTr(kat) + ' sekmesi bulundu ve tıklandı.', 'basari');
            await bekle(genelBeklemeSuresi);
            return true;
        } else {
            logEkle('Uyarı: ' + kategoriAdiTr(kat) + ' sekmesi bulunamadı, mevcut aktif ekrandan devam ediliyor.', 'uyari');
            return false;
        }
    }

    // ADIM 2: Yeni Kayıt Butonuna Bas
    async function adim2_YeniKayitAc(k) {
        logEkle('2. Adım: "Yeni Kayıt" butonu aranıyor...', 'islem');
        var btn = ogretilmisAlanBul('yeniKayitBtn') ||
                  evrenselMetinleBul('button, a, input[type="button"], .btn', ['Yeni Kayıt', 'Yeni Ekle', 'Yeni'], true) ||
                  evrenselMetinleBul('button, a, input[type="button"], .btn', ['Yeni Kayıt', 'Yeni Ekle', 'Yeni'], false);

        if (btn) {
            vurgula(btn, '#22c55e');
            btn.click();
            logEkle('✓ "Yeni Kayıt" butonuna tıklandı, formun açılması bekleniyor.', 'basari');
            await bekle(genelBeklemeSuresi + 300);
            return true;
        } else {
            logEkle('Uyarı: "Yeni Kayıt" butonu bulunamadı, formun zaten açık olduğu varsayılıyor.', 'uyari');
            return false;
        }
    }

    // ADIM 3: Öğrenim Yılı, TC ve Doğum Tarihi Doldur
    async function adim3_TcTarihDoldur(k) {
        logEkle('3. Adım: Öğrenim Yılı, TC ve Doğum Tarihi dolduruluyor...', 'islem');

        // 3.1: Öğrenim Yılı
        var ogrenimYiliEl = ogretilmisAlanBul('ogrenimYili') || evrenselInputBul(['ogrenimyili', 'donem', 'ogretimyili', 'egitimyili']);
        if (ogrenimYiliEl) {
            var hedefYil = k.ogrenimYili || '2025-2026';
            degerYaz(ogrenimYiliEl, hedefYil);
            vurgula(ogrenimYiliEl, '#38bdf8');
            logEkle('Öğrenim yılı seçildi: ' + hedefYil, 'islem');
        }

        // 3.2: TC Kimlik No
        var tcEl = ogretilmisAlanBul('tc') || evrenselInputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc']);
        if (tcEl && k.tc) {
            degerYaz(tcEl, k.tc);
            vurgula(tcEl, '#38bdf8');
            logEkle('TC Kimlik No yazıldı: ' + k.tc, 'islem');
        } else {
            logEkle('Hata: TC Kimlik No kutusu bulunamadı!', 'hata');
        }

        // 3.3: Doğum Tarihi
        var dogumEl = ogretilmisAlanBul('dogumTarihi') || evrenselInputBul(['dogumtarihi', 'dogum', 'txtdogum']);
        if (dogumEl && k.dogumTarihi) {
            var dStr = k.dogumTarihi;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
                var dp = dStr.split('-');
                dStr = dp[2] + '.' + dp[1] + '.' + dp[0];
            }
            degerYaz(dogumEl, dStr);
            vurgula(dogumEl, '#38bdf8');
            logEkle('Doğum Tarihi yazıldı: ' + dStr, 'islem');
        }

        await bekle(350);
        return true;
    }

    // ADIM 4: Sorgula'ya Bas ve MERNİS Bekle
    async function adim4_SorgulaVeMernisBekle(k) {
        logEkle('4. Adım: MERNİS Sorgula butonuna basılıyor...', 'islem');

        // Ön Kontrol: TC ve Doğum alanlarının değerlerini doğrula
        var tcEl = ogretilmisAlanBul('tc') || evrenselInputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc']);
        if (tcEl && (!tcEl.value || tcEl.value.trim().length < 11) && k.tc) {
            degerYaz(tcEl, k.tc);
            await bekle(200);
        }

        var sorgulaBtn = ogretilmisAlanBul('sorgulaBtn') ||
                         evrenselMetinleBul('button, a, input[type="button"], .btn', ['Sorgula', 'MERNİS Sorgula', 'Mernis', 'Getir'], false);

        if (sorgulaBtn) {
            vurgula(sorgulaBtn, '#eab308');
            sorgulaBtn.click();
            logEkle('Sorgula tıklandı, MERNİS yanıtı bekleniyor (max ' + (mernisBeklemeSuresi / 1000) + ' sn)...', 'uyari');
            
            // Dinamik MERNİS Polling (Ad / Soyad inputunun dolmasını izle)
            var baslangic = Date.now();
            var mernisGeldi = false;
            while (Date.now() - baslangic < mernisBeklemeSuresi) {
                await bekle(300);
                var adInput = evrenselInputBul(['txtad', 'txtadi', 'ad', 'adi', 'ogrenciadi']);
                if (adInput && adInput.value && adInput.value.trim().length > 1) {
                    mernisGeldi = true;
                    logEkle('✓ MERNİS verisi ekrana geldi: ' + adInput.value.trim(), 'basari');
                    break;
                }
            }
            if (!mernisGeldi) {
                await bekle(400);
                logEkle('MERNİS bekleme süresi tamamlandı, forma devam ediliyor.', 'islem');
            }
            return true;
        } else {
            logEkle('Uyarı: "Sorgula" butonu bulunamadı, MERNİS adımı atlanıyor.', 'uyari');
            return false;
        }
    }

    // ADIM 5: Kapsam, İletişim, Mezuniyet ve Belge Bilgilerini Doldur
    async function adim5_KapsamVeBilgileriDoldur(k) {
        logEkle('5. Adım: Kapsam, İletişim ve Belge bilgileri dolduruluyor...', 'islem');
        var kat = k.kategori;

        // 5.1: Kapsam Seçimi
        var kapsamDeger = k.kapsam;
        if (!kapsamDeger) {
            if (kat === 'PEDAGOJI') kapsamDeger = '31.Madde';
            else if (kat === 'USTALIK') kapsamDeger = '35.Madde';
            else kapsamDeger = '35. Madde';
        }
        var kapsamEl = ogretilmisAlanBul('kapsam') || evrenselInputBul(['kapsam', 'madde', 'kapsamturu']);
        if (kapsamEl) {
            degerYaz(kapsamEl, kapsamDeger);
            vurgula(kapsamEl, '#38bdf8');
            logEkle('Kapsam seçildi: ' + kapsamDeger, 'islem');
        }

        // 5.2: E-posta, Telefon, Adres
        var epostaEl = ogretilmisAlanBul('eposta') || evrenselInputBul(['eposta', 'email', 'mail']);
        if (epostaEl && k.eposta) degerYaz(epostaEl, k.eposta);

        var telEl = ogretilmisAlanBul('telefon') || evrenselInputBul(['telefon', 'tel', 'cep', 'gsm']);
        if (telEl && k.telefon) degerYaz(telEl, k.telefon);

        var adresEl = ogretilmisAlanBul('adres') || evrenselInputBul(['adres', 'ikametgah']);
        if (adresEl && k.adres) degerYaz(adresEl, k.adres);

        // 5.3: En Son Mezuniyeti
        var mezuniyetEl = ogretilmisAlanBul('enSonMezuniyet') || evrenselInputBul(['ensonmezuniyet', 'mezuniyet', 'ogrenimdurumu', 'mezuniyetdurumu']);
        if (mezuniyetEl) {
            degerYaz(mezuniyetEl, k.enSonMezuniyet || 'Lise');
            vurgula(mezuniyetEl, '#38bdf8');
        }

        // 5.4: Getirdiği Belge
        var belgeEl = ogretilmisAlanBul('getirdigiBelge') || evrenselInputBul(['getirdigibelge', 'belgeturu', 'ogrenimbelgesi']);
        if (belgeEl) {
            var bTur = k.getirdigiBelge || 'Diploma';
            if (trTemizle(bTur).indexOf('tas') !== -1) bTur = 'Tastikname';
            degerYaz(belgeEl, bTur);
            vurgula(belgeEl, '#38bdf8');
        }

        // 5.5: Belge Tarihi
        var belgeTarihEl = ogretilmisAlanBul('belgeTarihi') || evrenselInputBul(['belgetarihi', 'diplomatarihi']);
        if (belgeTarihEl && k.belgeTarihi) {
            var bTStr = k.belgeTarihi;
            if (/^\d{4}-\d{2}-\d{2}$/.test(bTStr)) {
                var btp = bTStr.split('-');
                bTStr = btp[2] + '.' + btp[1] + '.' + btp[0];
            }
            degerYaz(belgeTarihEl, bTStr);
        }

        // 5.6: Alan & Dal
        var alanEl = ogretilmisAlanBul('alan') || evrenselInputBul(['alan', 'alanadi', 'meslek']);
        if (alanEl && k.alan) degerYaz(alanEl, k.alan);

        var dalEl = ogretilmisAlanBul('dal') || evrenselInputBul(['dal', 'daladi']);
        if (dalEl && k.dal) degerYaz(dalEl, k.dal);

        await bekle(500);
        logEkle('✓ Tüm form alanları dolduruldu.', 'basari');
        return true;
    }

    // ADIM 6: Kaydet Butonuna Bas
    async function adim6_Kaydet(k) {
        logEkle('6. Adım: Kaydet butonuna basılıyor...', 'islem');
        var kaydetBtn = ogretilmisAlanBul('kaydetBtn') ||
                        evrenselMetinleBul('button, a, input[type="submit"], input[type="button"], .btn-success, .btn-primary', ['Kaydet', 'Ön Kaydı Tamamla', 'Kaydet ve Kapat'], false);

        if (kaydetBtn) {
            vurgula(kaydetBtn, '#22c55e');
            kaydetBtn.click();
            logEkle('✓ Kaydet butonuna tıklandı.', 'basari');
            await bekle(genelBeklemeSuresi + 500);

            // Olası "Emin misiniz?" Onay Popuplarını Yakalama / Tıklama Desteği
            var onayBtn = evrenselMetinleBul('button, a, .swal2-confirm, .btn-confirm', ['Evet', 'Tamam', 'Onayla', 'Kabul Ediyorum'], true);
            if (onayBtn) {
                vurgula(onayBtn, '#22c55e');
                onayBtn.click();
                logEkle('✓ Açılan onay penceresinde "Evet/Tamam" onaylandı.', 'basari');
                await bekle(400);
            }
            return true;
        } else {
            logEkle('Hata: "Kaydet" butonu bulunamadı!', 'hata');
            throw new Error('Kaydet butonu bulunamadı.');
        }
    }

    /* Tam Otomatik Tekil Aday İşleme */
    async function adimiIsle(k) {
        if (!k) throw new Error('İşlenecek aday kaydı bulunamadı.');

        durum('[' + (k.tc || k.ad) + '] İşleniyor: ' + kategoriAdiTr(k.kategori) + '...', '#38bdf8');
        logEkle('=== ADAY İŞLEMİ BAŞLADI: ' + (k.ad || '') + ' ' + (k.soyad || '') + ' (' + (k.tc || '-') + ') ===', 'islem');
        sesCal('tik');

        await adim1_SekmeSec(k);
        await adim2_YeniKayitAc(k);
        await adim3_TcTarihDoldur(k);
        await adim4_SorgulaVeMernisBekle(k);
        await adim5_KapsamVeBilgileriDoldur(k);

        // Manuel Onay Modu Kontrolü
        if (manuelOnayModu) {
            k.durum = 'onay_bekliyor';
            durum('[' + k.tc + '] Bilgiler dolduruldu. İnceleyip Kaydet\'e basabilir veya panelden devam edebilirsiniz.', '#fbbf24');
            logEkle('Manuel Onay Modu Aktif: Form dolduruldu, kullanıcı onayı bekleniyor.', 'uyari');
            return;
        }

        await adim6_Kaydet(k);

        k.durum = 'tamamlandi';
        sesCal('basari');
        durum('✓ [' + k.tc + '] ' + (k.ad || '') + ' ' + (k.soyad || '') + ' kaydedildi.', '#4ade80');
        logEkle('✓✓✓ [KAYIT TAMAMLANDI] ' + (k.ad || '') + ' ' + (k.soyad || '') + ' (' + k.tc + ')', 'basari');
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
            logEkle('Hata: ' + e.message, 'hata');
        }
    }

    async function topluAktarimBaslat() {
        if (!filtreliKayitlar.length) {
            durum('Aktarılacak aday yok. Panodan veya JSON dosyasından aktarın.', '#f87171');
            return;
        }

        otomatikCalisiyor = true;
        cubukBtnGuncelle();
        durum('Toplu aktarım başlatıldı (' + filtreliKayitlar.length + ' aday)...', '#38bdf8');
        logEkle('--- TOPLU AKTARIM BAŞLATILDI (' + filtreliKayitlar.length + ' Aday) ---', 'islem');

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
                durum('HATA (' + filtreliKayitlar[i].tc + '): ' + err.message + '. Durduruldu.', '#f87171');
                logEkle('Toplu aktarım durduruldu: ' + err.message, 'hata');
                otomatikCalisiyor = false;
                break;
            }
        }

        otomatikCalisiyor = false;
        cubukBtnGuncelle();
        if (aktifIndeks >= filtreliKayitlar.length - 1 && filtreliKayitlar[aktifIndeks].durum === 'tamamlandi') {
            sesCal('basari');
            durum('🎉 Seçili kategorideki tüm adayların (' + filtreliKayitlar.length + ' kişi) E-MESEM kayıtları tamamlandı!', '#4ade80');
            logEkle('🎉 Tüm adayların kayıt işlemleri başarıyla tamamlandı!', 'basari');
        }
    }

    function topluAktarimDurdur() {
        otomatikCalisiyor = false;
        cubukBtnGuncelle();
        durum('Toplu aktarım duraklatıldı.', '#fbbf24');
        logEkle('Toplu aktarım duraklatıldı.', 'uyari');
    }

    function siradakiniGec() {
        if (aktifIndeks < filtreliKayitlar.length - 1) {
            aktifIndeks++;
            listeyiCiz();
            durum('Sıradaki adaya geçildi (' + (aktifIndeks + 1) + ' / ' + filtreliKayitlar.length + ').', '#60a5fa');
        }
    }

    /* ============================================================
       AKILLI ALAN ÖĞRETİCİ / EŞLEME MODU (SELECTOR MAPPER)
       ============================================================ */
    var vurguKatmani = null;
    var ogreticiRozet = null;

    function ogreticiArayuzHazirla() {
        if (!vurguKatmani) {
            vurguKatmani = document.createElement('div');
            vurguKatmani.id = 'mesemOgreticiVurgu';
            vurguKatmani.style.cssText = 'position:fixed; pointer-events:none; border:3px dashed #22c55e; background:rgba(34,197,94,0.15); z-index:2147483640; transition:all .08s ease; display:none; border-radius:4px;';
            document.body.appendChild(vurguKatmani);
        }
        if (!ogreticiRozet) {
            ogreticiRozet = document.createElement('div');
            ogreticiRozet.id = 'mesemOgreticiRozet';
            ogreticiRozet.style.cssText = 'position:fixed; pointer-events:none; background:#1e293b; color:#22c55e; border:1px solid #22c55e; padding:4px 8px; font-size:12px; font-weight:bold; border-radius:4px; z-index:2147483641; display:none; box-shadow:0 4px 10px rgba(0,0,0,0.5); font-family:sans-serif;';
            document.body.appendChild(ogreticiRozet);
        }
    }

    function ogretmeModunuBaslat(tekliAlanId) {
        ogreticiArayuzHazirla();
        ogretmeModuAktif = true;
        
        if (tekliAlanId) {
            ogretilenHedefAlan = tekliAlanId;
        } else {
            ogretmeListesiSirasi = 0;
            ogretilenHedefAlan = OGRETILEBILIR_ALANLAR[0].id;
        }

        var alanBilgi = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === ogretilenHedefAlan; });
        var alanAd = alanBilgi ? alanBilgi.ad : ogretilenHedefAlan;

        durum('🎯 Öğretme Modu: Sayfada "' + alanAd + '" öğesine tıklayın!', '#22c55e');
        logEkle('🎯 Alan Öğretici Açıldı: Lütfen sayfada [' + alanAd + '] öğesine tıklayın.', 'uyari');

        tumBelgeleriGetir().forEach(function (doc) {
            doc.addEventListener('mousemove', ogreticiFareHareketi, true);
            doc.addEventListener('click', ogreticiTiklama, true);
        });
    }

    function ogretmeModunuKapat() {
        ogretmeModuAktif = false;
        ogretilenHedefAlan = null;
        if (vurguKatmani) vurguKatmani.style.display = 'none';
        if (ogreticiRozet) ogreticiRozet.style.display = 'none';

        tumBelgeleriGetir().forEach(function (doc) {
            doc.removeEventListener('mousemove', ogreticiFareHareketi, true);
            doc.removeEventListener('click', ogreticiTiklama, true);
        });

        durum('Öğretme modu kapatıldı.', '#cbd5e1');
        logEkle('Öğretme modu kapatıldı.', 'islem');
    }

    function ogreticiFareHareketi(e) {
        if (!ogretmeModuAktif) return;
        var hedef = e.target;
        if (!hedef || hedef.closest('#mesemYardimciPanel') || hedef.id === 'mesemOgreticiVurgu' || hedef.id === 'mesemOgreticiRozet') {
            vurguKatmani.style.display = 'none';
            ogreticiRozet.style.display = 'none';
            return;
        }

        var rect = hedef.getBoundingClientRect();
        vurguKatmani.style.display = 'block';
        vurguKatmani.style.top = rect.top + 'px';
        vurguKatmani.style.left = rect.left + 'px';
        vurguKatmani.style.width = rect.width + 'px';
        vurguKatmani.style.height = rect.height + 'px';

        var alanBilgi = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === ogretilenHedefAlan; });
        var alanAd = alanBilgi ? alanBilgi.ad : ogretilenHedefAlan;

        ogreticiRozet.style.display = 'block';
        ogreticiRozet.style.top = Math.max(0, rect.top - 28) + 'px';
        ogreticiRozet.style.left = rect.left + 'px';
        ogreticiRozet.textContent = '🎯 Eşle: ' + alanAd + ' (' + hedef.tagName.toLowerCase() + (hedef.id ? '#' + hedef.id : '') + ')';
    }

    function ogreticiTiklama(e) {
        if (!ogretmeModuAktif) return;
        var hedef = e.target;
        if (!hedef || hedef.closest('#mesemYardimciPanel')) return;

        e.preventDefault();
        e.stopPropagation();

        var selector = benzersizSelectorUret(hedef);
        if (selector && ogretilenHedefAlan) {
            ozelEslemeler[ogretilenHedefAlan] = selector;
            try {
                localStorage.setItem(STORAGE_ESLEME_ANAHTARI, JSON.stringify(ozelEslemeler));
            } catch (err) { }

            var alanBilgi = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === ogretilenHedefAlan; });
            var alanAd = alanBilgi ? alanBilgi.ad : ogretilenHedefAlan;

            sesCal('basari');
            logEkle('✓ Eşlendi: [' + alanAd + '] -> ' + selector, 'basari');
            vurgula(hedef, '#22c55e');

            // Sıralı modda ise sonrakine geç
            ogretmeListesiSirasi++;
            if (ogretmeListesiSirasi < OGRETILEBILIR_ALANLAR.length) {
                ogretilenHedefAlan = OGRETILEBILIR_ALANLAR[ogretmeListesiSirasi].id;
                var sonrakiAd = OGRETILEBILIR_ALANLAR[ogretmeListesiSirasi].ad;
                durum('🎯 Sıradaki: "' + sonrakiAd + '" öğesine tıklayın!', '#22c55e');
                logEkle('Sıradaki öğretilecek alan: [' + sonrakiAd + ']', 'uyari');
            } else {
                ogretmeModunuKapat();
                durum('✓ Tüm alanların özel eşlemesi başarıyla tamamlandı!', '#4ade80');
                logEkle('🎉 Tüm alanlar başarıyla robota öğretildi!', 'basari');
            }
        }
    }

    function ogretilenEslemeleriTemizle() {
        if (confirm('Tüm özel alan eşlemeleri silinsin ve varsayılan akıllı seçicilere dönülsün mü?')) {
            ozelEslemeler = {};
            try { localStorage.removeItem(STORAGE_ESLEME_ANAHTARI); } catch (e) { }
            logEkle('Tüm özel alan eşlemeleri sıfırlandı.', 'uyari');
            durum('Özel alan eşlemeleri sıfırlandı.', '#cbd5e1');
        }
    }

    /* ============================================================
       SAYFA TEŞHİS (DIAGNOSTICS & DOM DUMPER) ARACI
       ============================================================ */
    function sayfayiTeshisEt() {
        var belgeler = tumBelgeleriGetir();
        var rapor = {
            tarih: new Date().toISOString(),
            url: location.href,
            toplamBelge: belgeler.length,
            formlar: [],
            elemanlar: []
        };

        belgeler.forEach(function (doc, docIdx) {
            var inputs = doc.querySelectorAll('input, select, textarea, button, a.btn');
            for (var i = 0; i < inputs.length; i++) {
                var el = inputs[i];
                var etiket = el.tagName.toLowerCase();
                var id = el.id || '';
                var name = el.name || '';
                var type = el.type || '';
                var cls = el.className || '';
                var val = (el.value || '').slice(0, 30);
                var txt = (el.textContent || '').trim().slice(0, 30);
                var selector = benzersizSelectorUret(el);

                rapor.elemanlar.push({
                    docIndex: docIdx,
                    tag: etiket,
                    type: type,
                    id: id,
                    name: name,
                    class: cls,
                    value: val,
                    text: txt,
                    selector: selector
                });
            }
        });

        console.log('[E-MESEM Sayfa Teşhis Raporu]', rapor);
        var jsonMetin = JSON.stringify(rapor, null, 2);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonMetin).then(function () {
                logEkle('✓ Sayfa Teşhis Raporu (' + rapor.elemanlar.length + ' eleman) oluşturuldu ve panoya kopyalandı!', 'basari');
                durum('✓ Teşhis raporu panoya kopyalandı (' + rapor.elemanlar.length + ' eleman).', '#4ade80');
            });
        } else {
            logEkle('Sayfa teşhis edildi (' + rapor.elemanlar.length + ' eleman). Detaylar F12 konsolunda.', 'islem');
            durum('Sayfa teşhis edildi (' + rapor.elemanlar.length + ' eleman).', '#38bdf8');
        }
    }

    /* ============================================================
       PANEL VE ARAYÜZ OLUŞTURMA
       ============================================================ */
    panel = el('div', [
        'position:fixed', 'top:14px', 'right:14px', 'width:460px', 'max-height:94vh',
        'background:#0f172a', 'color:#f8fafc', 'border:1px solid #334155', 'border-radius:12px',
        'box-shadow:0 25px 50px -12px rgba(0,0,0,0.85)', 'z-index:2147483647',
        'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'display:flex', 'flex-direction:column', 'overflow:hidden', 'font-size:12.5px'
    ].join(';'));
    panel.id = 'mesemYardimciPanel';

    // Header
    var baslik = el('div', 'display:flex; align-items:center; gap:8px; padding:10px 14px; background:#1e293b; cursor:move; user-select:none; border-bottom:1px solid #334155;');
    baslik.appendChild(el('strong', 'flex:1; font-size:13.5px; color:#f59e0b; display:flex; align-items:center; gap:6px;', '⚡ E-MESEM Robotu v' + SURUM));
    
    var btnOgretMod = el('button', 'padding:3px 7px; font-size:11px; font-weight:bold; cursor:pointer; background:#10b981; color:#fff; border:0; border-radius:4px; margin-right:4px;', '🎯 Alan Öğret');
    btnOgretMod.title = 'Sayfadaki form alanlarını robota öğret';
    btnOgretMod.onclick = function () {
        if (ogretmeModuAktif) ogretmeModunuKapat();
        else ogretmeModunuBaslat();
    };

    var kucultDugme = el('button', 'border:0; background:#334155; color:#f8fafc; width:26px; height:26px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px;', '–');
    var kapatDugme = el('button', 'border:0; background:#dc2626; color:#fff; width:26px; height:26px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px; margin-left:4px;', '×');
    
    baslik.appendChild(btnOgretMod);
    baslik.appendChild(kucultDugme);
    baslik.appendChild(kapatDugme);

    var govde = el('div', 'display:flex; flex-direction:column; min-height:0; overflow-y:auto;');

    // Dosya Seçici
    dosyaGirdi = el('input');
    dosyaGirdi.type = 'file';
    dosyaGirdi.accept = '.json';
    dosyaGirdi.style.display = 'none';
    dosyaGirdi.addEventListener('change', dosyaSecildi);

    // Kategori Sekmeleri Barı
    var kategoriBar = el('div', 'display:flex; gap:4px; padding:6px 10px; background:#0b1120; border-bottom:1px solid #334155;');
    
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
    var dugmeCubugu = el('div', 'display:flex; flex-wrap:wrap; gap:5px; padding:6px 10px; border-bottom:1px solid #334155; background:#1e293b;');
    
    var btnPano = el('button', 'padding:5px 8px; font-size:11px; font-weight:600; cursor:pointer; background:#2563eb; color:#fff; border:0; border-radius:5px;', '📋 Panodan Al');
    btnPano.onclick = panodanAl;

    var btnJson = el('button', 'padding:5px 8px; font-size:11px; font-weight:600; cursor:pointer; background:#0d9488; color:#fff; border:0; border-radius:5px;', '📂 JSON Yükle');
    btnJson.onclick = function () { if (dosyaGirdi) dosyaGirdi.click(); };

    var btnTekDoldur = el('button', 'padding:5px 8px; font-size:11px; font-weight:600; cursor:pointer; background:#16a34a; color:#fff; border:0; border-radius:5px;', '▶ Bu Adayı Kaydet');
    btnTekDoldur.onclick = seciliKaydiDoldur;

    btnToplu = el('button', 'padding:5px 8px; font-size:11px; font-weight:600; cursor:pointer; background:#8b5cf6; color:#fff; border:0; border-radius:5px;', '⏩ Sırayla Kaydet');
    btnToplu.onclick = function () {
        if (otomatikCalisiyor) topluAktarimDurdur(); else topluAktarimBaslat();
    };

    var btnGec = el('button', 'padding:5px 6px; font-size:11px; font-weight:600; cursor:pointer; background:#475569; color:#fff; border:0; border-radius:5px;', '⏭ Geç');
    btnGec.title = 'Sıradaki adaya geç';
    btnGec.onclick = siradakiniGec;

    var btnTeshis = el('button', 'padding:5px 6px; font-size:11px; font-weight:600; cursor:pointer; background:#334155; color:#38bdf8; border:0; border-radius:5px; margin-left:auto;', '🔍 Teşhis');
    btnTeshis.title = 'Sayfadaki form elemanlarını tara & konsola dök';
    btnTeshis.onclick = sayfayiTeshisEt;

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
    dugmeCubugu.appendChild(btnTeshis);

    // Durum ve Sayaç
    durumYazi = el('div', 'padding:6px 10px; font-size:11.5px; color:#cbd5e1; border-bottom:1px solid #334155; line-height:1.4; background:#090d16;',
        'Robot hazır. Başvuru verilerini aktarmak için "📋 Panodan Al"a tıklayın.');

    sayacKutusu = el('div', 'padding:3px 10px; font-size:10.5px; color:#94a3b8; background:#0b1120; border-bottom:1px solid #1e293b;',
        'Kalfalık: 0 | Ustalık: 0 | Pedagoji: 0 | Aktif: 0');

    // Yapıştırma Kutusu
    yapistirmaKutusu = el('div', 'display:none; padding:8px 10px; background:#1e293b; border-bottom:1px solid #334155;');
    var yapistirmaBaslik = el('div', 'font-size:11px; color:#fbbf24; margin-bottom:4px; font-weight:600;', '📝 Pano Verisini Buraya Yapıştırın (Ctrl+V):');
    yapistirmaAlani = el('textarea', 'width:100%; box-sizing:border-box; height:50px; background:#0f172a; color:#e2e8f0; border:1px solid #475569; border-radius:5px; font-size:11px; padding:4px; resize:vertical;');
    var yapistirmaButonlar = el('div', 'display:flex; justify-content:flex-end; gap:6px; margin-top:4px;');
    var btnYukleText = el('button', 'padding:3px 8px; background:#16a34a; color:#fff; border:0; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;', '✓ Yükle');
    var btnIptalText = el('button', 'padding:3px 6px; background:#475569; color:#fff; border:0; border-radius:4px; font-size:11px; cursor:pointer;', 'İptal');
    
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
    listeKutusu = el('div', 'overflow-y:auto; min-height:60px; max-height:26vh; padding:2px 0; background:#0b1120;');

    function listeyiCiz() {
        listeKutusu.textContent = '';
        if (!filtreliKayitlar.length) {
            listeKutusu.appendChild(el('div', 'padding:12px; color:#94a3b8; text-align:center; font-size:11.5px; line-height:1.4;',
                'Seçili kategoride aday bulunamadı. Başvuru yönetim sisteminden verileri panoya kopyalayıp buradaki "📋 Panodan Al"a tıklayın.'));
            return;
        }

        filtreliKayitlar.forEach(function (k, i) {
            var satir = el('div', 'display:flex; align-items:center; gap:6px; padding:5px 8px; border-bottom:1px solid #1e293b; cursor:pointer; background:' + (i === aktifIndeks ? '#1e3a8a' : 'transparent') + ';');
            
            var durumRozet = el('span', 'font-size:10px; padding:1px 5px; border-radius:3px; font-weight:bold; color:#fff;', (i + 1));
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
            var adSoyad = el('div', 'font-weight:600; color:#f8fafc; font-size:11.5px;', (k.ad || '') + ' ' + (k.soyad || '') + ' (' + (k.tc || '-') + ')');
            var detay = el('div', 'font-size:10px; color:#94a3b8;', (k.alan || '-') + ' / ' + (k.dal || '-') + ' • [' + (k.kapsam || '35. Madde') + ']');
            icerikKutu.appendChild(adSoyad);
            icerikKutu.appendChild(detay);

            satir.onclick = function () {
                aktifIndeks = i;
                listeyiCiz();
                durum('Seçili: ' + (k.ad || '') + ' ' + (k.soyad || '') + ' (' + k.tc + ') - ' + kategoriAdiTr(k.kategori), '#60a5fa');
            };
            satir.appendChild(durumRozet);
            satir.appendChild(icerikKutu);
            listeKutusu.appendChild(satir);
        });
    }

    /* ---------------- ADIM ADIM MANUEL DENETİM PANELİ ---------------- */
    adimAdimKutusu = el('div', 'padding:6px 8px; background:#1e293b; border-top:1px solid #334155; border-bottom:1px solid #334155;');
    var adimBaslik = el('div', 'display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;');
    adimBaslik.appendChild(el('span', 'font-size:11px; font-weight:700; color:#fbbf24;', '🐾 Adım Adım Manuel Denetim:'));
    
    var btnEslemeleriSifirla = el('button', 'border:0; background:transparent; color:#94a3b8; font-size:10px; cursor:pointer; text-decoration:underline;', 'Eşlemeleri Sıfırla');
    btnEslemeleriSifirla.onclick = ogretilenEslemeleriTemizle;
    adimBaslik.appendChild(btnEslemeleriSifirla);

    var adimGrid = el('div', 'display:grid; grid-template-columns:repeat(3, 1fr); gap:4px;');

    function adimButonuOlustur(metin, sira, handler) {
        var b = el('button', 'padding:4px 3px; font-size:10px; font-weight:600; background:#334155; color:#f8fafc; border:1px solid #475569; border-radius:4px; cursor:pointer; text-align:center;', sira + '. ' + metin);
        b.onclick = async function () {
            if (!filtreliKayitlar.length) {
                durum('İşlenecek aday seçili değil.', '#f87171');
                return;
            }
            var k = filtreliKayitlar[aktifIndeks];
            b.style.background = '#0284c7';
            try {
                await handler(k);
                b.style.background = '#16a34a';
                setTimeout(function () { b.style.background = '#334155'; }, 1000);
            } catch (err) {
                b.style.background = '#dc2626';
                durum('Hata: ' + err.message, '#f87171');
            }
        };
        return b;
    }

    adimGrid.appendChild(adimButonuOlustur('Sekmeyi Seç', 1, adim1_SekmeSec));
    adimGrid.appendChild(adimButonuOlustur('Yeni Kayıt', 2, adim2_YeniKayitAc));
    adimGrid.appendChild(adimButonuOlustur('TC ve Tarih', 3, adim3_TcTarihDoldur));
    adimGrid.appendChild(adimButonuOlustur('Sorgula (MERNİS)', 4, adim4_SorgulaVeMernisBekle));
    adimGrid.appendChild(adimButonuOlustur('Kapsam & Bilgi', 5, adim5_KapsamVeBilgileriDoldur));
    adimGrid.appendChild(adimButonuOlustur('Kaydet', 6, adim6_Kaydet));

    adimAdimKutusu.appendChild(adimBaslik);
    adimAdimKutusu.appendChild(adimGrid);

    /* ---------------- CANLI LOG KONSOLU ---------------- */
    logKonsolu = el('div', 'padding:6px 8px; background:#0b1120; border-top:1px solid #334155; display:flex; flex-direction:column;');
    var logBaslikSatir = el('div', 'display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;');
    logBaslikSatir.appendChild(el('span', 'font-size:10.5px; font-weight:700; color:#38bdf8;', '📟 Canlı İşlem Konsolu:'));
    
    var btnLogTemizle = el('button', 'border:0; background:transparent; color:#64748b; font-size:10px; cursor:pointer;', 'Temizle');
    btnLogTemizle.onclick = function () { if (logIcerik) logIcerik.textContent = ''; };
    logBaslikSatir.appendChild(btnLogTemizle);

    logIcerik = el('div', 'height:95px; overflow-y:auto; font-family:Consolas, Monaco, monospace; font-size:10.5px; line-height:1.35; padding:4px 6px; background:#040711; border:1px solid #1e293b; border-radius:4px; color:#cbd5e1;');

    logKonsolu.appendChild(logBaslikSatir);
    logKonsolu.appendChild(logIcerik);

    // Ayarlar Barı (Bekleme Süresi & Manuel Onay)
    var ayarSatiri = el('div', 'display:flex; align-items:center; justify-content:space-between; padding:5px 8px; font-size:10.5px; color:#94a3b8; border-top:1px solid #334155; background:#1e293b; flex-wrap:wrap; gap:4px;');
    
    var solAyar = el('div', 'display:flex; align-items:center; gap:4px;');
    solAyar.appendChild(el('span', null, 'MERNİS:'));
    var selGecikme = el('select', 'background:#0f172a; color:#fff; border:1px solid #475569; border-radius:4px; padding:1px 3px; font-size:10.5px;');
    [['1500', '1.5s'], ['2500', '2.5s'], ['3500', '3.5s'], ['5000', '5.0s']].forEach(function (opt) {
        var o = el('option', null, opt[1]);
        o.value = opt[0];
        if (opt[0] === '2500') o.selected = true;
        selGecikme.appendChild(o);
    });
    selGecikme.onchange = function () { mernisBeklemeSuresi = Number(selGecikme.value) || 2500; };
    solAyar.appendChild(selGecikme);

    var sagAyar = el('label', 'display:inline-flex; align-items:center; gap:4px; cursor:pointer; user-select:none; font-size:10.5px;');
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
    govde.appendChild(adimAdimKutusu);
    govde.appendChild(logKonsolu);
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
        ogretmeModunuKapat();
        panel.remove();
        if (dosyaGirdi) dosyaGirdi.remove();
        if (vurguKatmani) vurguKatmani.remove();
        if (ogreticiRozet) ogreticiRozet.remove();
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
    logEkle('E-MESEM Otomasyon Robotu v' + SURUM + ' hazır.', 'basari');

    window.__mesemYardimci = {
        gosterGizle: function () {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        },
        kayitlariYukle: kayitlariYukle,
        adimiIsle: adimiIsle,
        sayfayiTeshisEt: sayfayiTeshisEt,
        ogretmeModunuBaslat: ogretmeModunuBaslat
    };
})();
