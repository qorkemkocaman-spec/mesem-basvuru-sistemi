/* ==================================================================
   E-MESEM Sınav Öğrenci Ön Kayıt & Otomasyon Robotu (v9.0)
   Geliştirici: Görkem Kocaman © 2026
   ------------------------------------------------------------------
   MEB E-MESEM (emesem.meb.gov.tr) portalında "Sınav Öğrenci Ön Kayıt"
   ekranında Kalfalık, Ustalık ve İş Pedagojisi sınav ve kurs başvurularını
   tam otomatik, ASP.NET AJAX UpdatePanel & PostBack uyumlu,
   Telerik UI for ASP.NET AJAX RadComboBox ($find API & DropDown DOM motoru),
   Telerik RadDatePicker (API + Maskeli Tarih Giriş Motoru),
   4 Dönemli Öğrenim Yılı destekli, Yerleşik Sabitlenmiş Telerik Seçici Haritalı
   (Zero-Config Default Presets), Canlı Eleman Analizörlü (Live DOM Inspector)
   ve hatasız kayıt motoru.

   Temel Yetenekler:
     1. ⚡ Yerleşik Sabitlenmiş Telerik Seçici Haritası (Sıfır Konfigürasyonla Doğrudan Çalışır)
     2. 📅 Telerik RadDatePicker Yerel Sürücüsü ($find API + GG.AA.YYYY Maskeli Klavye Simülasyonu)
     3. 🎓 4 Dönemli Öğrenim Yılı Formatı (I. / II. / III. / IV. Dönem Akıllı Eşleştirici)
     4. 🌲 Kademeli (Cascading) cmbAlan -> cmbDal Otomatik Seçim ve RadComboBox Senkronizasyon Motoru
     5. 🛡️ Pre-Save Güvenlik Kilidi (Tüm Kritik Telerik ve Form Alanları Doğrulanmadan Kaydetmez)
     6. 🔬 Canlı Eleman Analizörü & Telerik DOM Dumper (Tek Tıkla Kutu İnceleme & Pano Raporlayıcı)
     7. 🎯 Akıllı Alan Öğretici & Eşleme Modu (Profil JSON Dışa/İçe Aktarma Destekli)
     8. 🐾 Adım Adım Manuel Denetim (Step-by-Step Test Modu)
     9. 📟 Canlı Log Konsolu & Web Audio Bildirim Sistemi
     10. 📞 Garantili Maskeli Telefon Girişi Simülatörü (+90 Maskesi)
================================================================== */
(function () {
    'use strict';

    if (window.__mesemYardimci) {
        window.__mesemYardimci.gosterGizle();
        return;
    }

    var SURUM = "9.0";
    var STORAGE_ESLEME_ANAHTARI = "mesem_ogretilmis_alanlar_v9";

    /* ============================================================
       MEB E-MESEM YERLEŞİK SABİTLENMİŞ TELERİK SEÇİCİ HARİTASI
       (Kullanıcının Hiçbir Şey Öğretmesine Gerek Kalmadan Sıfır Konfigürasyonla Çalışır)
       ============================================================ */
    var VARSAYILAN_TELERIK_HARITASI = {
        // 1. Ana Ekran Sekmeleri
        kalfalikSekme: '#btnKalfalik, #tabKalfalik, input[value*="Kalfalık"], a[href*="Kalfalik"], button[id*="Kalfalik"], .kalfalik-tab, #ctl00_cphGovde_btnKalfalik, #ctl00_cphGovde_tabKalfalik',
        ustalikSekme: '#btnUstalik, #tabUstalik, input[value*="Ustalık"], a[href*="Ustalik"], button[id*="Ustalik"], .ustalik-tab, #ctl00_cphGovde_btnUstalik, #ctl00_cphGovde_tabUstalik',
        pedagojiSekme: '#btnPedagoji, #tabPedagoji, input[value*="Pedagoji"], a[href*="Pedagoji"], button[id*="Pedagoji"], input[value*="Usta Öğretici"], #tabUstaOgretici, #ctl00_cphGovde_btnPedagoji',
        
        // 2. Yeni Kayıt Butonu
        yeniKayitBtn: '#btnYeniKayit, #btnYeni, input[id*="YeniKayit"], input[id*="btnYeni"], button[id*="btnYeni"], a[id*="btnYeni"], #ctl00_cphGovde_btnYeniKayit, #ctl00_cphGovde_btnYeni',
        
        // 3. Öğrenim Yılı (Telerik cmbOgrenimYili)
        ogrenimYili: '#cmbOgrenimYili_Input, #ctl00_cphGovde_cmbOgrenimYili_Input, input[id*="cmbOgrenimYili"], select[id*="OgrenimYili"], select[name*="OgrenimYili"], #cmbOgrenimYili, #ctl00_cphGovde_cmbOgrenimYili',
        
        // 4. TC Kimlik No
        tc: '#txtKimlikNo, #txtTCKimlikNo, #txtTC, input[id*="KimlikNo"], input[id*="txtTC"], #ctl00_cphGovde_txtKimlikNo, #ctl00_cphGovde_txtTCKimlikNo',
        
        // 5. Doğum Tarihi (Telerik RadDatePicker dtDogumTarihi)
        dogumTarihi: '#dtDogumTarihi_dateInput, #dtDogumTarihi, #txtDogumTarihi, input[id*="DogumTarih"], input[name*="DogumTarih"], #ctl00_cphGovde_dtDogumTarihi_dateInput, #ctl00_cphGovde_dtDogumTarihi',
        
        // 6. MERNİS Sorgula Butonu
        sorgulaBtn: '#btnSorgula, #btnMernis, input[id*="btnSorgula"], button[id*="btnSorgula"], input[value="Sorgula"], #ctl00_cphGovde_btnSorgula, #ctl00_cphGovde_btnMernis',
        
        // 7. Kapsam Maddesi (Telerik cmbKapsam / Select)
        kapsam: '#cmbKapsam_Input, #ddlKapsam, select[id*="Kapsam"], input[id*="cmbKapsam"], #ctl00_cphGovde_cmbKapsam_Input, #ctl00_cphGovde_cmbKapsam',
        
        // 8. İletişim Bilgileri (E-posta & Telefon)
        eposta: '#txtEposta, #txtEmail, input[id*="Eposta"], input[id*="Email"], #ctl00_cphGovde_txtEposta, #ctl00_cphGovde_txtEmail',
        telefon: '#txtCepTel, #txtTelefon, input[id*="Telefon"], input[id*="CepTel"], #ctl00_cphGovde_txtCepTel, #ctl00_cphGovde_txtTelefon',
        
        // 9. Mezuniyet & Belge Bilgileri (Telerik cmbMezuniyet & cmbBelge)
        enSonMezuniyet: '#cmbMezuniyet_Input, #ddlMezuniyet, select[id*="Mezuniyet"], input[id*="cmbMezuniyet"], #ctl00_cphGovde_cmbMezuniyet_Input, #ctl00_cphGovde_cmbMezuniyet',
        getirdigiBelge: '#cmbBelge_Input, #ddlBelge, select[id*="Belge"], input[id*="cmbBelge"], #ctl00_cphGovde_cmbBelge_Input, #ctl00_cphGovde_cmbBelge',
        
        // 10. Belge Tarihi (Telerik RadDatePicker dtpBelgeTarihi)
        belgeTarihi: '#dtpBelgeTarihi_dateInput, #dtpBelgeTarihi, #dtBelgeTarihi_dateInput, input[id*="BelgeTarih"], input[name*="BelgeTarih"], #ctl00_cphGovde_dtpBelgeTarihi_dateInput, #ctl00_cphGovde_dtpBelgeTarihi',
        
        // 11. Mesleki Alan & Dal (Telerik cmbAlan & cmbDal)
        alan: '#cmbAlan_Input, #ctl00_cphGovde_cmbAlan_Input, input[id*="cmbAlan"], select[id*="cmbAlan"], select[id*="ddlAlan"], #cmbAlan, #ctl00_cphGovde_cmbAlan',
        dal: '#cmbDal_Input, #ctl00_cphGovde_cmbDal_Input, input[id*="cmbDal"], select[id*="cmbDal"], select[id*="ddlDal"], #cmbDal, #ctl00_cphGovde_cmbDal',
        
        // 12. Kaydet Butonu
        kaydetBtn: '#btnKaydet, #btnOnKayitKaydet, input[id*="btnKaydet"], button[id*="btnKaydet"], input[value="Kaydet"], #ctl00_cphGovde_btnKaydet, #ctl00_cphGovde_btnOnKayitKaydet'
    };
    
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
        var kayitliEslemeler = localStorage.getItem(STORAGE_ESLEME_ANAHTARI) ||
                               localStorage.getItem("mesem_ogretilmis_alanlar_v7") ||
                               localStorage.getItem("mesem_ogretilmis_alanlar_v6") ||
                               localStorage.getItem("mesem_ogretilmis_alanlar_v5");
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
        { id: 'ogrenimYili', ad: 'Öğrenim Yılı (Telerik cmbOgrenimYili)', tip: 'select', grup: 'POPUP', aciklama: 'Örn: cmbOgrenimYili_Input (2026-2027 I. Dönem)' },
        { id: 'tc', ad: 'T.C. Kimlik No', tip: 'input', grup: 'POPUP', aciklama: 'Aday TC Kimlik No giriş kutusu (txtKimlikNo)' },
        { id: 'dogumTarihi', ad: 'Doğum Tarihi (RadDatePicker)', tip: 'input', grup: 'POPUP', aciklama: 'Aday doğum tarihi kutusu (dtDogumTarihi)' },
        { id: 'sorgulaBtn', ad: '"Sorgula" Butonu', tip: 'buton', grup: 'POPUP', aciklama: 'MERNİS kimlik sorgulama butonu (btnSorgula)' },
        { id: 'kapsam', ad: 'Kapsam Maddesi (cmbKapsam)', tip: 'select', grup: 'POPUP', aciklama: '35. Madde / 31. Madde kapsam seçimi' },
        { id: 'eposta', ad: 'E-posta (txtEposta)', tip: 'input', grup: 'POPUP', aciklama: 'Aday e-posta iletişim kutusu' },
        { id: 'telefon', ad: 'Telefon (txtCepTel)', tip: 'input', grup: 'POPUP', aciklama: 'Aday cep telefonu iletişim kutusu (+90 maskeli)' },
        { id: 'enSonMezuniyet', ad: 'En Son Mezuniyeti (cmbMezuniyet)', tip: 'select', grup: 'POPUP', aciklama: 'Öğrenim / Mezuniyet durumu seçimi' },
        { id: 'getirdigiBelge', ad: 'Getirdiği Belge (cmbBelge)', tip: 'select', grup: 'POPUP', aciklama: 'Diploma / Tastikname belge seçimi' },
        { id: 'belgeTarihi', ad: 'Belge Tarihi (RadDatePicker)', tip: 'input', grup: 'POPUP', aciklama: 'Telerik RadDatePicker (dtpBelgeTarihi)' },
        { id: 'alan', ad: 'Alan Seçimi (Telerik cmbAlan)', tip: 'select', grup: 'POPUP', aciklama: 'Telerik cmbAlan_Input / Mesleki alan seçimi' },
        { id: 'dal', ad: 'Dal Seçimi (Telerik cmbDal)', tip: 'select', grup: 'POPUP', aciklama: 'Telerik cmbDal_Input / Mesleki dal seçimi' },
        { id: 'kaydetBtn', ad: '"Kaydet" Butonu', tip: 'buton', grup: 'POPUP', aciklama: 'Aday kaydını tamamlayan ana buton (btnKaydet)' }
    ];

    // UI Bileşenleri Referansları
    var panel, listeKutusu, durumYazi, sayacKutusu, btnToplu, btnManuelOnay, dosyaGirdi, profilDosyaGirdi;
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
                break;
            }
        }

        await bekle(350);
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

    /**
     * Akıllı Alan Bulucu (Önce Özel Eşlemeler, Ardından Yerleşik Sabitlenmiş Telerik Profili)
     */
    function ogretilmisAlanBul(alanId) {
        var belgeler = tumBelgeleriGetir();

        // 1. Kullanıcı Tarafından Öğretilmiş Özel Seçici
        if (ozelEslemeler && ozelEslemeler[alanId]) {
            var selector = ozelEslemeler[alanId];
            for (var i = 0; i < belgeler.length; i++) {
                try {
                    var bulunan = belgeler[i].querySelector(selector);
                    if (bulunan) return bulunan;
                } catch (e) { }
            }
        }

        // 2. Yerleşik Sabitlenmiş Telerik Profili (Default Presets)
        var varsayilanSeciciler = VARSAYILAN_TELERIK_HARITASI[alanId];
        if (varsayilanSeciciler) {
            var seciciListesi = varsayilanSeciciler.split(',').map(function (s) { return s.trim(); });
            for (var b = 0; b < belgeler.length; b++) {
                var doc = belgeler[b];
                for (var sIdx = 0; sIdx < seciciListesi.length; sIdx++) {
                    var s = seciciListesi[sIdx];
                    if (!s) continue;
                    try {
                        var elBulunan = doc.querySelector(s);
                        if (elBulunan) return elBulunan;
                    } catch (e) { }
                }
            }
        }

        return null;
    }

    /* Evrensel Metinle Eleman Bulucu */
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

    /* Evrensel Input / Select / Telerik RadComboBox Bulucu */
    function evrenselInputBul(anahtarListesi, hedefDoc) {
        var arananlar = anahtarListesi.map(trTemizle);
        var belgeler = hedefDoc ? [hedefDoc] : tumBelgeleriGetir();

        for (var b = 0; b < belgeler.length; b++) {
            var doc = belgeler[b];
            var inputs = Array.prototype.slice.call(doc.querySelectorAll('input, select, textarea, div[role="combobox"], span.select2, div.dx-dropdowneditor, .RadComboBox, input.rcbInput, .RadPicker, input.riTextBox'));

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
       TELERIK RADCOMBOBOX CLIENT-SIDE JAVASCRIPT & DOM SÜRÜCÜSÜ
       ============================================================ */

    function telerikComboNesnesiBul(hedefElVeyaId) {
        if (!hedefElVeyaId) return null;
        var comboId = '';
        if (typeof hedefElVeyaId === 'string') {
            comboId = hedefElVeyaId.replace(/_Input$/, '').replace(/_DropDown$/, '').replace(/_Arrow$/, '').replace(/_ClientState$/, '');
        } else if (hedefElVeyaId.id) {
            comboId = hedefElVeyaId.id.replace(/_Input$/, '').replace(/_DropDown$/, '').replace(/_Arrow$/, '').replace(/_ClientState$/, '');
        } else if (hedefElVeyaId.name) {
            comboId = hedefElVeyaId.name;
        }

        var belgeler = tumBelgeleriGetir();
        for (var b = 0; b < belgeler.length; b++) {
            try {
                var doc = belgeler[b];
                var win = doc.defaultView || doc.parentWindow || window;
                if (!win) continue;

                // 1. window.$find(comboId)
                if (typeof win.$find === 'function') {
                    var c = win.$find(comboId);
                    if (c && typeof c.get_items === 'function') return { combo: c, win: win, doc: doc, comboId: comboId };
                }

                // 2. window.$telerik.findControl
                if (win.$telerik && typeof win.$telerik.findControl === 'function') {
                    var c2 = win.$telerik.findControl(doc, comboId);
                    if (c2 && typeof c2.get_items === 'function') return { combo: c2, win: win, doc: doc, comboId: comboId };
                }

                // 3. ID sonu ile eşleşen $find taraması (ASP.NET MasterPage önekleri: ctl00_cphGovde_cmb...)
                if (typeof win.$find === 'function' && doc.querySelectorAll) {
                    var olasiInputlar = doc.querySelectorAll('input[id$="' + comboId + '_Input"], input[id*="' + comboId + '"]');
                    for (var k = 0; k < olasiInputlar.length; k++) {
                        var gercekId = olasiInputlar[k].id.replace(/_Input$/, '');
                        var c3 = win.$find(gercekId);
                        if (c3 && typeof c3.get_items === 'function') return { combo: c3, win: win, doc: doc, comboId: gercekId };
                    }
                }
            } catch (e) { }
        }
        return null;
    }

    function telerikDropDownBul(hedefElVeyaId) {
        var comboId = '';
        if (typeof hedefElVeyaId === 'string') {
            comboId = hedefElVeyaId.replace(/_Input$/, '').replace(/_DropDown$/, '').replace(/_Arrow$/, '');
        } else if (hedefElVeyaId && hedefElVeyaId.id) {
            comboId = hedefElVeyaId.id.replace(/_Input$/, '').replace(/_DropDown$/, '').replace(/_Arrow$/, '');
        }

        var belgeler = tumBelgeleriGetir();
        for (var b = 0; b < belgeler.length; b++) {
            try {
                var doc = belgeler[b];
                if (comboId) {
                    var dd = doc.querySelector('#' + CSS.escape(comboId + '_DropDown')) ||
                             doc.querySelector('[id$="' + CSS.escape(comboId) + '_DropDown"]');
                    if (dd) return { dropDown: dd, doc: doc };
                }
                var allDds = doc.querySelectorAll('.RadComboBoxDropDown, .rcbSlide');
                for (var j = 0; j < allDds.length; j++) {
                    var dEl = allDds[j];
                    if (comboId && dEl.id && dEl.id.indexOf(comboId) !== -1) {
                        return { dropDown: dEl, doc: doc };
                    }
                }
            } catch (e) { }
        }
        return null;
    }

    /* ---------------- 4 DÖNEMLİ ÖĞRENİM YILI PARSER YARDIMCISI ---------------- */
    function donemNumarasiCikar(metin) {
        var s = kanonikMetin(metin);
        if (s.indexOf('ivdonem') !== -1 || s.indexOf('4donem') !== -1 || s.indexOf('4') !== -1 || s.indexOf('iv') !== -1 || s.indexOf('dort') !== -1) return 4;
        if (s.indexOf('iiidonem') !== -1 || s.indexOf('3donem') !== -1 || s.indexOf('3') !== -1 || s.indexOf('iii') !== -1 || s.indexOf('uc') !== -1) return 3;
        if (s.indexOf('iidonem') !== -1 || s.indexOf('2donem') !== -1 || s.indexOf('2') !== -1 || s.indexOf('ii') !== -1 || s.indexOf('iki') !== -1) return 2;
        if (s.indexOf('idonem') !== -1 || s.indexOf('1donem') !== -1 || s.indexOf('1') !== -1 || s.indexOf('i') !== -1 || s.indexOf('bir') !== -1) return 1;
        return 1;
    }

    /**
     * TELERİK RADCOMBOBOX GARANTİLİ SEÇİM MOTORU (4 Dönem Öğrenim Yılı & Alan/Dal Entegre)
     */
    async function telerikRadComboBoxSec(hedefEl, arananMetin, tetiklePostBack) {
        if (!hedefEl) return false;
        var aranan = String(arananMetin != null ? arananMetin : '').trim();
        if (!aranan) return false;
        var kAranan = kanonikMetin(aranan);
        if (!kAranan) return false;

        var doc = hedefEl.ownerDocument || document;
        var win = doc.defaultView || window;
        var comboId = (hedefEl.id || '').replace(/_Input$/, '').replace(/_DropDown$/, '').replace(/_Arrow$/, '').replace(/_ClientState$/, '');
        if (!comboId && hedefEl.name) comboId = hedefEl.name;

        logEkle('⚡ Telerik RadComboBox motoru devrede: [' + (comboId || 'RadComboBox') + '] -> "' + aranan + '"', 'islem');

        // YÖNTEM 1: Telerik Client-Side JavaScript API ($find / $telerik)
        var telerikObj = telerikComboNesnesiBul(hedefEl);
        if (telerikObj && telerikObj.combo) {
            var combo = telerikObj.combo;
            var cWin = telerikObj.win || win;
            var cDoc = telerikObj.doc || doc;
            var cId = telerikObj.comboId || comboId;

            if (typeof combo.get_items === 'function') {
                var items = combo.get_items();
                var count = items.get_count();
                var hedefItem = null;

                // 1. Öncelik: Tam Kanonik Eşleşme
                for (var i = 0; i < count; i++) {
                    var item = items.getItem(i);
                    var itText = kanonikMetin(item.get_text());
                    var itVal = kanonikMetin(item.get_value());
                    if (itText === kAranan || itVal === kAranan) {
                        hedefItem = item;
                        break;
                    }
                }

                // 2. Öncelik: Kelime / Başlangıç Eşleşmesi
                if (!hedefItem) {
                    for (var sIdx = 0; sIdx < count; sIdx++) {
                        var itS = items.getItem(sIdx);
                        var sText = kanonikMetin(itS.get_text());
                        var sVal = kanonikMetin(itS.get_value());
                        if (sText && sText.indexOf('seciniz') === -1 && sText.indexOf('lutfen') === -1) {
                            if (sText.startsWith(kAranan) || (sVal && sVal.startsWith(kAranan))) {
                                hedefItem = itS;
                                break;
                            }
                        }
                    }
                }

                // 3. Öncelik: 4 Dönemli Öğrenim Yılı Eşleşmesi
                if (!hedefItem) {
                    var yillar = aranan.match(/\d{4}/g) || [];
                    if (yillar.length > 0) {
                        var arananDonemNo = donemNumarasiCikar(aranan);
                        for (var j = 0; j < count; j++) {
                            var it2 = items.getItem(j);
                            var t2 = kanonikMetin(it2.get_text());
                            var v2 = kanonikMetin(it2.get_value());
                            var yilUyumu = yillar.some(function (y) { return t2.indexOf(y) !== -1 || v2.indexOf(y) !== -1; });
                            if (yilUyumu) {
                                var itemDonemNo = donemNumarasiCikar(it2.get_text() + ' ' + it2.get_value());
                                if (itemDonemNo === arananDonemNo) {
                                    hedefItem = it2;
                                    break;
                                }
                            }
                        }
                    }
                }

                // 4. Öncelik: İçerme (Includes) Eşleşmesi
                if (!hedefItem && kAranan.length > 2) {
                    for (var m = 0; m < count; m++) {
                        var it3 = items.getItem(m);
                        var t3 = kanonikMetin(it3.get_text());
                        var v3 = kanonikMetin(it3.get_value());
                        if (t3 && t3.indexOf('seciniz') === -1 && t3.indexOf('lutfen') === -1) {
                            if ((t3 && (t3.indexOf(kAranan) !== -1 || kAranan.indexOf(t3) !== -1)) ||
                                (v3 && (v3.indexOf(kAranan) !== -1 || kAranan.indexOf(v3) !== -1))) {
                                hedefItem = it3;
                                break;
                            }
                        }
                    }
                }

                if (hedefItem) {
                    try {
                        hedefItem.select();
                        combo.set_text(hedefItem.get_text());
                        combo.set_value(hedefItem.get_value());
                        if (typeof combo.commitChanges === 'function') combo.commitChanges();
                        if (typeof combo.hideDropDown === 'function') combo.hideDropDown();

                        var inputDom = (typeof combo.get_inputDomElement === 'function' && combo.get_inputDomElement()) ||
                                       cDoc.getElementById(cId + '_Input') ||
                                       hedefEl;
                        if (inputDom) {
                            inputDom.value = hedefItem.get_text();
                            inputDom.dispatchEvent(new Event('input', { bubbles: true }));
                            inputDom.dispatchEvent(new Event('change', { bubbles: true }));
                        }

                        var autoPostBack = (typeof combo.get_autoPostBack === 'function' && combo.get_autoPostBack());
                        if ((tetiklePostBack || autoPostBack) && typeof cWin.__doPostBack === 'function') {
                            cWin.__doPostBack(cId, '');
                        }

                        logEkle('✓ Telerik RadComboBox API ($find) ile seçildi: ' + hedefItem.get_text(), 'basari');
                        return true;
                    } catch (apiErr) {
                        logEkle('Telerik API seçim çağrısında hata: ' + apiErr.message + ', DOM simülasyonuna geçiliyor...', 'uyari');
                    }
                }
            }
        }

        // YÖNTEM 2: Telerik DOM & DropDown Simülasyonu
        try {
            var cId2 = comboId;
            var inputEl = doc.getElementById(cId2 + '_Input') || hedefEl;
            var arrowEl = doc.getElementById(cId2 + '_Arrow') ||
                          (inputEl.parentElement ? inputEl.parentElement.querySelector('.rcbArrowCell, .rcbArrowCellRight, a.rcbArrowCell') : null);

            if (telerikObj && telerikObj.combo && typeof telerikObj.combo.showDropDown === 'function') {
                try { telerikObj.combo.showDropDown(); } catch (e) { }
            }
            if (arrowEl) {
                try { arrowEl.click(); } catch (e) { }
            } else if (inputEl) {
                try { inputEl.focus(); inputEl.click(); } catch (e) { }
            }
            await bekle(220);

            var ddObj = telerikDropDownBul(cId2 || hedefEl);
            var dropDownDiv = ddObj ? ddObj.dropDown : (doc.getElementById(cId2 + '_DropDown') || doc.querySelector('.RadComboBoxDropDown'));
            var targetDoc = ddObj ? ddObj.doc : doc;

            var liItems = [];
            if (dropDownDiv) {
                liItems = Array.prototype.slice.call(dropDownDiv.querySelectorAll('ul.rcbList > li.rcbItem, ul.rcbList > li, li.rcbItem, li.rcbHovered, li'));
            }
            if (!liItems.length) {
                var belgeler = tumBelgeleriGetir();
                for (var bIdx = 0; bIdx < belgeler.length; bIdx++) {
                    var d = belgeler[bIdx];
                    var acikListeler = d.querySelectorAll('.RadComboBoxDropDown ul.rcbList > li, .rcbSlide ul.rcbList > li, ul.rcbList > li');
                    if (acikListeler.length) {
                        liItems = Array.prototype.slice.call(acikListeler);
                        targetDoc = d;
                        break;
                    }
                }
            }

            if (liItems.length > 0) {
                var secilenLi = null;

                // 1. Tam Eşleşme
                for (var liIdx = 0; liIdx < liItems.length; liIdx++) {
                    var li = liItems[liIdx];
                    var lText = kanonikMetin(li.textContent);
                    var lVal = kanonikMetin(li.getAttribute('data-value') || li.value || '');
                    if (lText === kAranan || lVal === kAranan) {
                        secilenLi = li;
                        break;
                    }
                }

                // 2. 4 Dönem Öğrenim Yılı Eşleşmesi
                if (!secilenLi) {
                    var yillar2 = aranan.match(/\d{4}/g) || [];
                    if (yillar2.length > 0) {
                        var arananDonem2 = donemNumarasiCikar(aranan);
                        for (var liJ = 0; liJ < liItems.length; liJ++) {
                            var li2 = liItems[liJ];
                            var lt2 = kanonikMetin(li2.textContent);
                            var yilUyumu2 = yillar2.some(function (y) { return lt2.indexOf(y) !== -1; });
                            if (yilUyumu2) {
                                var itemDonem2 = donemNumarasiCikar(li2.textContent);
                                if (itemDonem2 === arananDonem2) {
                                    secilenLi = li2;
                                    break;
                                }
                            }
                        }
                    }
                }

                // 3. Başlangıç / Kelime
                if (!secilenLi) {
                    for (var liS = 0; liS < liItems.length; liS++) {
                        var liSw = liItems[liS];
                        var ltSw = kanonikMetin(liSw.textContent);
                        var lvSw = kanonikMetin(liSw.getAttribute('data-value') || liSw.value || '');
                        if (ltSw && ltSw.indexOf('seciniz') === -1 && ltSw.indexOf('lutfen') === -1) {
                            if (ltSw.startsWith(kAranan) || (lvSw && lvSw.startsWith(kAranan))) {
                                secilenLi = liSw;
                                break;
                            }
                        }
                    }
                }

                // 4. İçerme (Includes)
                if (!secilenLi && kAranan.length > 2) {
                    for (var liM = 0; liM < liItems.length; liM++) {
                        var li3 = liItems[liM];
                        var lt3 = kanonikMetin(li3.textContent);
                        if (lt3 && lt3.indexOf('seciniz') === -1 && lt3.indexOf('lutfen') === -1) {
                            if (lt3.indexOf(kAranan) !== -1 || kAranan.indexOf(lt3) !== -1) {
                                secilenLi = li3;
                                break;
                            }
                        }
                    }
                }

                if (secilenLi) {
                    vurgula(secilenLi, '#22c55e');
                    var secilenMetin = secilenLi.textContent.trim();

                    secilenLi.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                    secilenLi.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    secilenLi.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    secilenLi.click();
                    secilenLi.dispatchEvent(new Event('change', { bubbles: true }));

                    if (inputEl) {
                        inputEl.value = secilenMetin;
                        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                        inputEl.dispatchEvent(new Event('blur', { bubbles: true }));
                    }

                    if (tetiklePostBack && win.__doPostBack && cId2) {
                        win.__doPostBack(cId2, '');
                    }

                    logEkle('✓ Telerik RadComboBox DropDown DOM simülasyonu ile seçildi: ' + secilenMetin, 'basari');
                    await bekle(200);
                    return true;
                }
            }
        } catch (domErr) {
            logEkle('Telerik DropDown DOM simülasyonunda hata: ' + domErr.message, 'uyari');
        }

        logEkle('❌ Telerik RadComboBox içinde eşleşen seçenek bulunamadı: "' + aranan + '"', 'uyari');
        return false;
    }

    /* ============================================================
       TELERIK RADDATEPICKER CLIENT-SIDE JAVASCRIPT & DOM SÜRÜCÜSÜ
       ============================================================ */

    /**
     * Telerik RadDatePicker ($find) kontrol nesnesini bulur.
     */
    function telerikDatePickerNesnesiBul(hedefElVeyaId) {
        if (!hedefElVeyaId) return null;
        var pickerId = '';
        if (typeof hedefElVeyaId === 'string') {
            pickerId = hedefElVeyaId.replace(/_dateInput$/, '').replace(/_wrapper$/, '').replace(/_popupButton$/, '');
        } else if (hedefElVeyaId.id) {
            pickerId = hedefElVeyaId.id.replace(/_dateInput$/, '').replace(/_wrapper$/, '').replace(/_popupButton$/, '');
        } else if (hedefElVeyaId.name) {
            pickerId = hedefElVeyaId.name;
        }

        var belgeler = tumBelgeleriGetir();
        for (var b = 0; b < belgeler.length; b++) {
            try {
                var doc = belgeler[b];
                var win = doc.defaultView || doc.parentWindow || window;
                if (!win) continue;

                // 1. $find(pickerId)
                if (typeof win.$find === 'function') {
                    var p = win.$find(pickerId);
                    if (p && (typeof p.set_selectedDate === 'function' || typeof p.get_dateInput === 'function')) {
                        return { picker: p, win: win, doc: doc, pickerId: pickerId };
                    }
                }

                // 2. $telerik.findControl
                if (win.$telerik && typeof win.$telerik.findControl === 'function') {
                    var p2 = win.$telerik.findControl(doc, pickerId);
                    if (p2 && (typeof p2.set_selectedDate === 'function' || typeof p2.get_dateInput === 'function')) {
                        return { picker: p2, win: win, doc: doc, pickerId: pickerId };
                    }
                }

                // 3. ID sonu ile arama
                if (typeof win.$find === 'function' && doc.querySelectorAll) {
                    var olasiInputlar = doc.querySelectorAll('input[id$="' + pickerId + '_dateInput"], input[id*="' + pickerId + '"]');
                    for (var k = 0; k < olasiInputlar.length; k++) {
                        var gercekId = olasiInputlar[k].id.replace(/_dateInput$/, '');
                        var p3 = win.$find(gercekId);
                        if (p3 && (typeof p3.set_selectedDate === 'function' || typeof p3.get_dateInput === 'function')) {
                            return { picker: p3, win: win, doc: doc, pickerId: gercekId };
                        }
                    }
                }
            } catch (e) { }
        }
        return null;
    }

    /**
     * Telerik RadDatePicker Kontrolüne Tarih Yazar ($find API + GG.AA.YYYY Klavye Simülasyonu)
     */
    async function telerikRadDatePickerYaz(hedefElVeyaId, tarihDeger) {
        if (!hedefElVeyaId || !tarihDeger) return false;

        var strTarih = String(tarihDeger).trim();
        var gun = '', ay = '', yil = '';

        if (/^\d{4}-\d{2}-\d{2}$/.test(strTarih)) {
            var parts = strTarih.split('-');
            yil = parts[0]; ay = parts[1]; gun = parts[2];
        } else if (/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.test(strTarih)) {
            var m = strTarih.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
            gun = m[1].padStart(2, '0'); ay = m[2].padStart(2, '0'); yil = m[3];
        }

        var trFormat = (gun && ay && yil) ? (gun + '.' + ay + '.' + yil) : strTarih;

        // 1. Telerik RadDatePicker JS API ($find)
        var pickerObj = telerikDatePickerNesnesiBul(hedefElVeyaId);
        if (pickerObj && pickerObj.picker) {
            try {
                var p = pickerObj.picker;
                if (gun && ay && yil) {
                    var jsDate = new Date(Number(yil), Number(ay) - 1, Number(gun));
                    if (typeof p.set_selectedDate === 'function') {
                        p.set_selectedDate(jsDate);
                    }
                }
                var dInput = (typeof p.get_dateInput === 'function' && p.get_dateInput());
                if (dInput && typeof dInput.set_value === 'function') {
                    dInput.set_value(trFormat);
                }
                logEkle('✓ Telerik RadDatePicker API ($find) ile tarih yazıldı: ' + trFormat, 'basari');
            } catch (e) {
                logEkle('Telerik DatePicker API yazımında uyarı: ' + e.message, 'uyari');
            }
        }

        // 2. DOM Input ve Klavye Simülasyonu
        var inputEl = null;
        if (typeof hedefElVeyaId === 'string') {
            var belgeler = tumBelgeleriGetir();
            for (var b = 0; b < belgeler.length; b++) {
                try {
                    inputEl = belgeler[b].querySelector(hedefElVeyaId) ||
                              belgeler[b].getElementById(hedefElVeyaId) ||
                              belgeler[b].getElementById(hedefElVeyaId + '_dateInput');
                    if (inputEl) break;
                } catch (e) { }
            }
        } else {
            inputEl = hedefElVeyaId;
        }

        if (inputEl) {
            try {
                inputEl.focus();
                inputEl.value = trFormat;
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                inputEl.dispatchEvent(new Event('blur', { bubbles: true }));
                inputEl.blur();
                vurgula(inputEl, '#22c55e');
                return true;
            } catch (err) { }
        }

        return !!pickerObj;
    }

    /* ============================================================
       EVRENSEL ÇOK KATMANLI SEÇİM MOTORU
       ============================================================ */

    async function evrenselSecimYap(hedefEl, arananMetin, tetiklePostBack) {
        if (!hedefEl) return false;
        var aranan = String(arananMetin != null ? arananMetin : '').trim();
        if (!aranan) return false;

        var kAranan = kanonikMetin(aranan);
        var doc = hedefEl.ownerDocument || document;
        var win = doc.defaultView || window;

        // DURUM 0: Telerik RadComboBox
        var isTelerik = false;
        if (hedefEl.classList && (hedefEl.classList.contains('rcbInput') || hedefEl.classList.contains('RadComboBox') || hedefEl.classList.contains('radPreventDecorate'))) {
            isTelerik = true;
        }
        if (hedefEl.id && (hedefEl.id.indexOf('cmb') !== -1 || hedefEl.id.indexOf('_Input') !== -1 || hedefEl.id.indexOf('rcb') !== -1)) {
            isTelerik = true;
        }
        if (hedefEl.closest && hedefEl.closest('.RadComboBox, .RadComboBoxDropDown')) {
            isTelerik = true;
        }
        if (telerikComboNesnesiBul(hedefEl)) {
            isTelerik = true;
        }

        if (isTelerik) {
            var telerikSonuc = await telerikRadComboBoxSec(hedefEl, arananMetin, tetiklePostBack);
            if (telerikSonuc) return true;
        }

        // DURUM A: Standart <select>
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

            // 2. 4 Dönemli Öğrenim Yılı Eşleşmesi
            if (secilenIndex === -1) {
                var yillar = aranan.match(/\d{4}/g) || [];
                if (yillar.length > 0) {
                    var arananDonemSelect = donemNumarasiCikar(aranan);
                    for (var j = 0; j < options.length; j++) {
                        var o = options[j];
                        var optText = kanonikMetin(o.textContent);
                        var optVal = kanonikMetin(o.value);
                        var yilUyumu = yillar.some(function (y) { return optText.indexOf(y) !== -1 || optVal.indexOf(y) !== -1; });
                        if (yilUyumu) {
                            var itemDonemSelect = donemNumarasiCikar(o.textContent + ' ' + o.value);
                            if (itemDonemSelect === arananDonemSelect) {
                                secilenIndex = j;
                                break;
                            }
                        }
                    }
                }
            }

            // 3. Başlangıç / Kelime
            if (secilenIndex === -1) {
                for (var sIdx = 0; sIdx < options.length; sIdx++) {
                    var optS = options[sIdx];
                    var kOptS = kanonikMetin(optS.textContent);
                    var kValS = kanonikMetin(optS.value);
                    if (kOptS && kOptS.indexOf('seciniz') === -1 && kOptS.indexOf('lutfen') === -1) {
                        if (kOptS.startsWith(kAranan) || (kValS && kValS.startsWith(kAranan))) {
                            secilenIndex = sIdx;
                            break;
                        }
                    }
                }
            }

            // 4. İçerme (Includes)
            if (secilenIndex === -1 && kAranan.length > 2) {
                for (var m = 0; m < options.length; m++) {
                    var o2 = options[m];
                    var optText2 = kanonikMetin(o2.textContent);
                    var optVal2 = kanonikMetin(o2.value);
                    if (optText2 && optText2.indexOf('seciniz') === -1 && optText2.indexOf('lutfen') === -1) {
                        if ((optText2 && (optText2.indexOf(kAranan) !== -1 || kAranan.indexOf(optText2) !== -1)) ||
                            (optVal2 && (optVal2.indexOf(kAranan) !== -1 || kAranan.indexOf(optVal2) !== -1))) {
                            secilenIndex = m;
                            break;
                        }
                    }
                }
            }

            if (secilenIndex !== -1) {
                var seciliOpt = options[secilenIndex];
                selectEl.selectedIndex = secilenIndex;
                selectEl.value = seciliOpt.value;
                seciliOpt.selected = true;

                try {
                    selectEl.dispatchEvent(new Event('focus', { bubbles: true }));
                    selectEl.dispatchEvent(new Event('input', { bubbles: true }));
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    if (typeof selectEl.onchange === 'function') selectEl.onchange();
                    if (win.__doPostBack && selectEl.name) win.__doPostBack(selectEl.name, '');
                    if (win.jQuery) {
                        try { win.jQuery(selectEl).val(seciliOpt.value).trigger('change'); } catch (jqErr) { }
                    }
                    selectEl.dispatchEvent(new Event('blur', { bubbles: true }));
                } catch (e) { }

                logEkle('✓ Select (' + (selectEl.name || selectEl.id || 'select') + ') seçildi: ' + seciliOpt.textContent.trim(), 'basari');
                return true;
            }
        }

        // DURUM B: Input Combobox
        var inputEl = null;
        if (hedefEl.tagName && (hedefEl.tagName.toLowerCase() === 'input' || hedefEl.tagName.toLowerCase() === 'textarea')) {
            inputEl = hedefEl;
        } else if (hedefEl.querySelector) {
            inputEl = hedefEl.querySelector('input:not([type="hidden"]), textarea');
        }

        if (inputEl) {
            degerYaz(inputEl, aranan);
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

        // DURUM C: Custom Dropdown
        try {
            hedefEl.focus && hedefEl.focus();
            hedefEl.click();
            await bekle(220);

            var belgeler = tumBelgeleriGetir();
            var listeSecicileri = [
                '.select2-results__option', '.dx-list-item', '.dx-item',
                'ul.dropdown-menu > li', 'ul > li', 'div[role="option"]', 'li[role="option"]',
                '.dropdown-item', '.combobox-item', '.k-item', '.mat-option', '.ant-select-item-option-content'
            ];

            var bulunanSecenek = null;
            for (var b = 0; b < belgeler.length; b++) {
                var d = belgeler[b];
                for (var s = 0; s < listeSecicileri.length; s++) {
                    var items = d.querySelectorAll(listeSecicileri[s]);
                    for (var it = 0; it < items.length; it++) {
                        var itemEl = items[it];
                        if (itemEl.offsetParent === null && itemEl.offsetWidth === 0) continue;
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
            }
        } catch (e) {
            logEkle('Dropdown seçiminde hata: ' + e.message, 'hata');
        }

        return false;
    }

    /* ---------------- Öğrenim Yılı Seçici ---------------- */
    async function ogrenimYiliSec(hedefEl, arananDeger) {
        if (!hedefEl) return false;
        var hedef = arananDeger || '2026-2027 I. Dönem';
        return await evrenselSecimYap(hedefEl, hedef, true);
    }

    /* ---------------- Select Değer Seçici ---------------- */
    async function selectDegerSec(hedefEl, arananDeger, tetiklePostBack) {
        if (!hedefEl) return false;
        return await evrenselSecimYap(hedefEl, arananDeger, tetiklePostBack);
    }

    /* ---------------- Maskeli Telefon Girişi Simülasyonu ---------------- */
    function telefonuYaz(inputEl, hamTel) {
        if (!inputEl) return false;
        if (!hamTel) return false;

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

        for (var i = 0; i < rakamlar.length; i++) {
            var ch = rakamlar[i];
            var code = ch.charCodeAt(0);
            try {
                inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: 'Digit' + ch, keyCode: code, which: code, bubbles: true }));
                inputEl.dispatchEvent(new KeyboardEvent('keypress', { key: ch, code: 'Digit' + ch, keyCode: code, which: code, bubbles: true }));

                var eskiVal = inputEl.value;
                if (!eskiVal || eskiVal.indexOf(ch) === -1) {
                    inputEl.value = (eskiVal || '') + ch;
                }

                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: ch, code: 'Digit' + ch, keyCode: code, which: code, bubbles: true }));
            } catch (e) { }
        }

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

        // 1. SELECT
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

        if (hedef.type === 'date' && strDeger.indexOf('.') !== -1) {
            var dp = strDeger.split('.');
            if (dp.length === 3) strDeger = dp[2] + '-' + dp[1] + '-' + dp[0];
        }

        try { hedef.focus(); } catch (e) { }

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
             'ustalikSinav', 'dogrudanUstalik', 'ustaTalepTuru', 'ustaDayanakBelge', 'ustaBelgeSayisi',
             'calisma1Cesit', 'calisma1Kurum', 'calisma1Sayi', 'calisma1Baslangic', 'calisma1Bitis', 'calisma1Aciklama',
             'calisma2Cesit', 'calisma2Kurum', 'calisma2Sayi', 'calisma2Baslangic', 'calisma2Bitis', 'calisma2Aciklama',
             'calisma3Cesit', 'calisma3Kurum', 'calisma3Sayi', 'calisma3Baslangic', 'calisma3Bitis', 'calisma3Aciklama',
             'calisma4Cesit', 'calisma4Kurum', 'calisma4Sayi', 'calisma4Baslangic', 'calisma4Bitis', 'calisma4Aciklama'].forEach(function (anahtar) {
                if (k[anahtar] !== undefined && duz[anahtar] === undefined) {
                    duz[anahtar] = k[anahtar];
                }
            });
            duz.kategori = kategoriBelirle(duz);
            if (!duz.ogrenimYili) duz.ogrenimYili = '2026-2027 I. Dönem';
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

        [tabBtnKalfalik, tabBtnUstalik, tabBtnPedagoji, tabBtnTumu].forEach(function (btn) {
            if (btn) btn.style.background = '#1e293b';
        });
        if (kat === 'KALFALIK' && tabBtnKalfalik) tabBtnKalfalik.style.background = '#0284c7';
        if (kat === 'USTALIK' && tabBtnUstalik) tabBtnUstalik.style.background = '#d97706';
        if (kat === 'PEDAGOJI' && tabBtnPedagoji) tabBtnPedagoji.style.background = '#7c3aed';
        if (kat === 'TUMU' && tabBtnTumu) tabBtnTumu.style.background = '#334155';

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
       MEB E-MESEM ADIM ADIM İŞLEM FONKSİYONLARI
       ============================================================ */

    // ADIM 1: Kategori Sekmesini Seç (Kalfalık / Ustalık / Pedagoji)
    async function adim1_SekmeSec(k) {
        var kat = k.kategori;
        logEkle('1. Adım: ' + kategoriAdiTr(kat) + ' sekmesi aranıyor (Yerleşik Seçici Haritası)...', 'islem');

        var ozelSekme = null;
        if (kat === 'PEDAGOJI') ozelSekme = ogretilmisAlanBul('pedagojiSekme');
        else if (kat === 'USTALIK') ozelSekme = ogretilmisAlanBul('ustalikSekme');
        else ozelSekme = ogretilmisAlanBul('kalfalikSekme');

        if (ozelSekme) {
            vurgula(ozelSekme, '#38bdf8');
            ozelSekme.click();
            logEkle('✓ ' + kategoriAdiTr(kat) + ' sekmesi tıklandı.', 'basari');
            await postBackBitisiniBekle(3000, 'Sekme PostBack');
            return true;
        }

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
        logEkle('3. Adım: Öğrenim Yılı (4 Dönem Formatı), TC ve Doğum Tarihi giriliyor...', 'islem');

        // 3.1: Öğrenim Yılı (Telerik cmbOgrenimYili / 4 Dönem Desteği)
        var ogrenimYiliEl = ogretilmisAlanBul('ogrenimYili') || evrenselInputBul(['cmbogrenimyili', 'ogrenimyili', 'donem', 'ogretimyili', 'egitimyili', 'ddlogrenimyili']);
        if (ogrenimYiliEl) {
            var hedefYil = k.ogrenimYili || '2026-2027 I. Dönem';
            await ogrenimYiliSec(ogrenimYiliEl, hedefYil);
            vurgula(ogrenimYiliEl, '#38bdf8');
            logEkle('✓ Öğrenim Yılı seçildi: ' + hedefYil, 'islem');
        }

        // 3.2: TC Kimlik No
        var tcEl = ogretilmisAlanBul('tc') || evrenselInputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc', 'txtkimlikno']);
        if (tcEl && k.tc) {
            degerYaz(tcEl, k.tc);
            vurgula(tcEl, '#38bdf8');
            logEkle('✓ TC Kimlik No yazıldı: ' + k.tc, 'islem');
        } else {
            logEkle('Hata: TC Kimlik No kutusu bulunamadı!', 'hata');
        }

        // 3.3: Doğum Tarihi (Telerik RadDatePicker / Input)
        var dogumEl = ogretilmisAlanBul('dogumTarihi') || evrenselInputBul(['dtdogumtarihi', 'dogumtarihi', 'dogum', 'txtdogum', 'txtdogumtarihi']);
        if (dogumEl && k.dogumTarihi) {
            var dStr = k.dogumTarihi;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
                var dp = dStr.split('-');
                dStr = dp[2] + '.' + dp[1] + '.' + dp[0];
            }
            await telerikRadDatePickerYaz(dogumEl, dStr);
            degerYaz(dogumEl, dStr);
            vurgula(dogumEl, '#38bdf8');
            logEkle('✓ Doğum Tarihi yazıldı: ' + dStr, 'islem');
        }

        await bekle(300);
        return true;
    }

    // ADIM 4: Sorgula'ya Bas ve MERNİS ASP.NET PostBack Bitişini Bekle
    async function adim4_SorgulaVeMernisBekle(k) {
        logEkle('4. Adım: MERNİS Sorgula butonuna basılıyor...', 'islem');

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
            
            await postBackBitisiniBekle(mernisBeklemeSuresi + 2000, 'MERNİS AJAX PostBack');

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

            await bekle(400);
            return true;
        } else {
            logEkle('Uyarı: "Sorgula" butonu bulunamadı, MERNİS adımı atlanıyor.', 'uyari');
            return false;
        }
    }

    // ADIM 5: Kapsam, Kademeli Alan -> Dal, İletişim ve RadDatePicker Belge Tarihi
    async function adim5_KapsamVeBilgileriDoldur(k) {
        logEkle('5. Adım: MERNİS sonrası güncellenen DOM üzerinden Kapsam, İletişim, Mezuniyet, Belge Tarihi ve Alan/Dal dolduruluyor...', 'islem');
        var kat = k.kategori;

        // 5.1: Öğrenim Yılı (Telerik cmbOgrenimYili - PostBack sonrası sıfırlandıysa tekrar seç)
        var ogrenimYiliEl = ogretilmisAlanBul('ogrenimYili') || evrenselInputBul(['cmbogrenimyili', 'ogrenimyili', 'donem', 'ogretimyili', 'egitimyili', 'ddlogrenimyili']);
        if (ogrenimYiliEl) {
            var hedefYil = k.ogrenimYili || '2026-2027 I. Dönem';
            await ogrenimYiliSec(ogrenimYiliEl, hedefYil);
            vurgula(ogrenimYiliEl, '#38bdf8');
            logEkle('✓ Öğrenim Yılı doğrulandı: ' + hedefYil, 'islem');
            await bekle(250);
        }

        // 5.2: Kapsam Maddesi Seçimi (Telerik cmbKapsam / Select)
        var kapsamDeger = k.kapsam;
        if (!kapsamDeger) {
            if (kat === 'PEDAGOJI') kapsamDeger = '31. Madde';
            else if (kat === 'USTALIK') kapsamDeger = '35. Madde';
            else kapsamDeger = '35. Madde';
        }
        var kapsamEl = ogretilmisAlanBul('kapsam') || evrenselInputBul(['cmbkapsam', 'kapsam', 'madde', 'kapsamturu', 'ddlkapsam']);
        if (kapsamEl) {
            await evrenselSecimYap(kapsamEl, kapsamDeger, true);
            vurgula(kapsamEl, '#38bdf8');
            logEkle('✓ Kapsam seçildi: ' + kapsamDeger, 'islem');
            await bekle(300);
        } else {
            logEkle('Uyarı: Kapsam açılır menüsü bulunamadı!', 'uyari');
        }

        // 5.3: E-posta ve Maskeli Telefon Bilgileri
        var epostaEl = ogretilmisAlanBul('eposta') || evrenselInputBul(['txteposta', 'eposta', 'email', 'mail', 'txtemail']);
        if (epostaEl && k.eposta) {
            degerYaz(epostaEl, k.eposta);
            logEkle('E-posta yazıldı: ' + k.eposta, 'islem');
        }

        var telEl = ogretilmisAlanBul('telefon') || evrenselInputBul(['txtceptel', 'telefon', 'tel', 'cep', 'gsm', 'txttelefon', 'txtcep']);
        if (telEl && k.telefon) {
            telefonuYaz(telEl, k.telefon);
            vurgula(telEl, '#38bdf8');
            logEkle('Telefon maskeli alana yazıldı: ' + k.telefon, 'islem');
        }

        // 5.4: En Son Mezuniyeti (Telerik cmbMezuniyet / Select)
        var mezuniyetEl = ogretilmisAlanBul('enSonMezuniyet') || evrenselInputBul(['cmbmezuniyet', 'ensonmezuniyet', 'mezuniyet', 'ogrenimdurumu', 'ddlmezuniyet']);
        if (mezuniyetEl) {
            await evrenselSecimYap(mezuniyetEl, k.enSonMezuniyet || 'Lise', true);
            vurgula(mezuniyetEl, '#38bdf8');
            logEkle('✓ En Son Mezuniyet seçildi: ' + (k.enSonMezuniyet || 'Lise'), 'islem');
            await bekle(250);
        }

        // 5.5: Getirdiği Belge (Telerik cmbBelge / Select)
        var belgeEl = ogretilmisAlanBul('getirdigiBelge') || evrenselInputBul(['cmbbelge', 'getirdigibelge', 'belgeturu', 'ogrenimbelgesi', 'ddlbelge']);
        if (belgeEl) {
            var bTur = k.getirdigiBelge || 'Diploma';
            if (trTemizle(bTur).indexOf('tas') !== -1) bTur = 'Tastikname';
            await evrenselSecimYap(belgeEl, bTur, true);
            vurgula(belgeEl, '#38bdf8');
            logEkle('✓ Getirdiği Belge seçildi: ' + bTur, 'islem');
            await bekle(250);
        }

        // 5.6: Belge Tarihi (Telerik RadDatePicker dtpBelgeTarihi Desteği)
        var belgeTarihEl = ogretilmisAlanBul('belgeTarihi') || evrenselInputBul(['dtpbelgetarihi', 'belgetarihi', 'diplomatarihi', 'txtbelgetarihi', 'dtbelgetarihi']);
        if (belgeTarihEl && k.belgeTarihi) {
            var bTStr = k.belgeTarihi;
            if (/^\d{4}-\d{2}-\d{2}$/.test(bTStr)) {
                var btp = bTStr.split('-');
                bTStr = btp[2] + '.' + btp[1] + '.' + btp[0];
            }
            await telerikRadDatePickerYaz(belgeTarihEl, bTStr);
            degerYaz(belgeTarihEl, bTStr);
            vurgula(belgeTarihEl, '#38bdf8');
            logEkle('✓ Belge Tarihi (RadDatePicker / Input) yazıldı: ' + bTStr, 'basari');
        }

        // 5.7: KADEMELİ ALAN SEÇİMİ (Telerik cmbAlan Motoru)
        var alanEl = ogretilmisAlanBul('alan') || evrenselInputBul(['cmbalan', 'ddlalan', 'alan', 'alanadi', 'meslek', 'txtalan']);
        if (alanEl && k.alan) {
            logEkle('Alan seçiliyor (Telerik cmbAlan / Evrensel Motor): ' + k.alan, 'islem');
            var alanSecildi = await evrenselSecimYap(alanEl, k.alan, true);
            if (!alanSecildi) {
                var alanHata = '❌ MESLEKİ ALAN BULUNAMADI / SEÇİLEMEDİ: "' + k.alan + '"';
                logEkle(alanHata, 'hata');
                durum(alanHata, '#f87171');
                throw new Error(alanHata);
            }
            vurgula(alanEl, '#38bdf8');

            logEkle('Alan seçimi sonrası Dal RadComboBox listesinin UpdatePanel ile yüklenmesi bekleniyor...', 'islem');
            await postBackBitisiniBekle(3000, 'cmbAlan Seçimi ve Dal PostBack');
            
            var baslangicDal = Date.now();
            while (Date.now() - baslangicDal < 3500) {
                var dalObj = telerikComboNesnesiBul('cmbDal') || telerikComboNesnesiBul('ddlDal') || telerikComboNesnesiBul('dal');
                if (dalObj && dalObj.combo && typeof dalObj.combo.get_items === 'function' && dalObj.combo.get_items().get_count() > 1) {
                    logEkle('✓ Dal seçenekleri Telerik API ile yüklendi (' + dalObj.combo.get_items().get_count() + ' seçenek).', 'basari');
                    break;
                }
                var dalDd = telerikDropDownBul('cmbDal') || telerikDropDownBul('dal');
                if (dalDd && dalDd.dropDown) {
                    var liSayisi = dalDd.dropDown.querySelectorAll('li.rcbItem, li').length;
                    if (liSayisi > 1) {
                        logEkle('✓ Dal seçenekleri Telerik DropDown DOM ile yüklendi (' + liSayisi + ' seçenek).', 'basari');
                        break;
                    }
                }
                var dalSelect = evrenselInputBul(['cmbdal', 'ddldal', 'dal']);
                if (dalSelect && dalSelect.options && dalSelect.options.length > 1) {
                    logEkle('✓ Dal seçenekleri select ile yüklendi (' + dalSelect.options.length + ' seçenek).', 'basari');
                    break;
                }
                await bekle(200);
            }
        }

        // 5.8: KADEMELİ DAL SEÇİMİ (Telerik cmbDal Motoru)
        var dalEl = ogretilmisAlanBul('dal') || evrenselInputBul(['cmbdal', 'ddldal', 'dal', 'daladi', 'txtdal']);
        if (dalEl && k.dal) {
            logEkle('Dal seçiliyor (Telerik cmbDal / Evrensel Motor): ' + k.dal, 'islem');
            var dalSecildi = await evrenselSecimYap(dalEl, k.dal, true);
            if (!dalSecildi) {
                var dalHata = '❌ MESLEKİ DAL BULUNAMADI / SEÇİLEMEDİ: "' + k.dal + '"';
                logEkle(dalHata, 'hata');
                durum(dalHata, '#f87171');
                throw new Error(dalHata);
            }
            vurgula(dalEl, '#38bdf8');
            await bekle(300);
        }

        logEkle('✓ Tüm form, RadDatePicker belge tarihi ve mesleki alan/dal bilgileri başarıyla dolduruldu.', 'basari');
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
        var ogrenimYiliEl = ogretilmisAlanBul('ogrenimYili') || evrenselInputBul(['cmbogrenimyili', 'ogrenimyili', 'donem', 'ogretimyili', 'ddlogrenimyili']);
        if (ogrenimYiliEl) {
            var oyVal = ogrenimYiliEl.value ? ogrenimYiliEl.value.trim() : '';
            var oyTxt = '';
            if (ogrenimYiliEl.options && ogrenimYiliEl.selectedIndex >= 0) {
                oyTxt = trTemizle(ogrenimYiliEl.options[ogrenimYiliEl.selectedIndex].textContent);
            } else {
                oyTxt = trTemizle(oyVal);
            }
            if (!oyVal || oyTxt.indexOf('seciniz') !== -1 || oyTxt === '') {
                eksikler.push('Öğrenim Yılı');
            }
        }

        // 3. Kapsam
        var kapsamEl = ogretilmisAlanBul('kapsam') || evrenselInputBul(['kapsam', 'madde', 'kapsamturu', 'ddlkapsam']);
        if (kapsamEl) {
            var kVal = kapsamEl.value ? kapsamEl.value.trim() : '';
            var kTxt = '';
            if (kapsamEl.options && kapsamEl.selectedIndex >= 0) {
                kTxt = trTemizle(kapsamEl.options[kapsamEl.selectedIndex].textContent);
            } else {
                kTxt = trTemizle(kVal);
            }
            if (!kVal || kTxt.indexOf('seciniz') !== -1 || kTxt === '') {
                eksikler.push('Kapsam Maddesi');
            }
        }

        // 4. Alan
        var alanEl = ogretilmisAlanBul('alan') || evrenselInputBul(['cmbalan', 'ddlalan', 'alan', 'alanadi', 'meslek']);
        if (alanEl) {
            var aVal = alanEl.value ? alanEl.value.trim() : '';
            if (!aVal || trTemizle(aVal).indexOf('seciniz') !== -1) {
                eksikler.push('Mesleki Alan');
            }
        }

        // 5. Dal
        var dalEl = ogretilmisAlanBul('dal') || evrenselInputBul(['cmbdal', 'ddldal', 'dal', 'daladi']);
        if (dalEl) {
            var dVal = dalEl.value ? dalEl.value.trim() : '';
            if (!dVal || trTemizle(dVal).indexOf('seciniz') !== -1) {
                eksikler.push('Mesleki Dal');
            }
        }

        // 6. En Son Mezuniyet
        var mezuniyetEl = ogretilmisAlanBul('enSonMezuniyet') || evrenselInputBul(['ensonmezuniyet', 'mezuniyet', 'ddlmezuniyet']);
        if (mezuniyetEl) {
            var mVal = mezuniyetEl.value ? mezuniyetEl.value.trim() : '';
            var mTxt = (mezuniyetEl.options && mezuniyetEl.selectedIndex >= 0) ? trTemizle(mezuniyetEl.options[mezuniyetEl.selectedIndex].textContent) : trTemizle(mVal);
            if (!mVal || mTxt.indexOf('seciniz') !== -1 || mTxt === '') {
                eksikler.push('En Son Mezuniyet');
            }
        }

        // 7. Getirdiği Belge
        var belgeEl = ogretilmisAlanBul('getirdigiBelge') || evrenselInputBul(['getirdigibelge', 'belgeturu', 'ddlbelge']);
        if (belgeEl) {
            var bVal = belgeEl.value ? belgeEl.value.trim() : '';
            var bTxt = (belgeEl.options && belgeEl.selectedIndex >= 0) ? trTemizle(belgeEl.options[belgeEl.selectedIndex].textContent) : trTemizle(bVal);
            if (!bVal || bTxt.indexOf('seciniz') !== -1 || bTxt === '') {
                eksikler.push('Getirdiği Belge');
            }
        }

        return eksikler;
    }

    // ADIM 6: Kaydet Butonuna Bas
    async function adim6_Kaydet(k) {
        logEkle('6. Adım: Kayıt öncesi güvenlik doğrulaması yapılıyor...', 'islem');

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
       AKILLI ALAN ÖĞRETİCİ / EŞLEME MODU (SELECTOR MAPPER & PROFİL ARAÇLARI)
       ============================================================ */
    var vurguKatmani = null;
    var ogreticiRozet = null;
    var ogreticiKontrolBari = null;
    var alanOgreticiModal = null;
    var aktifOgreticiSekme = 'POPUP'; // 'ANA_EKRAN', 'POPUP', 'TUMU'

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
            infoIncele.innerHTML = '🔬 <strong>CANLI ELEMAN İNCELEME MODU:</strong> İncelemek istediğiniz MEB kutusuna (Öğrenim Yılı / Alan / Tarih vb.) tıklayın!';
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

        if (incelemeModuAktif) {
            elemaniDetayliInceleVeRaporla(hamHedef);
            elemanIncelemeModunuKapat();
            return;
        }

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
        var telerikBilgisi = null;

        var tObj = telerikComboNesnesiBul(el);
        if (tObj && tObj.combo && typeof tObj.combo.get_items === 'function') {
            var tItems = tObj.combo.get_items();
            var tCount = tItems.get_count();
            telerikBilgisi = {
                comboId: tObj.comboId,
                itemSayisi: tCount,
                items: []
            };
            for (var ti = 0; ti < Math.min(tCount, 25); ti++) {
                var itm = tItems.getItem(ti);
                telerikBilgisi.items.push({ index: ti, text: itm.get_text(), value: itm.get_value() });
                optionsList.push({ index: ti, text: itm.get_text(), value: itm.get_value() });
            }
        } else if (el.options) {
            for (var i = 0; i < el.options.length; i++) {
                var o = el.options[i];
                optionsList.push({ index: i, value: o.value, text: o.textContent.trim(), selected: o.selected });
            }
        } else if (targetEl.querySelectorAll) {
            var altOptions = targetEl.querySelectorAll('option, li.rcbItem, li, div[role="option"]');
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
                isTelerik: !!telerikBilgisi,
                telerikDetay: telerikBilgisi,
                secenekSayisi: optionsList.length,
                secenekler: optionsList.slice(0, 25),
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

        logEkle('=== 🔬 ELEMAN ANALİZ RAPORU ===', 'mor');
        logEkle('🏷️ Tag: <' + tag + '> | ID: #' + id + ' | Name: ' + name, 'mor');
        if (telerikBilgisi) {
            logEkle('⚡ TELERIK RADCOMBOBOX TESPİT EDİLDİ: [' + telerikBilgisi.comboId + '] (' + telerikBilgisi.itemSayisi + ' öğe)', 'basari');
        }
        logEkle('📌 Selector: ' + selector, 'islem');
        logEkle('📝 Değer: "' + val + '" | Sınıf: ' + cls, 'islem');
        if (optionsList.length > 0) {
            logEkle('📋 Seçenekler (' + optionsList.length + ' adet): ' + optionsList.slice(0, 5).map(function (o) { return '"' + o.text + '"'; }).join(', ') + (optionsList.length > 5 ? ' ...' : ''), 'basari');
        }

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
            logEkle('[' + (ab ? ab.ad : alanId) + '] özel eşlemesi sıfırlandı, yerleşik Telerik profiline dönüldü.', 'uyari');
            alanOgretListesiniCiz();
        }
    }

    function alanTestEtVeVurgula(alanId) {
        var el = ogretilmisAlanBul(alanId);
        var ab = OGRETILEBILIR_ALANLAR.find(function (a) { return a.id === alanId; });
        var alanAd = ab ? ab.ad : alanId;

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
        if (confirm('Tüm özel alan eşlemeleri sıfırlansın ve yerleşik Telerik profiline dönülsün mü?')) {
            ozelEslemeler = {};
            try { localStorage.removeItem(STORAGE_ESLEME_ANAHTARI); } catch (e) { }
            logEkle('Tüm özel alan eşlemeleri sıfırlandı, yerleşik varsayılan profil devrede.', 'uyari');
            durum('Yerleşik Telerik profili varsayılan yapıldı.', '#cbd5e1');
            alanOgretListesiniCiz();
        }
    }

    /* ---------------- PROFİL DIŞA / İÇE AKTAR (JSON) ---------------- */
    function profilDisaAktarJson() {
        var profilVerisi = {
            surum: SURUM,
            olusturmaTarihi: new Date().toISOString(),
            ozelEslemeler: ozelEslemeler,
            yerlesikHarita: VARSAYILAN_TELERIK_HARITASI
        };
        var jsonStr = JSON.stringify(profilVerisi, null, 2);
        var blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        var dosyaAdi = 'emesem_telerik_profil_v' + SURUM + '_' + new Date().toISOString().slice(0, 10) + '.json';
        
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = dosyaAdi;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        sesCal('basari');
        durum('✓ Telerik Eşleme Profili JSON dosyası olarak indirildi.', '#4ade80');
        logEkle('✓ E-MESEM Telerik Profili dışa aktarıldı: ' + dosyaAdi, 'basari');
    }

    function profilIceAktarJsonSecildi(e) {
        var dosya = e.target.files && e.target.files[0];
        if (!dosya) return;
        var okuyucu = new FileReader();
        okuyucu.onload = function (evt) {
            try {
                var veri = JSON.parse(evt.target.result);
                var yuklenen = veri.ozelEslemeler || veri;
                if (yuklenen && typeof yuklenen === 'object') {
                    ozelEslemeler = Object.assign({}, ozelEslemeler, yuklenen);
                    localStorage.setItem(STORAGE_ESLEME_ANAHTARI, JSON.stringify(ozelEslemeler));
                    sesCal('basari');
                    alanOgretListesiniCiz();
                    durum('✓ Telerik Eşleme Profili başarıyla içe aktarıldı!', '#4ade80');
                    logEkle('✓ Profil JSON dosyası başarıyla yüklendi ve sisteme uygulandı.', 'basari');
                } else {
                    throw new Error('Geçersiz profil formatı');
                }
            } catch (err) {
                sesCal('hata');
                durum('Hata: JSON profil dosyası okunamadı.', '#f87171');
                logEkle('Profil yükleme hatası: ' + err.message, 'hata');
            }
        };
        okuyucu.readAsText(dosya);
        try { e.target.value = ''; } catch (err) { }
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
            'width:640px', 'max-width:95vw', 'max-height:88vh',
            'background:#0f172a', 'color:#f8fafc', 'border:1px solid #3b82f6', 'border-radius:14px',
            'box-shadow:0 25px 60px -15px rgba(0,0,0,0.9)', 'z-index:2147483646',
            'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'display:none', 'flex-direction:column', 'overflow:hidden', 'font-size:12.5px'
        ].join(';'));
        alanOgreticiModal.id = 'mesemOgreticiModal';

        // Profil İçe Aktar Input
        profilDosyaGirdi = el('input');
        profilDosyaGirdi.type = 'file';
        profilDosyaGirdi.accept = '.json';
        profilDosyaGirdi.style.display = 'none';
        profilDosyaGirdi.addEventListener('change', profilIceAktarJsonSecildi);
        document.body.appendChild(profilDosyaGirdi);

        // Modal Header
        var mHeader = el('div', 'display:flex; align-items:center; gap:8px; padding:12px 16px; background:#1e293b; border-bottom:1px solid #334155; user-select:none;');
        mHeader.appendChild(el('strong', 'flex:1; font-size:14px; color:#38bdf8; display:flex; align-items:center; gap:6px;', '🎯 E-MESEM Yerleşik Telerik Haritası & Alan Öğretici (v' + SURUM + ')'));

        var mKapat = el('button', 'border:0; background:#dc2626; color:#fff; width:28px; height:28px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:15px;', '×');
        mKapat.onclick = function () { alanOgreticiModal.style.display = 'none'; };
        mHeader.appendChild(mKapat);

        // Açıklama & Hızlı İşlem Barı
        var rehberKutu = el('div', 'padding:10px 14px; background:#0b1120; border-bottom:1px solid #1e293b; line-height:1.45;');
        rehberKutu.innerHTML = '<div style="color:#e2e8f0; font-size:12px; margin-bottom:6px;">Robot, MEB sisteminin tüm bilinen <strong>Telerik RadComboBox ve RadDatePicker</strong> seçicileriyle donatılmıştır (Sıfır Konfigürasyon). İsterseniz alanları tek tek özelleştirebilir veya profili JSON olarak kaydedebilirsiniz.</div>' +
            '<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">' +
            '<button id="btnModalYeniPencereAc" style="padding:4px 8px; font-size:11px; font-weight:bold; background:#0284c7; color:#fff; border:0; border-radius:5px; cursor:pointer;">🪟 Yeni Kayıt Penceresini Aç</button>' +
            '<button id="btnModalSiraliOgret" style="padding:4px 8px; font-size:11px; font-weight:bold; background:#10b981; color:#fff; border:0; border-radius:5px; cursor:pointer;">⚡ Sırayla Tümünü Öğret</button>' +
            '<button id="btnModalProfilIndir" style="padding:4px 8px; font-size:11px; font-weight:bold; background:#8b5cf6; color:#fff; border:0; border-radius:5px; cursor:pointer;">💾 Profili Dışa Aktar (JSON)</button>' +
            '<button id="btnModalProfilYukle" style="padding:4px 8px; font-size:11px; font-weight:bold; background:#0d9488; color:#fff; border:0; border-radius:5px; cursor:pointer;">📥 Profili İçe Aktar</button>' +
            '<button id="btnModalEslemeleriSifirla" style="padding:4px 6px; font-size:10.5px; background:#475569; color:#f8fafc; border:0; border-radius:5px; cursor:pointer; margin-left:auto;">🗑️ Sıfırla</button>' +
            '</div>';

        // Modal Sekmeleri
        var mSekmeBar = el('div', 'display:flex; gap:4px; padding:6px 14px; background:#1e293b; border-bottom:1px solid #334155;');
        
        modalSekmePopupBtn = el('button', 'flex:1; padding:6px 6px; font-size:11.5px; font-weight:700; border:0; border-radius:5px; cursor:pointer; color:#fff; background:#0284c7;', '🪟 Açılır Kayıt Penceresi (13)');
        modalSekmeAnaBtn = el('button', 'flex:1; padding:6px 6px; font-size:11.5px; font-weight:700; border:0; border-radius:5px; cursor:pointer; color:#fff; background:#1e293b;', '🖥️ Ana Ekran Alanları (4)');
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
        var footerBilgi = el('span', 'font-size:11px; color:#94a3b8;', 'Yerleşik Telerik profili ve öğretilenler güvenle saklanır.');
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
        var btnPI = alanOgreticiModal.querySelector('#btnModalProfilIndir');
        if (btnPI) {
            btnPI.onclick = profilDisaAktarJson;
        }
        var btnPY = alanOgreticiModal.querySelector('#btnModalProfilYukle');
        if (btnPY) {
            btnPY.onclick = function () { if (profilDosyaGirdi) profilDosyaGirdi.click(); };
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
            var varsayilanSecici = VARSAYILAN_TELERIK_HARITASI[a.id];
            var ogretildi = !!ozelSecici;

            var satir = el('div', 'display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 10px; border-bottom:1px solid #1e293b; background:' + (idx % 2 === 0 ? 'rgba(30,41,59,0.3)' : 'transparent') + '; border-radius:6px; margin-bottom:2px;');

            var sol = el('div', 'flex:1; min-width:0;');
            var baslikSatir = el('div', 'display:flex; align-items:center; gap:6px; margin-bottom:2px;');
            baslikSatir.appendChild(el('strong', 'font-size:12px; color:#f8fafc;', a.ad));
            
            var tipRozet = el('span', 'font-size:9.5px; padding:1px 4px; border-radius:3px; background:#334155; color:#94a3b8;', a.tip);
            baslikSatir.appendChild(tipRozet);

            if (ogretildi) {
                var oRozet = el('span', 'font-size:10px; font-weight:bold; padding:1px 6px; border-radius:3px; background:rgba(34,197,94,0.2); color:#4ade80; border:1px solid #22c55e;', '✓ Özel Eşleme');
                baslikSatir.appendChild(oRozet);
            } else {
                var vRozet = el('span', 'font-size:10px; padding:1px 5px; border-radius:3px; background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid #3b82f6;', '⚡ Yerleşik Telerik Profili');
                baslikSatir.appendChild(vRozet);
            }

            var aciklamaDiv = el('div', 'font-size:10.5px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;');
            if (ozelSecici) {
                aciklamaDiv.innerHTML = '<span style="color:#fbbf24; font-family:Consolas, monospace;">Özel: ' + ozelSecici + '</span>';
            } else if (varsayilanSecici) {
                aciklamaDiv.innerHTML = '<span style="color:#94a3b8; font-family:Consolas, monospace;">Yerleşik: ' + varsayilanSecici.split(',')[0] + '</span>';
            } else {
                aciklamaDiv.textContent = a.aciklama;
            }

            sol.appendChild(baslikSatir);
            sol.appendChild(aciklamaDiv);

            // Sağ Buton Grubu
            var sag = el('div', 'display:flex; gap:4px; align-items:center;');

            var btnOgret = el('button', 'padding:4px 8px; font-size:11px; font-weight:bold; background:#10b981; color:#fff; border:0; border-radius:4px; cursor:pointer;', '🎯 Öğret');
            btnOgret.title = 'Bu alanı ekranda/modalda tıklayarak robota öğret';
            btnOgret.onclick = function () {
                ogretmeModunuBaslat(a.id, false);
            };
            sag.appendChild(btnOgret);

            var btnTest = el('button', 'padding:4px 7px; font-size:11px; font-weight:600; background:#0284c7; color:#fff; border:0; border-radius:4px; cursor:pointer;', '👁️ Test Et');
            btnTest.title = 'Bu alanın ekranda/modalda bulunup bulunmadığını test eder ve yeşil çerçeveyle parlatır';
            btnTest.onclick = function () {
                alanTestEtVeVurgula(a.id);
            };
            sag.appendChild(btnTest);

            if (ogretildi) {
                var btnSifirla = el('button', 'padding:4px 6px; font-size:11px; background:#475569; color:#f87171; border:0; border-radius:4px; cursor:pointer;', '✕');
                btnSifirla.title = 'Özel eşlemeyi silip yerleşik Telerik profiline döndür';
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
            elemanlar: []
        };

        belgeler.forEach(function (doc, docIdx) {
            var inputs = doc.querySelectorAll('input, select, textarea, button, a.btn, .RadComboBox, input.rcbInput, .RadPicker, input.riTextBox');
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
                var tObj = telerikComboNesnesiBul(el);
                var pObj = telerikDatePickerNesnesiBul(el);

                rapor.elemanlar.push({
                    docIndex: docIdx,
                    tag: etiket,
                    type: type,
                    id: id,
                    name: name,
                    class: cls,
                    value: val,
                    text: txt,
                    selector: selector,
                    isTelerikCombo: !!tObj,
                    isTelerikDatePicker: !!pObj
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
        'position:fixed', 'top:14px', 'right:14px', 'width:475px', 'max-height:94vh',
        'background:#0f172a', 'color:#f8fafc', 'border:1px solid #334155', 'border-radius:12px',
        'box-shadow:0 25px 50px -12px rgba(0,0,0,0.85)', 'z-index:2147483647',
        'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'display:flex', 'flex-direction:column', 'overflow:hidden', 'font-size:12.5px'
    ].join(';'));
    panel.id = 'mesemYardimciPanel';

    // Header
    var baslik = el('div', 'display:flex; align-items:center; gap:6px; padding:10px 14px; background:#1e293b; cursor:move; user-select:none; border-bottom:1px solid #334155;');
    baslik.appendChild(el('strong', 'flex:1; font-size:13.5px; color:#f59e0b; display:flex; align-items:center; gap:6px;', '⚡ E-MESEM Robotu v' + SURUM));
    
    var btnIncele = el('button', 'padding:3px 7px; font-size:11px; font-weight:bold; cursor:pointer; background:#8b5cf6; color:#fff; border:0; border-radius:4px;', '🔬 İncele');
    btnIncele.title = 'MEB sayfasındaki herhangi bir kutuyu tek tıkla incele ve detaylı analizini panoya kopyala';
    btnIncele.onclick = function () {
        if (incelemeModuAktif) elemanIncelemeModunuKapat(); else elemanIncelemeModunuBaslat();
    };

    var btnOgretMod = el('button', 'padding:3px 7px; font-size:11px; font-weight:bold; cursor:pointer; background:#10b981; color:#fff; border:0; border-radius:4px; margin-right:4px;', '🎯 Alan Öğret / Profil');
    btnOgretMod.title = 'Telerik haritasını inceleme, özel eşleme ve profil JSON dışa/içe aktarma panelini aç';
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
        'Robot hazır (Yerleşik Telerik Profili & RadDatePicker Motoru Aktif). "📋 Panodan Al"a tıklayın.');

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
            var detay = el('div', 'font-size:10px; color:#94a3b8;', (k.alan || '-') + ' / ' + (k.dal || '-') + ' • [' + (k.ogrenimYili || '2026-2027 I. Dönem') + ']');
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
    var btnAlanlariYonet = el('button', 'border:0; background:transparent; color:#38bdf8; font-size:10px; cursor:pointer; text-decoration:underline; font-weight:bold;', '🎯 Alanları / Profili Yönet');
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

    // Ayarlar Barı
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
        if (profilDosyaGirdi) profilDosyaGirdi.remove();
        if (vurguKatmani) vurguKatmani.remove();
        if (ogreticiRozet) ogreticiRozet.remove();
        if (ogreticiKontrolBari) ogreticiKontrolBari.remove();
        if (alanOgreticiModal) alanOgreticiModal.remove();
        window.__mesemYardimci = null;
    };

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
    logEkle('E-MESEM Otomasyon Robotu v' + SURUM + ' hazır (Yerleşik Telerik Profili & RadDatePicker Motoru Aktif).', 'basari');

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
        telerikRadComboBoxSec: telerikRadComboBoxSec,
        telerikComboNesnesiBul: telerikComboNesnesiBul,
        telerikDropDownBul: telerikDropDownBul,
        telerikRadDatePickerYaz: telerikRadDatePickerYaz,
        telerikDatePickerNesnesiBul: telerikDatePickerNesnesiBul,
        ogrenimYiliSec: ogrenimYiliSec,
        telefonuYaz: telefonuYaz,
        profilDisaAktarJson: profilDisaAktarJson,
        VARSAYILAN_TELERIK_HARITASI: VARSAYILAN_TELERIK_HARITASI
    };
})();
