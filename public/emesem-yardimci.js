/* ==================================================================
   E-MESEM Sınav Öğrenci Ön Kayıt & Doldurma Otomasyon Robotu (v3.0)
   Geliştirici: Görkem Kocaman © 2026
   ------------------------------------------------------------------
   E-MESEM Sınav Öğrenci Ön Kayıt ekranında tam otomatik veya adım
   adım başvuru ve denklik veri girişini gerçekleştirir:
     1. Başvuru ve seviye türüne göre ilgili sekmeyi seçer
        (Kalfalık / Ustalık / İş Pedagojisi Kursu)
     2. "Yeni Kayıt" butonuna tıklar
     3. Açılır formda Öğrenim Yılını seçer
     4. TC Kimlik No ve Doğum Tarihini girip "Sorgula"ya basar
     5. MERNİS yanıtını akıllıca bekler (Ad, Soyad, Cinsiyet vb.)
     6. Kapsam seçimini yapar (35. Madde, 28/c, 31. Madde vb.)
     7. e-Posta, Cep Telefonu ve İkametgâh adresini doldurur
     8. En Son Mezuniyet, Belge Türü, Belge Tarihi, Alan ve Dal bilgilerini doldurur
     9. "Kaydet" butonuna tıklar
    10. Toplu aktarım modunda sıradaki adaya otomatik geçer.
================================================================== */
(function () {
    'use strict';

    if (window.__mesemYardimci) {
        window.__mesemYardimci.gorunurluk();
        return;
    }

    var SURUM = "3.0";
    var kayitlar = [];             // Aday kayıtları listesi
    var aktifIndeks = 0;           // Aktif işlenen kayıt sırası
    var otomatikCalisiyor = false; // Toplu aktarım döngü durumu
    var beklemeSuresi = 2000;      // MERNİS sorgu sonrası bekleme süresi (ms)
    var panel, listeKutusu, durumYazi, yapistirmaAlani, btnToplu;

    /* ---------------- HTML & DOM Yardımcıları ---------------- */
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

    /* Akıllı Öğe Bulucu */
    function ogeleriBul(secici) {
        return Array.prototype.slice.call(document.querySelectorAll(secici));
    }

    function metinleBul(etiketler, metinListesi) {
        var arananlar = metinListesi.map(trTemizle);
        var adaylar = ogeleriBul(etiketler);
        for (var i = 0; i < adaylar.length; i++) {
            var a = adaylar[i];
            var t = trTemizle(a.textContent || a.value || a.placeholder || a.getAttribute('aria-label') || a.title || a.name || a.id || '');
            for (var j = 0; j < arananlar.length; j++) {
                if (t === arananlar[j] || (arananlar[j].length > 3 && t.indexOf(arananlar[j]) !== -1)) {
                    return a;
                }
            }
        }
        return null;
    }

    function inputBul(anahtarListesi, ebeveyn) {
        var root = ebeveyn || document;
        var inputs = Array.prototype.slice.call(root.querySelectorAll('input, select, textarea'));
        var arananlar = anahtarListesi.map(trTemizle);

        for (var i = 0; i < inputs.length; i++) {
            var inp = inputs[i];
            var attrMetin = trTemizle([
                inp.name, inp.id, inp.placeholder,
                inp.getAttribute('aria-label'), inp.title,
                inp.getAttribute('data-field'), inp.className
            ].join(' '));

            var labelMetin = '';
            if (inp.id) {
                var lbl = root.querySelector('label[for="' + CSS.escape(inp.id) + '"]');
                if (lbl) labelMetin = trTemizle(lbl.textContent);
            }
            if (!labelMetin && inp.closest('label')) {
                labelMetin = trTemizle(inp.closest('label').textContent);
            }
            if (!labelMetin && inp.parentElement) {
                var prev = inp.previousElementSibling;
                if (prev) labelMetin = trTemizle(prev.textContent);
            }

            for (var j = 0; j < arananlar.length; j++) {
                var k = arananlar[j];
                if (attrMetin.indexOf(k) !== -1 || labelMetin.indexOf(k) !== -1) {
                    return inp;
                }
            }
        }
        return null;
    }

    function degerYaz(hedef, deger) {
        if (!hedef) return false;
        var etiket = hedef.tagName.toLowerCase();

        if (etiket === 'select') {
            var bulundu = false;
            var aranan = trTemizle(deger);
            Array.prototype.forEach.call(hedef.options, function (o) {
                if (bulundu) return;
                var m = trTemizle(o.textContent);
                var v = trTemizle(o.value);
                if (m === aranan || v === aranan || (aranan && (m.indexOf(aranan) !== -1 || aranan.indexOf(m) !== -1))) {
                    hedef.value = o.value;
                    bulundu = true;
                }
            });
            if (!bulundu && hedef.options.length > 1 && !deger) {
                return false;
            }
        } else if (hedef.type === 'checkbox') {
            var acik = deger === true || deger === 'Evet' || deger === 'true' || deger === '1';
            if (hedef.checked !== acik) hedef.click();
            return true;
        } else {
            var yerlestirici = Object.getOwnPropertyDescriptor(
                etiket === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
                'value'
            );
            if (yerlestirici && yerlestirici.set) yerlestirici.set.call(hedef, String(deger != null ? deger : ''));
            else hedef.value = String(deger != null ? deger : '');
        }

        ['input', 'change', 'blur'].forEach(function (tur) {
            hedef.dispatchEvent(new Event(tur, { bubbles: true }));
        });
        try {
            hedef.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
        } catch (e) { }
        return true;
    }

    function vurgula(hedef, renk) {
        if (!hedef) return;
        var eski = hedef.style.outline;
        hedef.style.outline = '3px solid ' + (renk || '#f59e0b');
        setTimeout(function () { hedef.style.outline = eski; }, 1600);
    }

    /* ---------------- Pano ve Veri Yükleme ---------------- */
    function veriyiCoz(metin) {
        try {
            var nesne = JSON.parse(metin);
            if (Array.isArray(nesne)) return nesne;
            if (nesne && Array.isArray(nesne.kayitlar)) return nesne.kayitlar;
            if (nesne && nesne.alanlar) return [nesne];
            if (nesne && (nesne.tc || nesne.ad)) return [nesne];
            return null;
        } catch (e) {
            return null;
        }
    }

    async function panodanAl() {
        durum('Pano okunuyor...', '#38bdf8');
        try {
            var metin = await navigator.clipboard.readText();
            var veri = veriyiCoz(metin);
            if (!veri || !veri.length) {
                yapistirmaKutusuAc('Panoda geçerli aday verisi bulunamadı. Veriyi aşağıdaki kutuya yapıştırın.');
                return;
            }
            kayitlariYukle(veri);
        } catch (e) {
            yapistirmaKutusuAc('Tarayıcı pano izni vermedi. Kayıt verisini aşağıdaki kutuya yapıştırın (Ctrl+V).');
        }
    }

    function kayitlariYukle(liste) {
        kayitlar = liste.map(function (k) {
            if (k.alanlar && Array.isArray(k.alanlar)) {
                var duz = { baslik: k.baslik || '' };
                k.alanlar.forEach(function (a) { duz[a.id] = a.deger; });
                ['tc', 'ad', 'soyad', 'dogumTarihi', 'basvuruTuru', 'kapsam', 'eposta', 'telefon', 'adres',
                 'enSonMezuniyet', 'mezunOlduguOkul', 'getirdigiBelge', 'belgeTarihi', 'alan', 'dal',
                 'kalfalikSinav', 'dogrudanKalfalik', 'kalfalikVeUstalik', 'kalfalikVeBasariliUstalik',
                 'ustalikSinav', 'dogrudanUstalik'].forEach(function (anahtar) {
                    if (k[anahtar] !== undefined && duz[anahtar] === undefined) {
                        duz[anahtar] = k[anahtar];
                    }
                });
                return duz;
            }
            return k;
        });
        aktifIndeks = 0;
        listeyiCiz();
        durum(`${kayitlar.length} aday verisi yüklendi. Aktarıma hazır.`, '#4ade80');
    }

    function yapistirmaKutusuAc(mesaj) {
        durum(mesaj, '#fbbf24');
        yapistirmaAlani.style.display = 'block';
        yapistirmaAlani.focus();
    }

    function seviyeMetni(k) {
        if (k.kalfalikVeUstalik || k.kalfalikVeBasariliUstalik) return 'Kalfalık + Ustalık';
        if (k.dogrudanKalfalik) return 'Doğrudan Kalfalık';
        if (k.kalfalikSinav) return 'Kalfalık Sınavı';
        if (k.dogrudanUstalik) return 'Doğrudan Ustalık';
        if (k.ustalikSinav) return 'Ustalık Sınavı';
        if (k.basvuruTuru === 'Usta Öğreticilik') return 'İş Pedagojisi';
        return k.basvuruTuru || 'Başvuru';
    }

    /* ---------------- E-MESEM EKRAN AKIŞI OTOMASYONU ---------------- */
    async function adimiIsle(k) {
        if (!k) throw new Error('İşlenecek aday kaydı yok.');

        durum(`[${k.basvuruNo || k.tc || 'Aday'}] Başvuru sekmesi seçiliyor...`, '#38bdf8');

        // 1. ADIM: Başvuru Türü ve Sekme Seçimi
        var tur = String(k.basvuruTuru || '').toLowerCase();
        var arananSekmeMetni = ['Kalfalık Sınavı', 'Kalfalık'];

        if (tur.indexOf('usta öğreticilik') !== -1 || tur.indexOf('iş pedagojisi') !== -1) {
            arananSekmeMetni = ['İş Pedagojisi Kursu', 'İş Pedagojisi', 'Usta Öğreticilik'];
        } else if (k.ustalikSinav || k.dogrudanUstalik || tur.indexOf('ustalık') !== -1) {
            arananSekmeMetni = ['Ustalık Sınavı', 'Ustalık'];
        } else if (k.kalfalikVeUstalik || k.kalfalikVeBasariliUstalik) {
            arananSekmeMetni = ['Kalfalık Sınavı', 'Kalfalık'];
        }

        var sekmeDugme = metinleBul('button, a, input[type="button"], .tab, span, td, div', arananSekmeMetni);
        if (sekmeDugme) {
            vurgula(sekmeDugme, '#38bdf8');
            sekmeDugme.click();
            await bekle(600);
        }

        // 2. ADIM: "Yeni Kayıt" Butonuna Basma
        durum(`[${k.tc}] "Yeni Kayıt" butonuna tıklanıyor...`, '#38bdf8');
        var yeniKayitBtn = metinleBul('button, a, input[type="button"], .btn', ['Yeni Kayıt', 'Yeni Ekle', 'Yeni']);
        if (yeniKayitBtn) {
            vurgula(yeniKayitBtn, '#22c55e');
            yeniKayitBtn.click();
            await bekle(1000);
        }

        var modalVeyaForm = document.querySelector('.modal.show, .modal.active, .popup, .ui-dialog, [role="dialog"]') || document;

        // 3. ADIM: Öğrenim Yılı Seçimi
        var ogrenimYili = inputBul(['ogrenimyili', 'donem', 'ogretimyili', 'egitimyili'], modalVeyaForm);
        if (ogrenimYili && ogrenimYili.tagName.toLowerCase() === 'select' && ogrenimYili.options.length > 1) {
            if (!ogrenimYili.value) {
                ogrenimYili.selectedIndex = 1;
                degerYaz(ogrenimYili, ogrenimYili.value);
            }
        }

        // 4. ADIM: TC Kimlik No ve Doğum Tarihi Yazma
        durum(`[${k.tc}] Kimlik No ve Doğum Tarihi yazılıyor...`, '#38bdf8');
        var tcInput = inputBul(['tc', 'kimlikno', 'tckimlikno', 'txttc'], modalVeyaForm);
        if (tcInput) {
            degerYaz(tcInput, k.tc);
            vurgula(tcInput, '#38bdf8');
        }

        var dogumInput = inputBul(['dogumtarihi', 'dogum', 'txtdogum'], modalVeyaForm);
        if (dogumInput) {
            var dogumDeger = k.dogumTarihi || '';
            if (/^\d{4}-\d{2}-\d{2}$/.test(dogumDeger)) {
                var p = dogumDeger.split('-');
                dogumDeger = p[2] + '.' + p[1] + '.' + p[0];
            }
            degerYaz(dogumInput, dogumDeger);
            vurgula(dogumInput, '#38bdf8');
        }

        // 5. ADIM: "Sorgula" Butonuna Basma ve MERNİS Bekleme
        await bekle(300);
        var sorgulaBtn = metinleBul('button, a, input[type="button"], .btn', ['Sorgula', 'MERNİS Sorgula', 'Getir']);
        if (sorgulaBtn) {
            durum(`[${k.tc}] MERNİS sorgulanıyor...`, '#fbbf24');
            vurgula(sorgulaBtn, '#eab308');
            sorgulaBtn.click();
            await bekle(beklemeSuresi);
        }

        // 6. ADIM: Kapsam Seçimi
        durum(`[${k.tc}] Kapsam ve İletişim bilgileri giriliyor...`, '#38bdf8');
        var kapsamDegeri = k.kapsam || '';
        if (arananSekmeMetni[0].indexOf('Kalfalık') !== -1) {
            kapsamDegeri = kapsamDegeri || '35.Madde';
        } else if (arananSekmeMetni[0].indexOf('Pedagoji') !== -1) {
            kapsamDegeri = kapsamDegeri || '31.Madde';
        } else if (!kapsamDegeri) {
            kapsamDegeri = '35.Madde';
        }
        var kapsamInput = inputBul(['kapsam', 'madde', 'kapsamturu'], modalVeyaForm);
        if (kapsamInput) {
            degerYaz(kapsamInput, kapsamDegeri);
            vurgula(kapsamInput, '#38bdf8');
        }

        // 7. ADIM: e-Posta, Telefon, Adres
        var epostaInput = inputBul(['eposta', 'email', 'mail'], modalVeyaForm);
        if (epostaInput && k.eposta) {
            degerYaz(epostaInput, k.eposta);
        }

        var telInput = inputBul(['telefon', 'tel', 'cep', 'gsm'], modalVeyaForm);
        if (telInput && k.telefon) {
            degerYaz(telInput, k.telefon);
        }

        var adresInput = inputBul(['adres', 'ikametgah'], modalVeyaForm);
        if (adresInput && k.adres) {
            degerYaz(adresInput, k.adres);
        }

        // 8. ADIM: Mezuniyet ve Belge Bilgileri
        var mezuniyetInput = inputBul(['mezuniyet', 'ensonmezuniyet', 'ogrenimdurumu', 'mezuniyetdurumu'], modalVeyaForm);
        if (mezuniyetInput) {
            degerYaz(mezuniyetInput, k.enSonMezuniyet || k.mezuniyetDurumu || 'Lise');
            vurgula(mezuniyetInput, '#38bdf8');
        }

        var belgeInput = inputBul(['getirdigibelge', 'belgeturu', 'ogrenimbelgesi'], modalVeyaForm);
        if (belgeInput) {
            degerYaz(belgeInput, k.getirdigiBelge || 'Diploma');
        }

        var belgeTarihiInput = inputBul(['belgetarihi', 'diplomatarihi'], modalVeyaForm);
        if (belgeTarihiInput && k.belgeTarihi) {
            var bTarih = k.belgeTarihi;
            if (/^\d{4}-\d{2}-\d{2}$/.test(bTarih)) {
                var bp = bTarih.split('-');
                bTarih = bp[2] + '.' + bp[1] + '.' + bp[0];
            }
            degerYaz(belgeTarihiInput, bTarih);
        }

        // Alan / Dal Bilgileri
        var alanInput = inputBul(['alan', 'alanadi', 'meslek'], modalVeyaForm);
        if (alanInput && k.alan) degerYaz(alanInput, k.alan);

        var dalInput = inputBul(['dal', 'daladi'], modalVeyaForm);
        if (dalInput && k.dal) degerYaz(dalInput, k.dal);

        // 9. ADIM: "Kaydet" Butonuna Basma
        await bekle(500);
        durum(`[${k.tc}] Kayıt tamamlanıyor...`, '#22c55e');
        var kaydetBtn = metinleBul('button, a, input[type="submit"], input[type="button"], .btn-success, .btn-primary', ['Kaydet', 'Ön Kaydı Tamamla', 'Kaydet ve Kapat']);
        if (kaydetBtn) {
            vurgula(kaydetBtn, '#22c55e');
            kaydetBtn.click();
            await bekle(1200);
        }

        durum(`✓ [${k.tc}] ${k.ad || ''} ${k.soyad || ''} başarıyla kaydedildi.`, '#4ade80');
    }

    async function seciliKaydiDoldur() {
        if (!kayitlar.length) {
            durum('Önce başvuru yönetim sisteminden aday listesini panodan aktarın.', '#f87171');
            return;
        }
        var k = kayitlar[aktifIndeks];
        try {
            await adimiIsle(k);
            if (aktifIndeks < kayitlar.length - 1) {
                aktifIndeks++;
                listeyiCiz();
            }
        } catch (e) {
            durum('Hata: ' + e.message, '#f87171');
        }
    }

    async function topluAktarimBaslat() {
        if (!kayitlar.length) {
            durum('Aktarılacak kayıt yok. "Panodan Al" ile yükleyin.', '#f87171');
            return;
        }
        otomatikCalisiyor = true;
        cubukBtnGuncelle();
        durum(`Toplu aktarım başlatıldı (${kayitlar.length} aday)...`, '#38bdf8');

        for (var i = aktifIndeks; i < kayitlar.length; i++) {
            if (!otomatikCalisiyor) break;
            aktifIndeks = i;
            listeyiCiz();
            try {
                await adimiIsle(kayitlar[i]);
                await bekle(1600);
            } catch (err) {
                durum(`HATA (${kayitlar[i].tc}): ${err.message}. Durduruldu.`, '#f87171');
                otomatikCalisiyor = false;
                break;
            }
        }

        otomatikCalisiyor = false;
        cubukBtnGuncelle();
        if (aktifIndeks >= kayitlar.length - 1) {
            durum(`🎉 Tüm adayların (${kayitlar.length} kişi) E-MESEM kayıtları tamamlandı!`, '#4ade80');
        }
    }

    function topluAktarimDurdur() {
        otomatikCalisiyor = false;
        cubukBtnGuncelle();
        durum('Toplu aktarım duraklatıldı.', '#fbbf24');
    }

    /* ---------------- Panel Arayüzü ---------------- */
    panel = el('div', [
        'position:fixed', 'top:16px', 'right:16px', 'width:400px', 'max-height:88vh',
        'background:#111827', 'color:#f3f4f6', 'border:1px solid #374151', 'border-radius:12px',
        'box-shadow:0 25px 50px -12px rgba(0,0,0,0.7)', 'z-index:2147483647',
        'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'display:flex', 'flex-direction:column', 'overflow:hidden', 'font-size:13px'
    ].join(';'));
    panel.id = 'mesemYardimciPanel';

    var baslik = el('div', 'display:flex; align-items:center; gap:8px; padding:11px 14px; background:#1e293b; cursor:move; user-select:none; border-bottom:1px solid #374151;');
    baslik.appendChild(el('strong', 'flex:1; font-size:13.5px; color:#f59e0b;', '⚡ E-MESEM Ön Kayıt Robotu v' + SURUM));
    var kucultDugme = el('button', 'border:0; background:#334155; color:#f3f4f6; width:26px; height:26px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px;', '–');
    var kapatDugme = el('button', 'border:0; background:#dc2626; color:#fff; width:26px; height:26px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px; margin-left:4px;', '×');
    baslik.appendChild(kucultDugme); baslik.appendChild(kapatDugme);

    var govde = el('div', 'display:flex; flex-direction:column; min-height:0;');

    var dugmeCubugu = el('div', 'display:flex; flex-wrap:wrap; gap:6px; padding:10px 12px; border-bottom:1px solid #374151; background:#1e293b;');
    var btnPano = el('button', 'padding:7px 11px; font-size:12px; font-weight:600; cursor:pointer; background:#2563eb; color:#fff; border:0; border-radius:6px;', '📋 Panodan Al');
    btnPano.onclick = panodanAl;

    var btnTekDoldur = el('button', 'padding:7px 11px; font-size:12px; font-weight:600; cursor:pointer; background:#16a34a; color:#fff; border:0; border-radius:6px;', '▶ Bu Adayı Kaydet');
    btnTekDoldur.onclick = seciliKaydiDoldur;

    btnToplu = el('button', 'padding:7px 11px; font-size:12px; font-weight:600; cursor:pointer; background:#8b5cf6; color:#fff; border:0; border-radius:6px;', '⏩ Hepsini Sırayla Kaydet');
    btnToplu.onclick = function () {
        if (otomatikCalisiyor) topluAktarimDurdur(); else topluAktarimBaslat();
    };

    function cubukBtnGuncelle() {
        if (!btnToplu) return;
        if (otomatikCalisiyor) {
            btnToplu.textContent = '⏸ Duraklat';
            btnToplu.style.background = '#dc2626';
        } else {
            btnToplu.textContent = '⏩ Hepsini Sırayla Kaydet';
            btnToplu.style.background = '#8b5cf6';
        }
    }

    dugmeCubugu.appendChild(btnPano);
    dugmeCubugu.appendChild(btnTekDoldur);
    dugmeCubugu.appendChild(btnToplu);

    durumYazi = el('div', 'padding:9px 12px; font-size:12px; color:#cbd5e1; border-bottom:1px solid #374151; line-height:1.4; background:#0f172a;',
        'Hazır. Başvuru verilerini aktarmak için "Panodan Al" butonuna basın.');

    yapistirmaAlani = el('textarea',
        'display:none; margin:8px 12px; width:calc(100% - 24px); height:65px; background:#1e293b; color:#e2e8f0; border:1px solid #475569; border-radius:6px; font-size:11px; padding:6px;');
    yapistirmaAlani.placeholder = 'Kayıt verisini buraya yapıştırın (Ctrl+V)';
    yapistirmaAlani.addEventListener('input', function () {
        var v = veriyiCoz(yapistirmaAlani.value);
        if (v) { kayitlariYukle(v); yapistirmaAlani.style.display = 'none'; yapistirmaAlani.value = ''; }
    });

    listeKutusu = el('div', 'overflow-y:auto; min-height:90px; max-height:42vh; padding:4px 0;');

    function listeyiCiz() {
        listeKutusu.textContent = '';
        if (!kayitlar.length) {
            listeKutusu.appendChild(el('div', 'padding:16px 12px; color:#94a3b8; text-align:center; font-size:12px; line-height:1.5;',
                'Henüz aday verisi yüklenmedi. Başvuru yönetim sisteminde "Tüm Kayıtları Robot İçin Kopyala"ya basıp buradaki "Panodan Al"a tıklayın.'));
            return;
        }

        kayitlar.forEach(function (k, i) {
            var satir = el('div', 'display:flex; align-items:center; gap:8px; padding:7px 12px; border-bottom:1px solid #1e293b; cursor:pointer; background:' + (i === aktifIndeks ? '#1e3a8a' : 'transparent') + ';');
            var siraRozet = el('span', 'font-size:11px; padding:2px 6px; border-radius:4px; font-weight:bold; background:' + (i === aktifIndeks ? '#3b82f6' : '#334155') + '; color:#fff;', (i + 1));
            
            var icerikKutu = el('div', 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;');
            var adSoyad = el('div', 'font-weight:600; color:#f8fafc; font-size:12.5px;', `${k.ad || ''} ${k.soyad || ''} (${k.tc || '-'})`);
            var detay = el('div', 'font-size:11px; color:#94a3b8;', `${k.alan || '-'} / ${k.dal || '-'} • [${seviyeMetni(k)}]`);
            icerikKutu.appendChild(adSoyad);
            icerikKutu.appendChild(detay);

            satir.onclick = function () {
                aktifIndeks = i;
                listeyiCiz();
                durum(`Seçili aday: ${k.ad || ''} ${k.soyad || ''} (${k.tc}) - ${seviyeMetni(k)}`, '#60a5fa');
            };
            satir.appendChild(siraRozet);
            satir.appendChild(icerikKutu);
            listeKutusu.appendChild(satir);
        });
    }

    var ayarSatiri = el('div', 'display:flex; align-items:center; justify-content:space-between; padding:8px 12px; font-size:11px; color:#94a3b8; border-top:1px solid #374151; background:#1e293b;');
    var lblGecikme = el('span', null, 'MERNİS Bekleme Süresi:');
    var selGecikme = el('select', 'background:#0f172a; color:#fff; border:1px solid #475569; border-radius:4px; padding:3px 6px; font-size:11px;');
    [['1200', '1.2 sn (Hızlı)'], ['2000', '2.0 sn (Önerilen)'], ['3000', '3.0 sn (Yavaş İnternet)'], ['4500', '4.5 sn (Yoğun Saatler)']].forEach(function (opt) {
        var o = el('option', null, opt[1]);
        o.value = opt[0];
        if (opt[0] === '2000') o.selected = true;
        selGecikme.appendChild(o);
    });
    selGecikme.onchange = function () { beklemeSuresi = Number(selGecikme.value) || 2000; };
    ayarSatiri.appendChild(lblGecikme);
    ayarSatiri.appendChild(selGecikme);

    govde.appendChild(dugmeCubugu);
    govde.appendChild(durumYazi);
    govde.appendChild(yapistirmaAlani);
    govde.appendChild(listeKutusu);
    govde.appendChild(ayarSatiri);
    panel.appendChild(baslik);
    panel.appendChild(govde);
    document.body.appendChild(panel);

    /* Küçültme / Kapatma */
    kucultDugme.onclick = function () {
        var kapali = govde.style.display === 'none';
        govde.style.display = kapali ? 'flex' : 'none';
        kucultDugme.textContent = kapali ? '–' : '+';
    };
    kapatDugme.onclick = function () { panel.remove(); window.__mesemYardimci = null; };

    /* Sürükleme Mantığı */
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

    listeyiCiz();

    window.__mesemYardimci = {
        gorunurluk: function () {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        },
        kayitlariYukle: kayitlariYukle,
        adimiIsle: adimiIsle
    };
})();
