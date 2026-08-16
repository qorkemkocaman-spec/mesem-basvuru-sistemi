/* ==================================================================
   E-MESEM Sınav Öğrenci Ön Kayıt & Otomasyon Robotu (v6.0)
   Geliştirici: Görkem Kocaman © 2026
   ------------------------------------------------------------------
   MEB E-MESEM (emesem.meb.gov.tr) portalında "Sınav Öğrenci Ön Kayıt"
   ekranında tam otomatik, ASP.NET AJAX UpdatePanel & PostBack uyumlu,
   evrensel çok katmanlı seçim motorlu (Select / Combobox / Div-Li / Select2 / DevExpress),
   kademeli Alan -> Dal yükleme destekli, MERNİS korumalı,
   canlı eleman analizörlü (Live DOM Inspector) ve hatasız kayıt motoru.

   Temel Yetenekler:
     1. ⚡ Evrensel Çok Katmanlı Seçim Motoru (Standart Select, Combobox Input, Custom Div/Span/Li Dropdown)
     2. 🔬 Canlı Eleman Analizörü & DOM Dumper (Tek Tıkla Kutu İnceleme & Pano Raporlayıcı)
     3. 🌲 Kademeli (Cascading) Alan -> Dal Otomatik Seçim ve Bekleme Motoru (Kanonik Türkçe Eşleme)
     4. 🛡️ Pre-Save Güvenlik Kilidi (Tüm Kritik Alanlar Doğrulanmadan Kaydetmez)
     5. 🎯 Akıllı Alan Öğretici & Eşleme Modu (Otomatik Ebeveyn/Çocuk Select/Input Yakalayıcı)
     6. 🐾 Adım Adım Manuel Denetim (Step-by-Step Test Modu)
     7. 📟 Canlı Log Konsolu & Web Audio Bildirim Sistemi
     8. 📅 Garantili Dönemli Öğrenim Yılı & Maskeli Telefon Girişi Simülatörü
================================================================== */
(function () {
    'use strict';

    if (window.__mesemYardimci) {
        window.__mesemYardimci.gosterGizle();
        return;
    }

    var SURUM = "6.0";
    var STORAGE_ESLEME_ANAHTARI = "mesem_ogretilmis_alanlar_v6";
    
    var tumKayitlar = [];          // Sisteme yüklenen tüm adaylar
    var filtreliKayitlar = [];     // Seçili kategoriye göre filtrelenmiş liste
    var aktifKategori = 'TUMU';    // 'KALFALIK', 'USTALIK', 'PEDAGOJI', 'TUMU'
    var aktifIndeks = 0;           // Filtreli listedeki aktif aday sırası
    var otomatikCalisiyor = false; // Toplu aktarım döngü durumu
    var manuelOnayModu = false;    // Kaydetmeden önce duraklayıp kullanıcı onayı bekleme
    var mernisBeklemeSuresi = 3500;// MERNİS sorgu bekleme süresi (ms)
    var genelBeklemeSuresi = 800;  // Adımlar arası bekleme süresi (ms)
    var ogretmeModuAktif = false;  // Selector mapper aktif mi
    var ogretmeDuraklatildi = false; // Kullanıcı gezinebilsin diye duraklatıldı mı
    var ogretilenHedefAlan = null; // Sıradaki öğretilen alan kimliği
    var ogretmeListesiSirasi = 0;
    var ogretmeSiraliMi = false;   // Sırayla mı gidiliyor yoksa tekli mi
    var incelemeModuAktif = false; // Canlı Eleman İnceleme modu aktif mi

    // Özel Alan Eşlemeleri (localStorage)
    var ozelEslemeler = {};
    try {
        var kayitliEslemeler = localStorage.getItem(STORAGE_ESLEME_ANAHTARI) || localStorage.getItem("mesem_ogretilmis_alanlar_v5") || localStorage.getItem("mesem_ogretilmis_alanlar_v4");
        if (kayitliEslemeler) ozelEslemeler = JSON.parse(kayitliEslemeler);
    } catch (e) { ozelEslemeler = {}; }

    // Öğretilebilir Alanlar Tanım Listesi (Gruplu)
    var OGRETILEBILIR_ALANLAR = [
        // A. Ana Ekran Alanları
        { id: 'kalfalikSekme', ad: 'Kalfalık Sınavı Sekmesi', tip: 'buton', grup: 'ANA_EKRAN', aciklama: 'Ana sayfadaki Kalfalık sekme butonu' },
        { id: 'ustalikSekme', ad: 'Ustalık Sınavı Sekmesi', tip: 'buton', grup: 'ANA_EKRAN', aciklama: 'Ana sayfadaki Ustalık sekme butonu' },
        { id: 'pedagojiSekme', ad: 'İş Pedagojisi Sekmesi', tip: 'buton', grup: 'ANA_EKRAN', aciklama: 'Ana sayfadaki İş Pedagojisi sekme butonu' },
        { id: 'yeniKayitBtn', ad: '"Yeni Kayıt" Butonu', tip: 'buton', grup: 'ANA_EKRAN', aciklama: 'Açılır kayıt penceresini açan buton' },
        
        // B. Açılır Kayıt Penceresi (Popup / Modal) Alanları
        { id: 'ogrenimYili', ad: 'Öğrenim Yılı (Select/Combobox)', tip: 'select', grup: 'POPUP', aciklama: 'Örn: 2026 - 2027 I. Dönem açılır menüsü veya kutusu' },
        { id: 'tc', ad: 'T.C. Kimlik No', tip: 'input', grup: 'POPUP', aciklama: 'Aday TC Kimlik No giriş kutusu' },
        { id: 'dogumTarihi', ad: 'Doğum Tarihi', tip: 'input', grup: 'POPUP', aciklama: 'Aday doğum tarihi kutusu (GG.AA.YYYY)' },
        { id: 'sorgulaBtn', ad: '"Sorgula" Butonu', tip: 'buton', grup: 'POPUP', aciklama: 'MERNİS kimlik sorgulama butonu' },
        { id: 'kapsam', ad: 'Kapsam Maddesi (Select/Combobox)', tip: 'select', grup: 'POPUP', aciklama: '35. Madde / 31. Madde kapsam seçimi' },
        { id: 'eposta', ad: 'E-posta', tip: 'input', grup: 'POPUP', aciklama: 'Aday e-posta iletişim kutusu' },
        { id: 'telefon', ad: 'Telefon', tip: 'input', grup: 'POPUP', aciklama: 'Aday cep telefonu iletişim kutusu (+90 maskeli)' },
        { id: 'enSonMezuniyet', ad: 'En Son Mezuniyeti (Select/Combobox)', tip: 'select', grup: 'POPUP', aciklama: 'Öğrenim / Mezuniyet durumu seçimi' },
        { id: 'getirdigiBelge', ad: 'Getirdiği Belge (Select/Combobox)', tip: 'select', grup: 'POPUP', aciklama: 'Diploma / Tastikname belge seçimi' },
        { id: 'belgeTarihi', ad: 'Belge Tarihi', tip: 'input', grup: 'POPUP', aciklama: 'Belge veriliş tarihi kutusu (GG.AA.YYYY)' },
        { id: 'alan', ad: 'Alan Seçimi (Select/Input/Combobox)', tip: 'select', grup: 'POPUP', aciklama: 'Mesleki alan açılır menüsü veya arama kutusu' },
        { id: 'dal', ad: 'Dal Seçimi (Select/Input/Combobox)', tip: 'select', grup: 'POPUP', aciklama: 'Mesleki dal açılır menüsü veya arama kutusu' },
        { id: 'kaydetBtn', ad: '"Kaydet" Butonu', tip: 'buton', grup: 'POPUP', aciklama: 'Aday kaydını tamamlayan ana buton' }
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
            } else if (tur === 'kesif') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, simdi);
                osc.frequency.setValueAtTime(659.25, simdi + 0.08);
                gain.gain.setValueAtTime(0.12, simdi);
                gain.gain.exponentialRampToValueAtTime(0.01, simdi + 0.25);
                osc.start(simdi);
                osc.stop(simdi + 0.25);
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
        else if (tur === 'mor') renk = '#c084fc';

        if (logIcerik) {
            var satir = document.createElement('div');
            satir.style.cssText = 'padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.05); color:' + renk + ';';
            satir.textContent = '[' + zaman + '] ' + mesaj;
            logIcerik.appendChild(satir);
            logIcerik.scrollTop = logIcerik.scrollHeight;
        }

        // Konsola da yaz
        if (tur === 'hata') console.error('[E-MESEM Robot v' + SURUM + ']', mesaj);
        else console.log('[E-MESEM Robot v' + SURUM + ']', mesaj);
    }

    function durum(metin, renk) {
        if (!durumYazi) return;
        durumYazi.textContent = metin;
        durumYazi.style.color = renk || '#cbd5e1';
    }

    function bekle(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    /* ---------------- Türkçe Karakter & Kanonik Normalizasyon ---------------- */
    function kanonikMetin(s) {
        if (!s) return '';
        return String(s)
            .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
            .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
            .replace(/Ü/g, 'u').replace(/ü/g, 'u')
            .replace(/Ş/g, 's').replace(/ş/g, 's')
            .replace(/Ö/g, 'o').replace(/ö/g, 'o')
            .replace(/Ç/g, 'c').replace(/ç/g, 'c')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

    function trTemizle(s) {
        return kanonikMetin(s);
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

    /* ============================================================
       ASP.NET AJAX UPDATEPANEL / ASYNC POSTBACK İZLEME MOTORU
       ============================================================ */
    function isAsyncPostBackInProgress() {
        var belgeler = tumBelgeleriGetir();
        for (var i = 0; i < belgeler.length; i++) {
            try {
                var doc = belgeler[i];
                var win = doc.defaultView || doc.parentWindow;
                if (win && win.Sys && win.Sys.WebForms && win.Sys.WebForms.PageRequestManager) {
                    var prm = win.Sys.WebForms.PageRequestManager.getInstance();
                    if (prm && typeof prm.get_isInAsyncPostBack === 'function' && prm.get_isInAsyncPostBack()) {
                        return true;
                    }
                }
            } catch (e) { }
        }
        return false;
    }

    async function postBackBitisiniBekle(maxMs, aciklama) {
        var sure = maxMs || 6000;
        var baslangic = Date.now();
        var postBackGoruldu = false;

        // İstek gönderildikten sonra postback tetiklenmesi için kısa pay
        await bekle(200);

        if (isAsyncPostBackInProgress()) {
            postBackGoruldu = true;
            logEkle((aciklama || 'ASP.NET AJAX PostBack') + ' devam ediyor, bekleniyor...', 'islem');
        }

        while (Date.now() - baslangic < sure) {
            if (isAsyncPostBackInProgress()) {
                postBackGoruldu = true;
                await bekle(150);
            } else {
                // Postback bitti veya hiç olmadı
                break;
            }
        }

        // PostBack DOM güncellemesi sonrası elemanların oturması için nefes alma süresi
        await bekle(400);
        if (postBackGoruldu) {
            logEkle('✓ ' + (aciklama || 'ASP.NET AJAX PostBack') + ' tamamlandı, DOM güncellendi.', 'basari');
        }
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
            var inputs = Array.prototype.slice.call(doc.querySelectorAll('input, select, textarea, div[role="combobox"], span.select2, div.dx-dropdowneditor'));

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
       EVRENSEL ÇOK KATMANLI SEÇİM MOTORU (UNIVERSAL SELECTION ENGINE)
       ============================================================ */

    /**
     * MEB E-MESEM sayfasındaki Standart Select, Input/Combobox, Custom Div/Span/Li,
     * DevExpress, Select2 ve jQuery UI gibi her türlü açılır kutudan garantili seçim yapar.
     */
    async function evrenselSecimYap(hedefEl, arananMetin, tetiklePostBack) {
        if (!hedefEl) return false;
        var aranan = String(arananMetin != null ? arananMetin : '').trim();
        if (!aranan) return false;

        var kAranan = kanonikMetin(aranan);
        var doc = hedefEl.ownerDocument || document;
        var win = doc.defaultView || window;

        // ----------------------------------------------------
        // DURUM A: Standart <select> veya Sarmalayan/Sarmalanan <select>
        // ----------------------------------------------------
        var selectEl = null;
        if (hedefEl.tagName && hedefEl.tagName.toLowerCase() === 'select') {
            selectEl = hedefEl;
        } else if (hedefEl.querySelector) {
            selectEl = hedefEl.querySelector('select');
        }
        if (!selectEl && hedefEl.closest) {
            selectEl = hedefEl.closest('select');
        }
        if (!selectEl && hedefEl.id) {
            // Select2 veya container ilişkili select arama (örn: #select2-ddlAlan-container -> #ddlAlan)
            var olasiId = hedefEl.id.replace(/^select2-/, '').replace(/-container$/, '');
            try { selectEl = doc.querySelector('#' + CSS.escape(olasiId)); } catch (e) { }
        }

        if (selectEl && selectEl.options && selectEl.options.length > 0) {
            var options = selectEl.options;
            var secilenIndex = -1;

            // 1. Tam Kanonik Eşleşme
            for (var i = 0; i < options.length; i++) {
                var opt = options[i];
                var kOpt = kanonikMetin(opt.textContent);
                var kVal = kanonikMetin(opt.value);
                if (kOpt === kAranan || kVal === kAranan) {
                    secilenIndex = i;
                    break;
                }
            }

            // 2. Yıl ve Dönem Özel Eşleşmesi (Öğrenim Yılı için: 2026, 2027, I. Dönem / 1. Dönem)
            if (secilenIndex === -1) {
                var yillar = aranan.match(/\d{4}/g) || [];
                var donem1 = kAranan.indexOf('1') !== -1 || kAranan.indexOf('i') !== -1 || kAranan.indexOf('bir') !== -1;
                var donem2 = kAranan.indexOf('2') !== -1 || kAranan.indexOf('ii') !== -1 || kAranan.indexOf('iki') !== -1;

                if (yillar.length > 0) {
                    for (var j = 0; j < options.length; j++) {
                        var o = options[j];
                        var optText = kanonikMetin(o.textContent);
                        var optVal = kanonikMetin(o.value);

                        var yilUyumu = yillar.some(function (y) {
                            return optText.indexOf(y) !== -1 || optVal.indexOf(y) !== -1;
                        });

                        if (yilUyumu) {
                            if (donem1 && (optText.indexOf('1') !== -1 || optText.indexOf('idonem') !== -1 || optText.indexOf('1donem') !== -1)) {
                                secilenIndex = j;
                                break;
                            } else if (donem2 && (optText.indexOf('2') !== -1 || optText.indexOf('iidonem') !== -1 || optText.indexOf('2donem') !== -1)) {
                                secilenIndex = j;
                                break;
                            } else {
                                secilenIndex = j;
                                break;
                            }
                        }
                    }
                }
            }

            // 3. Kısmi İçerme / Substring Eşleşmesi
            if (secilenIndex === -1 && kAranan.length > 2) {
                for (var m = 0; m < options.length; m++) {
                    var o2 = options[m];
                    var optText2 = kanonikMetin(o2.textContent);
                    var optVal2 = kanonikMetin(o2.value);

                    if ((optText2 && (optText2.indexOf(kAranan) !== -1 || kAranan.indexOf(optText2) !== -1)) ||
                        (optVal2 && (optVal2.indexOf(kAranan) !== -1 || kAranan.indexOf(optVal2) !== -1))) {
                        secilenIndex = m;
                        break;
                    }
                }
            }

            // 4. Fallback: Seçiniz olmayan ilk geçerli seçenek
            if (secilenIndex === -1 && options.length > 0) {
                for (var k = 0; k < options.length; k++) {
                    var op = options[k];
                    var txt = kanonikMetin(op.textContent);
                    var val = (op.value || '').trim();
                    if (val !== '' && txt.indexOf('seciniz') === -1 && txt.indexOf('sec') === -1 && txt.indexOf('lutfen') === -1) {
                        secilenIndex = k;
                        logEkle('Kutuda "' + aranan + '" tam bulunamadı, ilk seçenek seçildi: ' + op.textContent, 'uyari');
                        break;
                    }
                }
                if (secilenIndex === -1 && options.length > 1) {
                    secilenIndex = 1;
                }
            }

            if (secilenIndex !== -1) {
                var seciliOpt = options[secilenIndex];
                selectEl.selectedIndex = secilenIndex;
                selectEl.value = seciliOpt.value;
                seciliOpt.selected = true;

                // Full Event Chain Simulation
                try {
                    selectEl.dispatchEvent(new Event('focus', { bubbles: true }));
                    selectEl.dispatchEvent(new Event('input', { bubbles: true }));
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    if (typeof selectEl.onchange === 'function') {
                        selectEl.onchange();
                    }
                    // ASP.NET PostBack Tetikleyici
                    if (win.__doPostBack && selectEl.name) {
                        win.__doPostBack(selectEl.name, '');
                    }
                    // jQuery / Select2 tetikleyicisi
                    if (win.jQuery) {
                        try { win.jQuery(selectEl).val(seciliOpt.value).trigger('change'); } catch (jqErr) { }
                    }
                    selectEl.dispatchEvent(new Event('blur', { bubbles: true }));
                } catch (e) { }

                logEkle('✓ Select (' + (selectEl.name || selectEl.id || 'select') + ') seçildi: ' + seciliOpt.textContent.trim(), 'basari');
                return true;
            }
        }

        // ----------------------------------------------------
        // DURUM B: Input Combobox / Autocomplete Kutusu
        // ----------------------------------------------------
        var inputEl = null;
        if (hedefEl.tagName && (hedefEl.tagName.toLowerCase() === 'input' || hedefEl.tagName.toLowerCase() === 'textarea')) {
            inputEl = hedefEl;
        } else if (hedefEl.querySelector) {
            inputEl = hedefEl.querySelector('input:not([type="hidden"]), textarea');
        }

        if (inputEl) {
            degerYaz(inputEl, aranan);
            // Açılır menü oku veya tetikleyicisi varsa tıkla
            var triggerBtn = null;
            if (hedefEl.parentElement) {
                triggerBtn = hedefEl.parentElement.querySelector('.dx-dropdowneditor-button, .select2-selection__arrow, button, .btn, span[role="button"]');
            }
            if (triggerBtn && triggerBtn !== inputEl) {
                try { triggerBtn.click(); await bekle(150); } catch (e) { }
            }
            logEkle('✓ Input/Combobox (' + (inputEl.name || inputEl.id || 'input') + ') dolduruldu: ' + aranan, 'basari');
            return true;
        }

        // ----------------------------------------------------
        // DURUM C: Custom Dropdown (Div/Span/Ul/Li / DevExpress / Select2)
        // ----------------------------------------------------
        try {
            hedefEl.focus && hedefEl.focus();
            hedefEl.click();
            await bekle(220);

            // Açılan menü listesindeki öğeleri tara
            var belgeler = tumBelgeleriGetir();
            var listeSecicileri = [
                '.select2-results__option',
                '.dx-list-item',
                '.dx-item',
                'ul.dropdown-menu > li',
                'ul > li',
                'div[role="option"]',
                'li[role="option"]',
                '.dropdown-item',
                '.combobox-item',
                '.k-item',
                '.mat-option',
                '.ant-select-item-option-content'
            ];

            var bulunanSecenek = null;
            for (var b = 0; b < belgeler.length; b++) {
                var d = belgeler[b];
                for (var s = 0; s < listeSecicileri.length; s++) {
                    var items = d.querySelectorAll(listeSecicileri[s]);
                    for (var it = 0; it < items.length; it++) {
                        var itemEl = items[it];
                        if (itemEl.offsetParent === null && itemEl.offsetWidth === 0) continue; // gizli olanları atla
                        var itText = kanonikMetin(itemEl.textContent);
                        if (itText === kAranan || (kAranan.length > 3 && itText.indexOf(kAranan) !== -1)) {
                            bulunanSecenek = itemEl;
                            break;
                        }
                    }
                    if (bulunanSecenek) break;
                }
                if (bulunanSecenek) break;
            }

            if (bulunanSecenek) {
                vurgula(bulunanSecenek, '#22c55e');
                bulunanSecenek.click();
                logEkle('✓ Özel Dropdown seçeneği tıklandı: ' + bulunanSecenek.textContent.trim(), 'basari');
                await bekle(200);
                return true;
            } else {
                logEkle('Özel Dropdown tıklandı, metin içeren seçenek doğrudan arandı.', 'islem');
                return true;
            }
        } catch (e) {
            logEkle('Dropdown seçiminde hata: ' + e.message, 'hata');
        }

        return false;
    }

    /* ---------------- Öğrenim Yılı Seçici (Evrensel Motor Destekli) ---------------- */
    async function ogrenimYiliSec(hedefEl, arananDeger) {
        if (!hedefEl) return false;
        var hedef = arananDeger || '2026 - 2027 I. Dönem';
        return await evrenselSecimYap(hedefEl, hedef, true);
    }

    /* ---------------- Select Değer Seçici (Evrensel Motor Destekli) ---------------- */
    async function selectDegerSec(hedefEl, arananDeger, tetiklePostBack) {
        if (!hedefEl) return false;
        return await evrenselSecimYap(hedefEl, arananDeger, tetiklePostBack);
    }

    /* ---------------- Maskeli Telefon Girişi Simülasyonu ---------------- */
    function telefonuYaz(inputEl, hamTel) {
        if (!inputEl) return false;
        if (!hamTel) return false;

        // 10 haneli temiz rakam dizisine dönüştür (Örn: 5071680498)
        var rakamlar = String(hamTel).replace(/\D/g, '');
        if (rakamlar.length === 12 && rakamlar.startsWith('90')) {
            rakamlar = rakamlar.substring(2);
        } else if (rakamlar.length === 11 && rakamlar.startsWith('0')) {
            rakamlar = rakamlar.substring(1);
        } else if (rakamlar.length > 10) {
            rakamlar = rakamlar.slice(-10);
        }

        try {
            inputEl.focus();
            inputEl.value = '';
            inputEl.dispatchEvent(new Event('focus', { bubbles: true }));
        } catch (e) { }

        // Karakter karakter sanal tuşlama simülasyonu (+90 (___) ___ __ __ maskesi için)
        for (var i = 0; i < rakamlar.length; i++) {
            var ch = rakamlar[i];
            var code = ch.charCodeAt(0);
            try {
                inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: 'Digit' + ch, keyCode: code, which: code, bubbles: true }));
                inputEl.dispatchEvent(new KeyboardEvent('keypress', { key: ch, code: 'Digit' + ch, keyCode: code, which: code, bubbles: true }));

                // Eğer maske otomatik karakter yerleştirmiyorsa standart değeri güncelle
                var eskiVal = inputEl.value;
                if (!eskiVal || eskiVal.indexOf(ch) === -1) {
                    inputEl.value = (eskiVal || '') + ch;
                }

                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: ch, code: 'Digit' + ch, keyCode: code, which: code, bubbles: true }));
            } catch (e) { }
        }

        // Standart property descriptor ataması & blur
        try {
            var descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
            if (descriptor && descriptor.set && (!inputEl.value || inputEl.value.replace(/\D/g, '').length < 10)) {
                descriptor.set.call(inputEl, rakamlar);
            }
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            inputEl.dispatchEvent(new Event('blur', { bubbles: true }));
            inputEl.blur();
        } catch (e) { }

        return true;
    }

    function degerYaz(hedef, deger) {
        if (!hedef) return false;
        if (hedef.type === 'file') return false;

        var etiket = (hedef.tagName || '').toLowerCase();

        // 1. SELECT ELEMENTİ
        if (etiket === 'select') {
            return selectDegerSec(hedef, deger, true);
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
       MEB E-MESEM ADIM ADIM İŞLEM FONKSİYONLARI (MODÜLER & GÜVENLİ)
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
            await postBackBitisiniBekle(3000, 'Sekme PostBack');
            return true;
        }

        // Katı Arama Listesi
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
            await postBackBitisiniBekle(3000, 'Sekme PostBack');
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
            logEkle('✓ "Yeni Kayıt" butonuna tıklandı, modal açılışı bekleniyor.', 'basari');
            await postBackBitisiniBekle(4000, 'Yeni Kayıt Modal Yükleme');
            await bekle(300);
            return true;
        } else {
            logEkle('Uyarı: "Yeni Kayıt" butonu bulunamadı, formun zaten açık olduğu varsayılıyor.', 'uyari');
            return false;
        }
    }

    // ADIM 3: Öğrenim Yılı, TC ve Doğum Tarihi Doldur
    async function adim3_TcTarihDoldur(k) {
        logEkle('3. Adım: Öğrenim Yılı, TC ve Doğum Tarihi giriliyor...', 'islem');

        // 3.1: Öğrenim Yılı (Evrensel Motor ile 2026 - 2027 I. Dönem garantili seçim)
        var ogrenimYiliEl = ogretilmisAlanBul('ogrenimYili') || evrenselInputBul(['ogrenimyili', 'donem', 'ogretimyili', 'egitimyili', 'ddlogrenimyili']);
        if (ogrenimYiliEl) {
            var hedefYil = k.ogrenimYili || '2026 - 2027 I. Dönem';
            await ogrenimYiliSec(ogrenimYiliEl, hedefYil);
            vurgula(ogrenimYiliEl, '#38bdf8');
            logEkle('Öğrenim yılı seçildi: ' + hedefYil, 'islem');
        }

        // 3.2: TC Kimlik No
        var tcEl = ogretilmisAlanBul('tc') || evrenselInputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc', 'txttckimlikno']);
        if (tcEl && k.tc) {
            degerYaz(tcEl, k.tc);
            vurgula(tcEl, '#38bdf8');
            logEkle('TC Kimlik No yazıldı: ' + k.tc, 'islem');
        } else {
            logEkle('Hata: TC Kimlik No kutusu bulunamadı!', 'hata');
        }

        // 3.3: Doğum Tarihi
        var dogumEl = ogretilmisAlanBul('dogumTarihi') || evrenselInputBul(['dogumtarihi', 'dogum', 'txtdogum', 'txtdogumtarihi']);
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

        await bekle(300);
        return true;
    }

    // ADIM 4: Sorgula'ya Bas ve MERNİS ASP.NET PostBack Bitişini Bekle
    async function adim4_SorgulaVeMernisBekle(k) {
        logEkle('4. Adım: MERNİS Sorgula butonuna basılıyor...', 'islem');

        // Ön Kontrol: TC ve Doğum alanlarının değerlerini doğrula
        var tcEl = ogretilmisAlanBul('tc') || evrenselInputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc']);
        if (tcEl && (!tcEl.value || tcEl.value.trim().length < 11) && k.tc) {
            degerYaz(tcEl, k.tc);
            await bekle(150);
        }

        var sorgulaBtn = ogretilmisAlanBul('sorgulaBtn') ||
                         evrenselMetinleBul('button, a, input[type="button"], .btn', ['Sorgula', 'MERNİS Sorgula', 'Mernis', 'Getir'], false);

        if (sorgulaBtn) {
            vurgula(sorgulaBtn, '#eab308');
            sorgulaBtn.click();
            logEkle('Sorgula tıklandı, ASP.NET AJAX PostBack & MERNİS yanıtı bekleniyor...', 'uyari');
            
            // 1. Sys.WebForms PageRequestManager PostBack Takibi
            await postBackBitisiniBekle(mernisBeklemeSuresi + 2000, 'MERNİS AJAX PostBack');

            // 2. Dinamik MERNİS Polling (Ad / Soyad inputunun dolmasını izle)
            var baslangic = Date.now();
            var mernisGeldi = false;
            while (Date.now() - baslangic < mernisBeklemeSuresi) {
                var adInput = evrenselInputBul(['txtad', 'txtadi', 'ad', 'adi', 'ogrenciadi', 'txtogrenciadi']);
                if (adInput && adInput.value && adInput.value.trim().length > 1) {
                    mernisGeldi = true;
                    logEkle('✓ MERNİS kimlik verisi başarıyla alındı: ' + adInput.value.trim(), 'basari');
                    break;
                }
                await bekle(300);
            }

            if (!mernisGeldi) {
                logEkle('MERNİS bekleme süresi tamamlandı. PostBack sonrası form alanları doldurulmaya başlanıyor.', 'uyari');
            }

            // Postback sonrası DOM yenilendiğinde 400ms dinlenme süresi
            await bekle(400);
            return true;
        } else {
            logEkle('Uyarı: "Sorgula" butonu bulunamadı, MERNİS adımı atlanıyor.', 'uyari');
            return false;
        }
    }

    // ADIM 5: Kapsam, Kademeli Alan -> Dal, İletişim ve Belge Bilgilerini Doldur
    async function adim5_KapsamVeBilgileriDoldur(k) {
        logEkle('5. Adım: MERNİS sonrası güncellenen DOM üzerinden bilgiler dolduruluyor...', 'islem');
        var kat = k.kategori;

        // 5.1: Öğrenim Yılı (MERNİS sonrası sıfırlandıysa tekrar doğrula ve garantili seç)
        var ogrenimYiliEl = ogretilmisAlanBul('ogrenimYili') || evrenselInputBul(['ogrenimyili', 'donem', 'ogretimyili', 'egitimyili', 'ddlogrenimyili']);
        if (ogrenimYiliEl) {
            var hedefYil = k.ogrenimYili || '2026 - 2027 I. Dönem';
            await ogrenimYiliSec(ogrenimYiliEl, hedefYil);
            vurgula(ogrenimYiliEl, '#38bdf8');
            logEkle('✓ Öğrenim Yılı doğrulandı: ' + hedefYil, 'islem');
            await bekle(250);
        }

        // 5.2: Kapsam Maddesi Seçimi (MERNİS sonrası yeni DOM üzerinden)
        var kapsamDeger = k.kapsam;
        if (!kapsamDeger) {
            if (kat === 'PEDAGOJI') kapsamDeger = '31. Madde';
            else if (kat === 'USTALIK') kapsamDeger = '35. Madde';
            else kapsamDeger = '35. Madde';
        }
        var kapsamEl = ogretilmisAlanBul('kapsam') || evrenselInputBul(['kapsam', 'madde', 'kapsamturu', 'ddlkapsam']);
        if (kapsamEl) {
            await evrenselSecimYap(kapsamEl, kapsamDeger, true);
            vurgula(kapsamEl, '#38bdf8');
            logEkle('✓ Kapsam seçildi: ' + kapsamDeger, 'islem');
            await bekle(300);
        } else {
            logEkle('Uyarı: Kapsam açılır menüsü bulunamadı!', 'uyari');
        }

        // 5.3: E-posta ve Maskeli Telefon Bilgileri (MEB kayıt penceresinde Adres alanı yoktur)
        var epostaEl = ogretilmisAlanBul('eposta') || evrenselInputBul(['eposta', 'email', 'mail', 'txteposta', 'txtemail']);
        if (epostaEl && k.eposta) {
            degerYaz(epostaEl, k.eposta);
            logEkle('E-posta yazıldı: ' + k.eposta, 'islem');
        }

        var telEl = ogretilmisAlanBul('telefon') || evrenselInputBul(['telefon', 'tel', 'cep', 'gsm', 'txttelefon', 'txtcep']);
        if (telEl && k.telefon) {
            telefonuYaz(telEl, k.telefon);
            vurgula(telEl, '#38bdf8');
            logEkle('Telefon maskeli alana yazıldı: ' + k.telefon, 'islem');
        }

        // 5.4: En Son Mezuniyeti
        var mezuniyetEl = ogretilmisAlanBul('enSonMezuniyet') || evrenselInputBul(['ensonmezuniyet', 'mezuniyet', 'ogrenimdurumu', 'mezuniyetdurumu', 'ddlmezuniyet']);
        if (mezuniyetEl) {
            await evrenselSecimYap(mezuniyetEl, k.enSonMezuniyet || 'Lise', true);
            vurgula(mezuniyetEl, '#38bdf8');
            logEkle('✓ En Son Mezuniyet seçildi: ' + (k.enSonMezuniyet || 'Lise'), 'islem');
            await bekle(250);
        }

        // 5.5: Getirdiği Belge
        var belgeEl = ogretilmisAlanBul('getirdigiBelge') || evrenselInputBul(['getirdigibelge', 'belgeturu', 'ogrenimbelgesi', 'ddlbelge']);
        if (belgeEl) {
            var bTur = k.getirdigiBelge || 'Diploma';
            if (trTemizle(bTur).indexOf('tas') !== -1) bTur = 'Tastikname';
            await evrenselSecimYap(belgeEl, bTur, true);
            vurgula(belgeEl, '#38bdf8');
            logEkle('✓ Getirdiği Belge seçildi: ' + bTur, 'islem');
            await bekle(250);
        }

        // 5.6: Belge Tarihi
        var belgeTarihEl = ogretilmisAlanBul('belgeTarihi') || evrenselInputBul(['belgetarihi', 'diplomatarihi', 'txtbelgetarihi']);
        if (belgeTarihEl && k.belgeTarihi) {
            var bTStr = k.belgeTarihi;
            if (/^\d{4}-\d{2}-\d{2}$/.test(bTStr)) {
                var btp = bTStr.split('-');
                bTStr = btp[2] + '.' + btp[1] + '.' + btp[0];
            }
            degerYaz(belgeTarihEl, bTStr);
            vurgula(belgeTarihEl, '#38bdf8');
            logEkle('✓ Belge Tarihi yazıldı: ' + bTStr, 'islem');
        }

        // 5.7: KADEMELİ ALAN SEÇİMİ (Cascading Alan -> Dal, Evrensel Çok Katmanlı Seçim Motoru)
        var alanEl = ogretilmisAlanBul('alan') || evrenselInputBul(['ddlalan', 'alan', 'alanadi', 'meslek', 'txtalan']);
        if (alanEl && k.alan) {
            logEkle('Alan seçiliyor (Evrensel Çok Katmanlı): ' + k.alan, 'islem');
            await evrenselSecimYap(alanEl, k.alan, true);
            vurgula(alanEl, '#38bdf8');

            // Dal dropdown'ının AJAX ile dolmasını bekle
            logEkle('Alan seçimi sonrası Dal listesinin yüklenmesi bekleniyor...', 'islem');
            await postBackBitisiniBekle(3500, 'Dal Listesi Yükleme PostBack');
            
            // Dal select'inin options dolmasını polling ile bekle
            var baslangicDal = Date.now();
            while (Date.now() - baslangicDal < 2500) {
                var dalTestEl = ogretilmisAlanBul('dal') || evrenselInputBul(['ddldal', 'dal', 'daladi', 'txtdal']);
                if (dalTestEl && dalTestEl.options && dalTestEl.options.length > 1) {
                    break;
                }
                await bekle(200);
            }
        }

        // 5.8: KADEMELİ DAL SEÇİMİ (Cascading Dal, Evrensel Çok Katmanlı Seçim Motoru)
        var dalEl = ogretilmisAlanBul('dal') || evrenselInputBul(['ddldal', 'dal', 'daladi', 'txtdal']);
        if (dalEl && k.dal) {
            logEkle('Dal seçiliyor (Evrensel Çok Katmanlı): ' + k.dal, 'islem');
            await evrenselSecimYap(dalEl, k.dal, true);
            vurgula(dalEl, '#38bdf8');
            await bekle(300);
        }

        logEkle('✓ Tüm form ve mesleki alan/dal bilgileri başarıyla dolduruldu.', 'basari');
        return true;
    }

    /* ============================================================
       PRE-SAVE VERIFICATION & GÜVENLİK KİLİDİ
       ============================================================ */
    function formuDogrula(k) {
        var eksikler = [];

        // 1. TC Kimlik No
        var tcEl = ogretilmisAlanBul('tc') || evrenselInputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc']);
        var tcVal = tcEl ? tcEl.value.trim() : (k.tc || '');
        if (!tcVal || tcVal.length < 11) {
            eksikler.push('TC Kimlik No (11 hane)');
        }

        // 2. Öğrenim Yılı
        var ogrenimYiliEl = ogretilmisAlanBul('ogrenimYili') || evrenselInputBul(['ogrenimyili', 'donem', 'ogretimyili', 'ddlogrenimyili']);
        if (ogrenimYiliEl && (ogrenimYiliEl.tagName || '').toLowerCase() === 'select') {
            var oyVal = ogrenimYiliEl.value;
            var oyTxt = trTemizle(ogrenimYiliEl.options[ogrenimYiliEl.selectedIndex] ? ogrenimYiliEl.options[ogrenimYiliEl.selectedIndex].textContent : '');
            if (!oyVal || oyTxt.indexOf('seciniz') !== -1 || oyTxt === '') {
                eksikler.push('Öğrenim Yılı');
            }
        }

        // 3. Kapsam
        var kapsamEl = ogretilmisAlanBul('kapsam') || evrenselInputBul(['kapsam', 'madde', 'kapsamturu', 'ddlkapsam']);
        if (kapsamEl && (kapsamEl.tagName || '').toLowerCase() === 'select') {
            var kVal = kapsamEl.value;
            var kTxt = trTemizle(kapsamEl.options[kapsamEl.selectedIndex] ? kapsamEl.options[kapsamEl.selectedIndex].textContent : '');
            if (!kVal || kTxt.indexOf('seciniz') !== -1 || kTxt === '') {
                eksikler.push('Kapsam Maddesi');
            }
        }

        // 4. Alan
        var alanEl = ogretilmisAlanBul('alan') || evrenselInputBul(['ddlalan', 'alan', 'alanadi', 'meslek']);
        if (alanEl) {
            var aVal = alanEl.value ? alanEl.value.trim() : '';
            if (!aVal || trTemizle(aVal).indexOf('seciniz') !== -1) {
                eksikler.push('Mesleki Alan');
            }
        }

        // 5. Dal
        var dalEl = ogretilmisAlanBul('dal') || evrenselInputBul(['ddldal', 'dal', 'daladi']);
        if (dalEl) {
            var dVal = dalEl.value ? dalEl.value.trim() : '';
            if (!dVal || trTemizle(dVal).indexOf('seciniz') !== -1) {
                eksikler.push('Mesleki Dal');
            }
        }

        // 6. En Son Mezuniyet
        var mezuniyetEl = ogretilmisAlanBul('enSonMezuniyet') || evrenselInputBul(['ensonmezuniyet', 'mezuniyet', 'ddlmezuniyet']);
        if (mezuniyetEl && (mezuniyetEl.tagName || '').toLowerCase() === 'select') {
            var mVal = mezuniyetEl.value;
            var mTxt = trTemizle(mezuniyetEl.options[mezuniyetEl.selectedIndex] ? mezuniyetEl.options[mezuniyetEl.selectedIndex].textContent : '');
            if (!mVal || mTxt.indexOf('seciniz') !== -1 || mTxt === '') {
                eksikler.push('En Son Mezuniyet');
            }
        }

        // 7. Getirdiği Belge
        var belgeEl = ogretilmisAlanBul('getirdigiBelge') || evrenselInputBul(['getirdigibelge', 'belgeturu', 'ddlbelge']);
        if (belgeEl && (belgeEl.tagName || '').toLowerCase() === 'select') {
            var bVal = belgeEl.value;
            var bTxt = trTemizle(belgeEl.options[belgeEl.selectedIndex] ? belgeEl.options[belgeEl.selectedIndex].textContent : '');
            if (!bVal || bTxt.indexOf('seciniz') !== -1 || bTxt === '') {
                eksikler.push('Getirdiği Belge');
            }
        }

        // 8. Belge Tarihi
        var belgeTarihEl = ogretilmisAlanBul('belgeTarihi') || evrenselInputBul(['belgetarihi', 'diplomatarihi']);
        if (belgeTarihEl && (!belgeTarihEl.value || belgeTarihEl.value.trim().length < 8)) {
            eksikler.push('Belge Tarihi');
        }

        return eksikler;
    }

    // ADIM 6: Kaydet Butonuna Bas (Güvenlik Kilidi Denetimiyle)
    async function adim6_Kaydet(k) {
        logEkle('6. Adım: Kayıt öncesi güvenlik doğrulaması yapılıyor...', 'islem');

        // Pre-Save Verification: Eksik alan denetimi
        var eksikler = formuDogrula(k);
        if (eksikler.length > 0) {
            var hataMetni = 'Kayıt Güvenlik Kilidi: Eksik alanlar var -> ' + eksikler.join(', ');
            logEkle('❌ GÜVENLİK KİLİDİ: ' + hataMetni, 'hata');
            durum('❌ ' + hataMetni, '#f87171');
            sesCal('hata');
            throw new Error(hataMetni);
        }

        logEkle('✓ Güvenlik doğrulaması başarılı. Kaydet butonuna basılıyor...', 'basari');
        var kaydetBtn = ogretilmisAlanBul('kaydetBtn') ||
                        evrenselMetinleBul('button, a, input[type="submit"], input[type="button"], .btn-success, .btn-primary', ['Kaydet', 'Ön Kaydı Tamamla', 'Kaydet ve Kapat'], false);

        if (kaydetBtn) {
            vurgula(kaydetBtn, '#22c55e');
            kaydetBtn.click();
            logEkle('✓ Kaydet butonuna tıklandı, işlem tamamlanıyor...', 'basari');
            await postBackBitisiniBekle(4000, 'Kayıt Tamamlama PostBack');

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
            logEkle('Manuel Onay Modu Aktif: Form eksiksiz dolduruldu, kullanıcı onayı bekleniyor.', 'uyari');
            return;
        }

        await adim6_Kaydet(k);

        k.durum = 'tamamlandi';
        sesCal('basari');
        durum('✓ [' + k.tc + '] ' + (k.ad || '') + ' ' + (k.soyad || '') + ' başarıyla kaydedildi.', '#4ade80');
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
    var ogreticiKontrolBari = null;
    var alanOgreticiModal = null;
    var aktifOgreticiSekme = 'TUMU'; // 'ANA_EKRAN', 'POPUP', 'TUMU'

    /* Iframe ve Nested Belgeler İçin Ekran Koordinatı Hesaplayıcı */
    function getElemanEkranKonumu(element) {
        if (!element || !element.getBoundingClientRect) return { top: 0, left: 0, width: 0, height: 0 };
        var rect = element.getBoundingClientRect();
        var doc = element.ownerDocument;
        var win = doc ? (doc.defaultView || doc.parentWindow) : null;
        var offsetX = 0;
        var offsetY = 0;

        while (win && win !== window) {
            try {
                var frameElement = win.frameElement;
                if (frameElement) {
                    var fRect = frameElement.getBoundingClientRect();
                    offsetX += fRect.left;
                    offsetY += fRect.top;
                    doc = frameElement.ownerDocument;
                    win = doc ? (doc.defaultView || doc.parentWindow) : null;
                } else {
                    break;
                }
            } catch (e) {
                break;
            }
        }

        return {
            top: rect.top + offsetY,
            left: rect.left + offsetX,
            width: rect.width,
            height: rect.height
        };
    }

    function ogreticiArayuzHazirla() {
        if (!vurguKatmani) {
            vurguKatmani = document.createElement('div');
            vurguKatmani.id = 'mesemOgreticiVurgu';
            vurguKatmani.style.cssText = 'position:fixed; pointer-events:none; border:3px dashed #22c55e; background:rgba(34,197,94,0.18); z-index:2147483640; transition:all .06s ease; display:none; border-radius:6px; box-shadow:0 0 15px rgba(34,197,94,0.4);';
            document.body.appendChild(vurguKatmani);
        }
        if (!ogreticiRozet) {
            ogreticiRozet = document.createElement('div');
            ogreticiRozet.id = 'mesemOgreticiRozet';
            ogreticiRozet.style.cssText = 'position:fixed; pointer-events:none; background:#0f172a; color:#4ade80; border:1px solid #22c55e; padding:5px 10px; font-size:12px; font-weight:bold; border-radius:6px; z-index:2147483641; display:none; box-shadow:0 6px 16px rgba(0,0,0,0.6); font-family:sans-serif; white-space:nowrap;';
            document.body.appendChild(ogreticiRozet);
        }
        if (!ogreticiKontrolBari) {
            ogreticiKontrolBari = document.createElement('div');
            ogreticiKontrolBari.id = 'mesemOgreticiKontrolBari';
            ogreticiKontrolBari.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#0f172a; color:#fff; border:2px solid #3b82f6; padding:8px 14px; border-radius:10px; z-index:2147483645; display:none; box-shadow:0 10px 25px rgba(0,0,0,0.8); font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size:12px; align-items:center; gap:10px;';
            document.body.appendChild(ogreticiKontrolBari);
        }
    }

    /* Dinamik Dinleyici Bağlayıcı */
    function ogreticiDinleyicileriBagla() {
        tumBelgeleriGetir().forEach(function (doc) {
            try {
                doc.removeEventListener('mousemove', ogreticiFareHareketi, true);
                doc.removeEventListener('click', ogreticiTiklama, true);
                doc.addEventListener('mousemove', ogreticiFareHareketi, true);
                doc.addEventListener('click', ogreticiTiklama, true);
            } catch (e) { }
        });
    }

    function ogreticiDinleyicileriKopart() {
        tumBelgeleriGetir().forEach(function (doc) {
            try {
                doc.removeEventListener('mousemove', ogreticiFareHareketi, true);
                doc.removeEventListener('click', ogreticiTiklama, true);
            } catch (e) { }
        });
    }

    function ogreticiKontrolBariGuncelle() {
        if (!ogreticiKontrolBari) return;
        if (!ogretmeModuAktif && !incelemeModuAktif) {
            ogreticiKontrolBari.style.display = 'none';
            return;
        }

        ogreticiKontrolBari.textContent = '';
        ogreticiKontrolBari.style.display = 'flex';

        if (incelemeModuAktif) {
            ogreticiKontrolBari.style.borderColor = '#c084fc';
            var infoIncele = el('span', 'font-weight:600; color:#c084fc; display:flex; align-items:center; gap:6px;');
            infoIncele.innerHTML = '🔬 <strong>CANLI ELEMAN İNCELEME MODU:</strong> İncelemek istediğiniz MEB kutusuna (Öğrenim Yılı / Alan vb.) tıklayın!';
            ogreticiKontrolBari.appendChild(infoIncele);

            var btnInceleKapat = el('button', 'padding:4px 9px; font-size:11px; font-weight:bold; background:#dc2626; color:#fff; border:0; border-radius:5px; cursor:pointer;', '✕ Kapat');
            btnInceleKapat.onclick = function (e) {
                e.stopPropagation();
                elemanIncelemeModunuKapat();
            };
            ogreticiKontrolBari.appendChild(btnInceleKapat);
            return;
        }

        ogreticiKontrolBari.style.borderColor = '#3b82f6';
        var alanBilgi = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === ogretilenHedefAlan; });
        var alanAd = alanBilgi ? alanBilgi.ad : (ogretilenHedefAlan || 'Seçilmedi');
        var grupAd = (alanBilgi && alanBilgi.grup === 'POPUP') ? '🪟 Açılır Pencere' : '🖥️ Ana Ekran';

        var infoSpan = el('span', 'font-weight:600; color:#38bdf8; display:flex; align-items:center; gap:6px;');
        if (ogretmeDuraklatildi) {
            infoSpan.innerHTML = '<span style="color:#fbbf24;">⏸️ DURAKLATILDI:</span> Sayfada gezinip pencereleri açabilirsiniz.';
        } else {
            infoSpan.innerHTML = '🎯 Hedef: <strong style="color:#4ade80;">' + alanAd + '</strong> <span style="font-size:10px; color:#94a3b8; padding:2px 5px; background:#1e293b; border-radius:3px;">' + grupAd + '</span> (Tıklayın)';
        }
        ogreticiKontrolBari.appendChild(infoSpan);

        // Yeni Kayıt Aç Butonu
        var btnYeniPencere = el('button', 'padding:4px 9px; font-size:11px; font-weight:bold; background:#0284c7; color:#fff; border:0; border-radius:5px; cursor:pointer;', '🪟 Yeni Kayıt Penceresini Aç');
        btnYeniPencere.title = 'Öğretilmiş veya varsayılan Yeni Kayıt butonuna tıklar';
        btnYeniPencere.onclick = async function (e) {
            e.stopPropagation();
            logEkle('Yeni Kayıt penceresi açılıyor...', 'islem');
            var k = filtreliKayitlar[aktifIndeks] || { kategori: 'KALFALIK' };
            await adim2_YeniKayitAc(k);
            ogreticiDinleyicileriBagla();
        };
        ogreticiKontrolBari.appendChild(btnYeniPencere);

        // Duraklat / Devam Et Butonu
        var btnDuraklat = el('button', 'padding:4px 9px; font-size:11px; font-weight:bold; background:' + (ogretmeDuraklatildi ? '#16a34a' : '#d97706') + '; color:#fff; border:0; border-radius:5px; cursor:pointer;', ogretmeDuraklatildi ? '▶️ Devam Et' : '⏸️ Duraklat');
        btnDuraklat.onclick = function (e) {
            e.stopPropagation();
            ogretmeDuraklatildi = !ogretmeDuraklatildi;
            if (ogretmeDuraklatildi) {
                if (vurguKatmani) vurguKatmani.style.display = 'none';
                if (ogreticiRozet) ogreticiRozet.style.display = 'none';
                durum('⏸️ Öğretme duraklatıldı. İstediğiniz pencereyi açıp "Devam Et"e basın.', '#fbbf24');
            } else {
                durum('🎯 Öğretme modu aktif: "' + alanAd + '" öğesine tıklayın!', '#22c55e');
                ogreticiDinleyicileriBagla();
            }
            ogreticiKontrolBariGuncelle();
        };
        ogreticiKontrolBari.appendChild(btnDuraklat);

        // Listeye Dön / Bitir Butonu
        var btnBitir = el('button', 'padding:4px 9px; font-size:11px; font-weight:bold; background:#dc2626; color:#fff; border:0; border-radius:5px; cursor:pointer;', '✕ Bitir');
        btnBitir.onclick = function (e) {
            e.stopPropagation();
            ogretmeModunuKapat();
            alanOgretModaliniGoster();
        };
        ogreticiKontrolBari.appendChild(btnBitir);
    }

    function ogretmeModunuBaslat(tekliAlanId, siraliMi) {
        if (incelemeModuAktif) elemanIncelemeModunuKapat();
        ogreticiArayuzHazirla();
        ogretmeModuAktif = true;
        ogretmeDuraklatildi = false;
        ogretmeSiraliMi = !!siraliMi;
        
        if (tekliAlanId) {
            ogretilenHedefAlan = tekliAlanId;
            var idx = OGRETILEBILIR_ALANLAR.findIndex(function (a) { return a.id === tekliAlanId; });
            ogretmeListesiSirasi = idx !== -1 ? idx : 0;
        } else {
            ogretmeListesiSirasi = 0;
            ogretilenHedefAlan = OGRETILEBILIR_ALANLAR[0].id;
        }

        var alanBilgi = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === ogretilenHedefAlan; });
        var alanAd = alanBilgi ? alanBilgi.ad : ogretilenHedefAlan;

        durum('🎯 Öğretme Modu: Sayfada "' + alanAd + '" öğesine tıklayın!', '#22c55e');
        logEkle('🎯 Alan Öğretici Başlatıldı: [' + alanAd + ']', 'uyari');

        if (alanOgreticiModal) alanOgreticiModal.style.display = 'none';

        ogreticiDinleyicileriBagla();
        ogreticiKontrolBariGuncelle();
    }

    function ogretmeModunuKapat() {
        ogretmeModuAktif = false;
        ogretmeDuraklatildi = false;
        ogretilenHedefAlan = null;
        if (vurguKatmani) vurguKatmani.style.display = 'none';
        if (ogreticiRozet) ogreticiRozet.style.display = 'none';
        if (ogreticiKontrolBari) ogreticiKontrolBari.style.display = 'none';

        ogreticiDinleyicileriKopart();

        durum('Öğretme modu tamamlandı.', '#cbd5e1');
        logEkle('Öğretme modu kapatıldı.', 'islem');
    }

    function ogreticiFareHareketi(e) {
        if ((!ogretmeModuAktif || ogretmeDuraklatildi) && !incelemeModuAktif) return;
        var hamHedef = e.target;
        if (!hamHedef || hamHedef.closest('#mesemYardimciPanel') || hamHedef.closest('#mesemOgreticiModal') || hamHedef.closest('#mesemOgreticiKontrolBari') || hamHedef.id === 'mesemOgreticiVurgu' || hamHedef.id === 'mesemOgreticiRozet') {
            if (vurguKatmani) vurguKatmani.style.display = 'none';
            if (ogreticiRozet) ogreticiRozet.style.display = 'none';
            return;
        }

        // Akıllı Alan Öğretici: Eğer span/div ise en yakın select/input öğesini otomatik bul
        var hedef = (hamHedef.closest && hamHedef.closest('select, input, textarea, button, a')) ||
                    (hamHedef.querySelector && hamHedef.querySelector('select, input, textarea, button, a')) ||
                    hamHedef;

        var rect = getElemanEkranKonumu(hedef);
        if (rect.width === 0 && rect.height === 0) return;

        if (vurguKatmani) {
            vurguKatmani.style.display = 'block';
            vurguKatmani.style.top = rect.top + 'px';
            vurguKatmani.style.left = rect.left + 'px';
            vurguKatmani.style.width = rect.width + 'px';
            vurguKatmani.style.height = rect.height + 'px';
            vurguKatmani.style.borderColor = incelemeModuAktif ? '#c084fc' : '#22c55e';
            vurguKatmani.style.background = incelemeModuAktif ? 'rgba(192,132,252,0.2)' : 'rgba(34,197,94,0.18)';
        }

        if (ogreticiRozet) {
            ogreticiRozet.style.display = 'block';
            ogreticiRozet.style.top = Math.max(5, rect.top - 32) + 'px';
            ogreticiRozet.style.left = Math.max(5, rect.left) + 'px';
            ogreticiRozet.style.borderColor = incelemeModuAktif ? '#c084fc' : '#22c55e';
            ogreticiRozet.style.color = incelemeModuAktif ? '#c084fc' : '#4ade80';

            if (incelemeModuAktif) {
                ogreticiRozet.textContent = '🔬 İncele: <' + hedef.tagName.toLowerCase() + '>' + (hedef.id ? '#' + hedef.id : (hedef.name ? '[name=' + hedef.name + ']' : ''));
            } else {
                var alanBilgi = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === ogretilenHedefAlan; });
                var alanAd = alanBilgi ? alanBilgi.ad : ogretilenHedefAlan;
                ogreticiRozet.textContent = '🎯 Eşle: ' + alanAd + ' (' + hedef.tagName.toLowerCase() + (hedef.id ? '#' + hedef.id : (hedef.name ? '[name=' + hedef.name + ']' : '')) + ')';
            }
        }
    }

    function ogreticiTiklama(e) {
        if ((!ogretmeModuAktif || ogretmeDuraklatildi) && !incelemeModuAktif) return;
        var hamHedef = e.target;
        if (!hamHedef || hamHedef.closest('#mesemYardimciPanel') || hamHedef.closest('#mesemOgreticiModal') || hamHedef.closest('#mesemOgreticiKontrolBari')) return;

        e.preventDefault();
        e.stopPropagation();

        // ----------------------------------------------------
        // İNCELEME MODU (CANLI ELEMAN ANALİZİ)
        // ----------------------------------------------------
        if (incelemeModuAktif) {
            elemaniDetayliInceleVeRaporla(hamHedef);
            elemanIncelemeModunuKapat();
            return;
        }

        // ----------------------------------------------------
        // ÖĞRETİCİ MODU (AKILLI HEDEF ÇIKARIMI)
        // ----------------------------------------------------
        // Eğer div/span/label tıklandıysa otomatik en yakın select/input öğesini bul
        var hedef = (hamHedef.closest && hamHedef.closest('select, input, textarea, button, a')) ||
                    (hamHedef.querySelector && hamHedef.querySelector('select, input, textarea, button, a')) ||
                    hamHedef;

        var selector = benzersizSelectorUret(hedef);
        if (selector && ogretilenHedefAlan) {
            ozelEslemeler[ogretilenHedefAlan] = selector;
            try {
                localStorage.setItem(STORAGE_ESLEME_ANAHTARI, JSON.stringify(ozelEslemeler));
            } catch (err) { }

            var alanBilgi = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === ogretilenHedefAlan; });
            var alanAd = alanBilgi ? alanBilgi.ad : ogretilenHedefAlan;

            sesCal('basari');
            logEkle('✓ Eşlendi: [' + alanAd + '] -> ' + selector + ' (' + hedef.tagName.toLowerCase() + ')', 'basari');
            vurgula(hedef, '#22c55e');

            if (ogretmeSiraliMi) {
                ogretmeListesiSirasi++;
                if (ogretmeListesiSirasi < OGRETILEBILIR_ALANLAR.length) {
                    ogretilenHedefAlan = OGRETILEBILIR_ALANLAR[ogretmeListesiSirasi].id;
                    var sonrakiAd = OGRETILEBILIR_ALANLAR[ogretmeListesiSirasi].ad;
                    durum('🎯 Sıradaki: "' + sonrakiAd + '" öğesine tıklayın!', '#22c55e');
                    logEkle('Sıradaki öğretilecek alan: [' + sonrakiAd + ']', 'uyari');
                    ogreticiKontrolBariGuncelle();
                } else {
                    ogretmeModunuKapat();
                    durum('✓ Tüm alanların özel eşlemesi başarıyla tamamlandı!', '#4ade80');
                    logEkle('🎉 Tüm alanlar başarıyla robota öğretildi!', 'basari');
                    alanOgretModaliniGoster();
                }
            } else {
                // Tekli alan öğretimi tamamlandı
                ogretmeModunuKapat();
                durum('✓ [' + alanAd + '] alanı başarıyla kaydedildi!', '#4ade80');
                alanOgretModaliniGoster();
            }
        }
    }

    /* ============================================================
       CANLI ELEMAN ANALİZÖRÜ (LIVE ELEMENT INSPECTOR & DUMPER)
       ============================================================ */
    function elemanIncelemeModunuBaslat() {
        if (ogretmeModuAktif) ogretmeModunuKapat();
        ogreticiArayuzHazirla();
        incelemeModuAktif = true;
        if (vurguKatmani) {
            vurguKatmani.style.borderColor = '#c084fc';
            vurguKatmani.style.background = 'rgba(192,132,252,0.2)';
        }
        ogreticiDinleyicileriBagla();
        ogreticiKontrolBariGuncelle();
        sesCal('kesif');
        durum('🔬 İnceleme Modu: MEB ekranında analiz etmek istediğiniz kutuya tıklayın!', '#c084fc');
        logEkle('🔬 Canlı Eleman İnceleme Modu Açıldı. MEB sayfasındaki herhangi bir kutuya tıklayın.', 'mor');
    }

    function elemanIncelemeModunuKapat() {
        incelemeModuAktif = false;
        if (vurguKatmani) vurguKatmani.style.display = 'none';
        if (ogreticiRozet) ogreticiRozet.style.display = 'none';
        if (ogreticiKontrolBari) ogreticiKontrolBari.style.display = 'none';
        ogreticiDinleyicileriKopart();
        durum('İnceleme modu kapatıldı.', '#cbd5e1');
    }

    function elemaniDetayliInceleVeRaporla(targetEl) {
        if (!targetEl) return;

        var el = (targetEl.closest && targetEl.closest('select, input, textarea, button, a')) ||
                 (targetEl.querySelector && targetEl.querySelector('select, input, textarea, button, a')) ||
                 targetEl;

        var selector = benzersizSelectorUret(el);
        var tag = (el.tagName || '').toLowerCase();
        var id = el.id || '-';
        var name = el.name || '-';
        var cls = el.className || '-';
        var type = el.type || '-';
        var val = el.value !== undefined ? String(el.value) : '-';
        var txt = (el.textContent || '').trim().slice(0, 100);

        var optionsList = [];
        if (el.options) {
            for (var i = 0; i < el.options.length; i++) {
                var o = el.options[i];
                optionsList.push({ index: i, value: o.value, text: o.textContent.trim(), selected: o.selected });
            }
        } else if (targetEl.querySelectorAll) {
            var altOptions = targetEl.querySelectorAll('option, li, div[role="option"]');
            for (var j = 0; j < altOptions.length; j++) {
                var ao = altOptions[j];
                optionsList.push({ index: j, text: ao.textContent.trim() });
            }
        }

        var rapor = {
            tarih: new Date().toISOString(),
            hedef: {
                tagName: tag,
                id: id,
                name: name,
                type: type,
                className: cls,
                value: val,
                textContentOzet: txt,
                selector: selector,
                secenekSayisi: optionsList.length,
                secenekler: optionsList.slice(0, 20),
                outerHTML: (el.outerHTML || '').slice(0, 500)
            },
            ebeveyn: el.parentElement ? {
                tagName: el.parentElement.tagName.toLowerCase(),
                id: el.parentElement.id || '-',
                className: el.parentElement.className || '-'
            } : null
        };

        vurgula(el, '#c084fc');
        sesCal('basari');

        // Canlı Log Konsoluna Dök
        logEkle('=== 🔬 ELEMAN ANALİZ RAPORU ===', 'mor');
        logEkle('🏷️ Tag: <' + tag + '> | ID: #' + id + ' | Name: ' + name, 'mor');
        logEkle('📌 Selector: ' + selector, 'islem');
        logEkle('📝 Değer: "' + val + '" | Sınıf: ' + cls, 'islem');
        if (optionsList.length > 0) {
            logEkle('📋 Seçenekler (' + optionsList.length + ' adet): ' + optionsList.slice(0, 5).map(function (o) { return '"' + o.text + '"'; }).join(', ') + (optionsList.length > 5 ? ' ...' : ''), 'basari');
        } else {
            logEkle('ℹ️ Standart select options listesi bulunamadı (Input/Custom div olabilir).', 'uyari');
        }

        // Panoya JSON Formatında Kopyala
        var jsonMetin = JSON.stringify(rapor, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonMetin).then(function () {
                durum('✓ [' + tag + '#' + id + '] analizi yapıldı ve panoya kopyalandı!', '#4ade80');
                logEkle('✓ Tam analiz raporu panoya (clipboard) kopyalandı!', 'basari');
            });
        } else {
            durum('✓ [' + tag + '#' + id + '] incelendi (Konsola yazıldı).', '#4ade80');
        }
    }

    function tekilAlanSifirla(alanId) {
        if (ozelEslemeler && ozelEslemeler[alanId]) {
            delete ozelEslemeler[alanId];
            try {
                localStorage.setItem(STORAGE_ESLEME_ANAHTARI, JSON.stringify(ozelEslemeler));
            } catch (e) { }
            var ab = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === alanId; });
            logEkle('[' + (ab ? ab.ad : alanId) + '] özel eşlemesi sıfırlandı, varsayılana dönüldü.', 'uyari');
            alanOgretListesiniCiz();
        }
    }

    function alanTestEtVeVurgula(alanId) {
        var el = ogretilmisAlanBul(alanId);
        var ab = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === alanId; });
        var alanAd = ab ? ab.ad : alanId;

        if (!el) {
            // Fallback arama
            if (alanId === 'kalfalikSekme' || alanId === 'ustalikSekme' || alanId === 'pedagojiSekme') {
                var kat = alanId === 'pedagojiSekme' ? 'PEDAGOJI' : (alanId === 'ustalikSekme' ? 'USTALIK' : 'KALFALIK');
                var arananSekmeler = kat === 'PEDAGOJI' ? ['İş Pedagojisi Kursu', 'İş Pedagojisi', 'Usta Öğreticilik'] : (kat === 'USTALIK' ? ['Ustalık Sınavı', 'Ustalık'] : ['Kalfalık Sınavı', 'Kalfalık']);
                el = evrenselMetinleBul('button, a, input[type="button"], .tab, span, td, div', arananSekmeler, false);
            } else if (alanId === 'yeniKayitBtn') {
                el = evrenselMetinleBul('button, a, input[type="button"], .btn', ['Yeni Kayıt', 'Yeni Ekle', 'Yeni'], false);
            } else if (alanId === 'kaydetBtn') {
                el = evrenselMetinleBul('button, a, input[type="submit"], input[type="button"], .btn-success, .btn-primary', ['Kaydet', 'Ön Kaydı Tamamla'], false);
            } else if (alanId === 'sorgulaBtn') {
                el = evrenselMetinleBul('button, a, input[type="button"], .btn', ['Sorgula', 'MERNİS Sorgula', 'Mernis', 'Getir'], false);
            } else if (alanId === 'ogrenimYili') {
                el = evrenselInputBul(['ogrenimyili', 'donem', 'ogretimyili', 'egitimyili', 'ddlogrenimyili']);
            } else if (alanId === 'tc') {
                el = evrenselInputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc']);
            } else if (alanId === 'dogumTarihi') {
                el = evrenselInputBul(['dogumtarihi', 'dogum', 'txtdogum']);
            } else if (alanId === 'kapsam') {
                el = evrenselInputBul(['kapsam', 'madde', 'kapsamturu', 'ddlkapsam']);
            } else if (alanId === 'eposta') {
                el = evrenselInputBul(['eposta', 'email', 'mail']);
            } else if (alanId === 'telefon') {
                el = evrenselInputBul(['telefon', 'tel', 'cep', 'gsm']);
            } else if (alanId === 'enSonMezuniyet') {
                el = evrenselInputBul(['ensonmezuniyet', 'mezuniyet', 'ogrenimdurumu', 'ddlmezuniyet']);
            } else if (alanId === 'getirdigiBelge') {
                el = evrenselInputBul(['getirdigibelge', 'belgeturu', 'ogrenimbelgesi', 'ddlbelge']);
            } else if (alanId === 'belgeTarihi') {
                el = evrenselInputBul(['belgetarihi', 'diplomatarihi']);
            } else if (alanId === 'alan') {
                el = evrenselInputBul(['ddlalan', 'alan', 'alanadi', 'meslek']);
            } else if (alanId === 'dal') {
                el = evrenselInputBul(['ddldal', 'dal', 'daladi']);
            }
        }

        if (el) {
            vurgula(el, '#22c55e');
            try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }
            sesCal('basari');
            durum('✓ [' + alanAd + '] ekranda bulundu ve parlatıldı!', '#4ade80');
            logEkle('✓ Test Başarılı: [' + alanAd + '] ekranda bulundu.', 'basari');
        } else {
            sesCal('hata');
            durum('✕ [' + alanAd + '] mevcut açık sayfada/pencerede bulunamadı! Lütfen ilgili açılır pencerenin açık olduğundan emin olun.', '#f87171');
            logEkle('✕ Test Başarısız: [' + alanAd + '] bulunamadı! Açılır pencereyi açıp tekrar deneyin.', 'hata');
        }
    }

    function ogretilenEslemeleriTemizle() {
        if (confirm('Tüm özel alan eşlemeleri silinsin ve varsayılan akıllı seçicilere dönülsün mü?')) {
            ozelEslemeler = {};
            try { localStorage.removeItem(STORAGE_ESLEME_ANAHTARI); } catch (e) { }
            logEkle('Tüm özel alan eşlemeleri sıfırlandı.', 'uyari');
            durum('Özel alan eşlemeleri sıfırlandı.', '#cbd5e1');
            alanOgretListesiniCiz();
        }
    }

    /* ---------------- ALAN ÖĞRETİCİ MODAL PENCERESİ ---------------- */
    var modalListeAlani = null;
    var modalSekmeAnaBtn = null;
    var modalSekmePopupBtn = null;
    var modalSekmeTumuBtn = null;

    function alanOgretModaliniOlustur() {
        if (alanOgreticiModal) return;

        alanOgreticiModal = el('div', [
            'position:fixed', 'top:50%', 'left:50%', 'transform:translate(-50%, -50%)',
            'width:580px', 'max-width:95vw', 'max-height:88vh',
            'background:#0f172a', 'color:#f8fafc', 'border:1px solid #3b82f6', 'border-radius:14px',
            'box-shadow:0 25px 60px -15px rgba(0,0,0,0.9)', 'z-index:2147483646',
            'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'display:none', 'flex-direction:column', 'overflow:hidden', 'font-size:12.5px'
        ].join(';'));
        alanOgreticiModal.id = 'mesemOgreticiModal';

        // Modal Header
        var mHeader = el('div', 'display:flex; align-items:center; gap:8px; padding:12px 16px; background:#1e293b; border-bottom:1px solid #334155; user-select:none;');
        mHeader.appendChild(el('strong', 'flex:1; font-size:14px; color:#38bdf8; display:flex; align-items:center; gap:6px;', '🎯 E-MESEM Esnek Alan Öğretici Paneli (v' + SURUM + ')'));

        var mKapat = el('button', 'border:0; background:#dc2626; color:#fff; width:28px; height:28px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:15px;', '×');
        mKapat.onclick = function () { alanOgreticiModal.style.display = 'none'; };
        mHeader.appendChild(mKapat);

        // Açıklama & Hızlı İşlem Barı
        var rehberKutu = el('div', 'padding:10px 14px; background:#0b1120; border-bottom:1px solid #1e293b; line-height:1.45;');
        rehberKutu.innerHTML = '<div style="color:#e2e8f0; font-size:12px; margin-bottom:6px;">MEB sisteminde <strong>Yeni Kayıt</strong> butonuna basıldığında açılan popup/modal içindeki tüm alanları serbestçe tek tek öğretebilir veya test edebilirsiniz.</div>' +
            '<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">' +
            '<button id="btnModalYeniPencereAc" style="padding:5px 10px; font-size:11.5px; font-weight:bold; background:#0284c7; color:#fff; border:0; border-radius:5px; cursor:pointer;">🪟 Yeni Kayıt Penceresini Aç</button>' +
            '<button id="btnModalSiraliOgret" style="padding:5px 10px; font-size:11.5px; font-weight:bold; background:#10b981; color:#fff; border:0; border-radius:5px; cursor:pointer;">⚡ Sırayla Tümünü Öğret</button>' +
            '<button id="btnModalEslemeleriSifirla" style="padding:5px 8px; font-size:11px; background:#475569; color:#f8fafc; border:0; border-radius:5px; cursor:pointer; margin-left:auto;">🗑️ Tümünü Sıfırla</button>' +
            '</div>';

        // Modal Sekmeleri (Ana Ekran / Açılır Pencere)
        var mSekmeBar = el('div', 'display:flex; gap:4px; padding:6px 14px; background:#1e293b; border-bottom:1px solid #334155;');
        
        modalSekmeAnaBtn = el('button', 'flex:1; padding:6px 6px; font-size:11.5px; font-weight:700; border:0; border-radius:5px; cursor:pointer; color:#fff; background:#334155;', '🖥️ Ana Ekran Alanları (4)');
        modalSekmePopupBtn = el('button', 'flex:1; padding:6px 6px; font-size:11.5px; font-weight:700; border:0; border-radius:5px; cursor:pointer; color:#fff; background:#0284c7;', '🪟 Açılır Kayıt Penceresi (13)');
        modalSekmeTumuBtn = el('button', 'padding:6px 10px; font-size:11.5px; font-weight:700; border:0; border-radius:5px; cursor:pointer; color:#fff; background:#1e293b;', 'Tümü');

        modalSekmeAnaBtn.onclick = function () { alanOgretSekmeDegistir('ANA_EKRAN'); };
        modalSekmePopupBtn.onclick = function () { alanOgretSekmeDegistir('POPUP'); };
        modalSekmeTumuBtn.onclick = function () { alanOgretSekmeDegistir('TUMU'); };

        mSekmeBar.appendChild(modalSekmePopupBtn);
        mSekmeBar.appendChild(modalSekmeAnaBtn);
        mSekmeBar.appendChild(modalSekmeTumuBtn);

        // Liste Gövdesi
        modalListeAlani = el('div', 'flex:1; overflow-y:auto; max-height:48vh; padding:6px 14px; background:#090d16;');

        // Modal Footer
        var mFooter = el('div', 'display:flex; justify-content:space-between; align-items:center; padding:10px 16px; background:#1e293b; border-top:1px solid #334155;');
        var footerBilgi = el('span', 'font-size:11px; color:#94a3b8;', 'Öğretilen alanlar tarayıcınızda otomatik saklanır.');
        var btnModalKapat = el('button', 'padding:5px 14px; font-size:11.5px; font-weight:bold; background:#334155; color:#fff; border:0; border-radius:5px; cursor:pointer;', 'Kapat');
        btnModalKapat.onclick = function () { alanOgreticiModal.style.display = 'none'; };

        mFooter.appendChild(footerBilgi);
        mFooter.appendChild(btnModalKapat);

        alanOgreticiModal.appendChild(mHeader);
        alanOgreticiModal.appendChild(rehberKutu);
        alanOgreticiModal.appendChild(mSekmeBar);
        alanOgreticiModal.appendChild(modalListeAlani);
        alanOgreticiModal.appendChild(mFooter);

        document.body.appendChild(alanOgreticiModal);

        // Event bağlantıları
        var btnYP = alanOgreticiModal.querySelector('#btnModalYeniPencereAc');
        if (btnYP) {
            btnYP.onclick = async function () {
                var k = filtreliKayitlar[aktifIndeks] || { kategori: 'KALFALIK' };
                await adim2_YeniKayitAc(k);
            };
        }
        var btnSO = alanOgreticiModal.querySelector('#btnModalSiraliOgret');
        if (btnSO) {
            btnSO.onclick = function () { ogretmeModunuBaslat(null, true); };
        }
        var btnTS = alanOgreticiModal.querySelector('#btnModalEslemeleriSifirla');
        if (btnTS) {
            btnTS.onclick = ogretilenEslemeleriTemizle;
        }
    }

    function alanOgretSekmeDegistir(sekme) {
        aktifOgreticiSekme = sekme;
        if (modalSekmeAnaBtn) modalSekmeAnaBtn.style.background = sekme === 'ANA_EKRAN' ? '#0284c7' : '#1e293b';
        if (modalSekmePopupBtn) modalSekmePopupBtn.style.background = sekme === 'POPUP' ? '#0284c7' : '#1e293b';
        if (modalSekmeTumuBtn) modalSekmeTumuBtn.style.background = sekme === 'TUMU' ? '#0284c7' : '#1e293b';
        alanOgretListesiniCiz();
    }

    function alanOgretListesiniCiz() {
        if (!modalListeAlani) return;
        modalListeAlani.textContent = '';

        var filtrelenmis = OGRETILEBILIR_ALANLAR.filter(function (a) {
            if (aktifOgreticiSekme === 'TUMU') return true;
            return a.grup === aktifOgreticiSekme;
        });

        filtrelenmis.forEach(function (a, idx) {
            var ozelSecici = ozelEslemeler && ozelEslemeler[a.id];
            var ogretildi = !!ozelSecici;

            var satir = el('div', 'display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 10px; border-bottom:1px solid #1e293b; background:' + (idx % 2 === 0 ? 'rgba(30,41,59,0.3)' : 'transparent') + '; border-radius:6px; margin-bottom:2px;');

            var sol = el('div', 'flex:1; min-width:0;');
            var baslikSatir = el('div', 'display:flex; align-items:center; gap:6px; margin-bottom:2px;');
            baslikSatir.appendChild(el('strong', 'font-size:12px; color:#f8fafc;', a.ad));
            
            var tipRozet = el('span', 'font-size:9.5px; padding:1px 4px; border-radius:3px; background:#334155; color:#94a3b8;', a.tip);
            baslikSatir.appendChild(tipRozet);

            if (ogretildi) {
                var oRozet = el('span', 'font-size:10px; font-weight:bold; padding:1px 6px; border-radius:3px; background:rgba(34,197,94,0.2); color:#4ade80; border:1px solid #22c55e;', '✓ Özel Öğretildi');
                baslikSatir.appendChild(oRozet);
            } else {
                var vRozet = el('span', 'font-size:10px; padding:1px 5px; border-radius:3px; background:rgba(148,163,184,0.15); color:#94a3b8;', 'Varsayılan Akıllı Eşleşme');
                baslikSatir.appendChild(vRozet);
            }

            var aciklamaDiv = el('div', 'font-size:10.5px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;', a.aciklama);
            if (ozelSecici) {
                aciklamaDiv.innerHTML = '<span style="color:#fbbf24; font-family:Consolas, monospace;">Seçici: ' + ozelSecici + '</span>';
            }

            sol.appendChild(baslikSatir);
            sol.appendChild(aciklamaDiv);

            // Sağ Buton Grubu
            var sag = el('div', 'display:flex; gap:4px; align-items:center;');

            // 1. Bu Alanı Öğret Butonu
            var btnOgret = el('button', 'padding:4px 8px; font-size:11px; font-weight:bold; background:#10b981; color:#fff; border:0; border-radius:4px; cursor:pointer;', '🎯 Öğret');
            btnOgret.title = 'Bu alanı ekranda/modalda tıklayarak robota öğret';
            btnOgret.onclick = function () {
                ogretmeModunuBaslat(a.id, false);
            };
            sag.appendChild(btnOgret);

            // 2. Test Et (Vurgula) Butonu
            var btnTest = el('button', 'padding:4px 7px; font-size:11px; font-weight:600; background:#0284c7; color:#fff; border:0; border-radius:4px; cursor:pointer;', '👁️ Test Et');
            btnTest.title = 'Bu alanın ekranda/modalda bulunup bulunmadığını test eder ve yeşil çerçeveyle parlatır';
            btnTest.onclick = function () {
                alanTestEtVeVurgula(a.id);
            };
            sag.appendChild(btnTest);

            // 3. Sıfırla Butonu (Eğer özel öğretildiyse)
            if (ogretildi) {
                var btnSifirla = el('button', 'padding:4px 6px; font-size:11px; background:#475569; color:#f87171; border:0; border-radius:4px; cursor:pointer;', '✕');
                btnSifirla.title = 'Özel eşlemeyi silip varsayılana döndür';
                btnSifirla.onclick = function () {
                    tekilAlanSifirla(a.id);
                };
                sag.appendChild(btnSifirla);
            }

            satir.appendChild(sol);
            satir.appendChild(sag);
            modalListeAlani.appendChild(satir);
        });
    }

    function alanOgretModaliniGoster() {
        alanOgretModaliniOlustur();
        alanOgretListesiniCiz();
        alanOgreticiModal.style.display = 'flex';
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
        'position:fixed', 'top:14px', 'right:14px', 'width:470px', 'max-height:94vh',
        'background:#0f172a', 'color:#f8fafc', 'border:1px solid #334155', 'border-radius:12px',
        'box-shadow:0 25px 50px -12px rgba(0,0,0,0.85)', 'z-index:2147483647',
        'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'display:flex', 'flex-direction:column', 'overflow:hidden', 'font-size:12.5px'
    ].join(';'));
    panel.id = 'mesemYardimciPanel';

    // Header
    var baslik = el('div', 'display:flex; align-items:center; gap:6px; padding:10px 14px; background:#1e293b; cursor:move; user-select:none; border-bottom:1px solid #334155;');
    baslik.appendChild(el('strong', 'flex:1; font-size:13.5px; color:#f59e0b; display:flex; align-items:center; gap:6px;', '⚡ E-MESEM Robotu v' + SURUM));
    
    // 🔬 Canlı Eleman İnceleme Butonu (Header)
    var btnIncele = el('button', 'padding:3px 7px; font-size:11px; font-weight:bold; cursor:pointer; background:#8b5cf6; color:#fff; border:0; border-radius:4px;', '🔬 İncele');
    btnIncele.title = 'MEB sayfasındaki herhangi bir kutuyu tek tıkla incele ve detaylı analizini panoya kopyala';
    btnIncele.onclick = function () {
        if (incelemeModuAktif) elemanIncelemeModunuKapat(); else elemanIncelemeModunuBaslat();
    };

    var btnOgretMod = el('button', 'padding:3px 7px; font-size:11px; font-weight:bold; cursor:pointer; background:#10b981; color:#fff; border:0; border-radius:4px; margin-right:4px;', '🎯 Alan Öğret');
    btnOgretMod.title = 'Açılır pencere ve ana ekran alanlarını robota öğretme panelini aç';
    btnOgretMod.onclick = function () {
        alanOgretModaliniGoster();
    };

    var kucultDugme = el('button', 'border:0; background:#334155; color:#f8fafc; width:26px; height:26px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px;', '–');
    var kapatDugme = el('button', 'border:0; background:#dc2626; color:#fff; width:26px; height:26px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px; margin-left:4px;', '×');
    
    baslik.appendChild(btnIncele);
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
    
    var adimSagLinkler = el('div', 'display:flex; gap:8px;');
    var btnAlanlariYonet = el('button', 'border:0; background:transparent; color:#38bdf8; font-size:10px; cursor:pointer; text-decoration:underline; font-weight:bold;', '🎯 Alanları Yönet');
    btnAlanlariYonet.onclick = alanOgretModaliniGoster;

    var btnEslemeleriSifirla = el('button', 'border:0; background:transparent; color:#94a3b8; font-size:10px; cursor:pointer; text-decoration:underline;', 'Sıfırla');
    btnEslemeleriSifirla.onclick = ogretilenEslemeleriTemizle;

    adimSagLinkler.appendChild(btnAlanlariYonet);
    adimSagLinkler.appendChild(btnEslemeleriSifirla);
    adimBaslik.appendChild(adimSagLinkler);

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
    [['2000', '2.0s'], ['3500', '3.5s'], ['5000', '5.0s'], ['7000', '7.0s']].forEach(function (opt) {
        var o = el('option', null, opt[1]);
        o.value = opt[0];
        if (opt[0] === '3500') o.selected = true;
        selGecikme.appendChild(o);
    });
    selGecikme.onchange = function () { mernisBeklemeSuresi = Number(selGecikme.value) || 3500; };
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
        elemanIncelemeModunuKapat();
        panel.remove();
        if (dosyaGirdi) dosyaGirdi.remove();
        if (vurguKatmani) vurguKatmani.remove();
        if (ogreticiRozet) ogreticiRozet.remove();
        if (ogreticiKontrolBari) ogreticiKontrolBari.remove();
        if (alanOgreticiModal) alanOgreticiModal.remove();
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
    logEkle('E-MESEM Otomasyon Robotu v' + SURUM + ' hazır (Evrensel Çok Katmanlı Seçim Motoru Aktif).', 'basari');

    window.__mesemYardimci = {
        gosterGizle: function () {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        },
        kayitlariYukle: kayitlariYukle,
        adimiIsle: adimiIsle,
        sayfayiTeshisEt: sayfayiTeshisEt,
        ogretmeModunuBaslat: ogretmeModunuBaslat,
        alanOgretModaliniGoster: alanOgretModaliniGoster,
        elemanIncelemeModunuBaslat: elemanIncelemeModunuBaslat,
        kanonikMetin: kanonikMetin,
        evrenselSecimYap: evrenselSecimYap,
        ogrenimYiliSec: ogrenimYiliSec,
        telefonuYaz: telefonuYaz
    };
})();
