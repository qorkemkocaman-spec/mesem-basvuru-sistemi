/* ==================================================================
   E-MESEM Sınav Öğrenci Ön Kayıt & Doldurma Otomasyonu (Sürüm 2.0)
   Geliştirici: Görkem Kocaman © 2026
   ------------------------------------------------------------------
   E-MESEM Sınav Öğrenci Ön Kayıt ekranında tam otomatik veya adım
   adım başvuru girişi yapar:
     1. Başvuru türüne göre sekmeyi seçer (Kalfalık / Ustalık / İş Pedagojisi)
     2. "Yeni Kayıt" butonuna tıklar
     3. Açılır pencerede Öğrenim Yılını seçer
     4. TC Kimlik No ve Doğum Tarihini girip "Sorgula" butonuna basar
     5. MERNİS yanıtı için bekler (Ad, Soyad, Doğum Yeri, Cinsiyet gelir)
     6. Kapsam (Kalfalık: 35.Madde / Ustalık: 28.c, 35.Madde... / İş Pedagojisi: 31.Madde) seçer
     7. e-Posta ve Telefon bilgilerini yazar
     8. En Son Mezuniyet, Getirdiği Belge ve Belge Tarihini doldurur
     9. Sağ üstteki "Kaydet" butonuna tıklar
    10. Toplu aktarımda sıradaki öğrenciye otomatik geçer.
================================================================== */
(function () {
    'use strict';

    if (window.__mesemYardimci) {
        window.__mesemYardimci.gorunurluk();
        return;
    }

    var SURUM = "2.0";
    var kayitlar = [];             // Toplu kayıt listesi
    var aktifIndeks = 0;           // Aktif işlenen kayıt indeksi
    var otomatikCalisiyor = false; // Toplu aktarım döngüsü
    var beklemeSuresi = 1800;      // Sorgula sonrası MERNİS bekleme süresi (ms)
    var panel, listeKutusu, durumYazi, progressKutusu;

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
            .replace(/[\s._\-\/\(\):]/g, '')
            .replace(/i̇/g, 'i')
            .trim();
    }

    /* Akıllı Öğe Bulucu (Metin, placeholder, name, id veya aria-label ile) */
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

            // İlişkili label kontrolü
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
                // Boşsa ilk anlamlı seçeneği seçme
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
        durum('Pano okunuyor...');
        try {
            var metin = await navigator.clipboard.readText();
            var veri = veriyiCoz(metin);
            if (!veri || !veri.length) {
                yapistirmaKutusuAc('Panoda geçerli bir başvuru kaydı bulunamadı. Aşağıya yapıştırın.');
                return;
            }
            kayitlariYukle(veri);
        } catch (e) {
            yapistirmaKutusuAc('Tarayıcı pano izni vermedi. Kayıt verisini aşağıdaki kutuya yapıştırın (Ctrl+V).');
        }
    }

    function kayitlariYukle(liste) {
        // Normalize et
        kayitlar = liste.map(function (k) {
            if (k.alanlar && Array.isArray(k.alanlar)) {
                var duz = { baslik: k.baslik || '' };
                k.alanlar.forEach(function (a) { duz[a.id] = a.deger; });
                return duz;
            }
            return k;
        });
        aktifIndeks = 0;
        listeyiCiz();
        durum(kayitlar.length + ' aday kaydı yüklendi. Aktarıma hazır.', '#4ade80');
    }

    function yapistirmaKutusuAc(mesaj) {
        durum(mesaj, '#fbbf24');
        yapistirmaAlani.style.display = 'block';
        yapistirmaAlani.focus();
    }

    /* ---------------- E-MESEM EKRAN AKIŞI OTOMASYONU ---------------- */
    async function adimiIsle(k) {
        if (!k) throw new Error('İşlenecek kayıt yok.');

        durum(`[${k.basvuruNo || k.tc || 'Aday'}] Başvuru türü seçiliyor...`, '#38bdf8');

        // 1. ADIM: Başvuru Türü Seçimi (Kalfalık / Ustalık / İş Pedagojisi)
        var tur = String(k.basvuruTuru || '').toLowerCase();
        var arananSekmeMetni = ['Kalfalık Sınavı', 'Kalfalık'];
        if (tur.indexOf('usta öğreticilik') !== -1 || tur.indexOf('iş pedagojisi') !== -1) {
            arananSekmeMetni = ['İş Pedagojisi Kursu', 'İş Pedagojisi', 'Usta Öğreticilik'];
        } else if (k.ustalikSinav || k.dogrudanUstalik || k.basariliUstalik || k.kalfalikVeBasariliUstalik || tur.indexOf('ustalık') !== -1) {
            arananSekmeMetni = ['Ustalık Sınavı', 'Ustalık'];
        }

        var sekmeDugme = metinleBul('button, a, input[type="button"], .tab, span, td, div', arananSekmeMetni);
        if (sekmeDugme) {
            vurgula(sekmeDugme, '#38bdf8');
            sekmeDugme.click();
            await bekle(600);
        }

        // 2. ADIM: "Yeni Kayıt" Butonuna Basma
        durum(`[${k.tc}] "Yeni Kayıt" butonuna basılıyor...`, '#38bdf8');
        var yeniKayitBtn = metinleBul('button, a, input[type="button"], .btn', ['Yeni Kayıt', 'Yeni Ekle', 'Yeni']);
        if (yeniKayitBtn) {
            vurgula(yeniKayitBtn, '#22c55e');
            yeniKayitBtn.click();
            await bekle(1000);
        }

        // Açılan pencere veya ana form kapsayıcısı
        var modalVeyaForm = document.querySelector('.modal.show, .modal.active, .popup, .ui-dialog, [role="dialog"]') || document;

        // 3. ADIM: Öğrenim Yılı Seçimi
        var ogrenimYili = inputBul(['ogrenimyili', 'donem', 'ogretimyili', 'egitimyili'], modalVeyaForm);
        if (ogrenimYili && ogrenimYili.tagName.toLowerCase() === 'select' && ogrenimYili.options.length > 1) {
            if (!ogrenimYili.value) {
                ogrenimYili.selectedIndex = 1; // Genelde en üstteki aktif dönem
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
            // GG.AA.YYYY formatına çevir (E-MESEM genelde nokta formatı ister)
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
            durum(`[${k.tc}] Sorgula butonuna basıldı, MERNİS bekleniyor...`, '#fbbf24');
            vurgula(sorgulaBtn, '#eab308');
            sorgulaBtn.click();
            await bekle(beklemeSuresi); // 1-2 saniye MERNİS beklemesi
        }

        // 6. ADIM: Kapsam Seçimi
        durum(`[${k.tc}] Kapsam ve İletişim bilgileri giriliyor...`, '#38bdf8');
        var kapsamDegeri = k.kapsam || '';
        if (arananSekmeMetni[0].indexOf('Kalfalık') !== -1) {
            kapsamDegeri = '35.Madde';
        } else if (arananSekmeMetni[0].indexOf('Pedagoji') !== -1) {
            kapsamDegeri = '31.Madde';
        } else if (!kapsamDegeri) {
            kapsamDegeri = '35.Madde';
        }
        var kapsamInput = inputBul(['kapsam', 'madde', 'kapsamturu'], modalVeyaForm);
        if (kapsamInput) {
            degerYaz(kapsamInput, kapsamDegeri);
            vurgula(kapsamInput, '#38bdf8');
        }

        // 7. ADIM: e-Posta ve Telefon
        var epostaInput = inputBul(['eposta', 'email', 'mail'], modalVeyaForm);
        if (epostaInput && k.eposta) {
            degerYaz(epostaInput, k.eposta);
        }

        var telInput = inputBul(['telefon', 'tel', 'cep', 'gsm'], modalVeyaForm);
        if (telInput && k.telefon) {
            degerYaz(telInput, k.telefon);
        }

        // Adres alanı varsa
        var adresInput = inputBul(['adres', 'ikametgah'], modalVeyaForm);
        if (adresInput && k.adres) {
            degerYaz(adresInput, k.adres);
        }

        // 8. ADIM: Mezuniyet Bilgileri
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

        // Alan / Dal bilgileri
        var alanInput = inputBul(['alan', 'alanadi', 'meslek'], modalVeyaForm);
        if (alanInput && k.alan) degerYaz(alanInput, k.alan);

        var dalInput = inputBul(['dal', 'daladi'], modalVeyaForm);
        if (dalInput && k.dal) degerYaz(dalInput, k.dal);

        // 9. ADIM: "Kaydet" Butonuna Tıklama
        await bekle(500);
        durum(`[${k.tc}] Form hazırlandı, Kaydet butonuna basılıyor...`, '#22c55e');
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
            durum('Lütfen önce başvuru sisteminden "E-MESEM Yardımcısı" ile kayıtları aktarın.', '#f87171');
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
                await bekle(1500); // Kayıtlar arası güvenli geçiş beklemesi
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
        durum('Toplu aktarım kullanıcı tarafından duraklatıldı.', '#fbbf24');
    }

    /* ---------------- Panel Arayüzü ---------------- */
    panel = el('div', [
        'position:fixed', 'top:16px', 'right:16px', 'width:380px', 'max-height:85vh',
        'background:#111827', 'color:#f3f4f6', 'border:1px solid #374151', 'border-radius:12px',
        'box-shadow:0 20px 40px rgba(0,0,0,.6)', 'z-index:2147483647',
        'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'display:flex', 'flex-direction:column', 'overflow:hidden', 'font-size:13px'
    ].join(';'));
    panel.id = 'mesemYardimciPanel';

    var baslik = el('div', 'display:flex; align-items:center; gap:8px; padding:10px 14px; background:#1f2937; cursor:move; user-select:none; border-bottom:1px solid #374151;');
    baslik.appendChild(el('strong', 'flex:1; font-size:13px; color:#f59e0b;', '⚡ E-MESEM Ön Kayıt Robotu v' + SURUM));
    var kucultDugme = el('button', 'border:0; background:#374151; color:#f3f4f6; width:24px; height:24px; border-radius:4px; cursor:pointer; font-weight:bold;', '–');
    var kapatDugme = el('button', 'border:0; background:#991b1b; color:#fff; width:24px; height:24px; border-radius:4px; cursor:pointer; font-weight:bold; margin-left:4px;', '×');
    baslik.appendChild(kucultDugme); baslik.appendChild(kapatDugme);

    var govde = el('div', 'display:flex; flex-direction:column; min-height:0;');

    var dugmeCubugu = el('div', 'display:flex; flex-wrap:wrap; gap:6px; padding:10px 12px; border-bottom:1px solid #374151; background:#182234;');
    var btnPano = el('button', 'padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer; background:#2563eb; color:#fff; border:0; border-radius:6px;', '📋 Panodan Al');
    btnPano.onclick = panodanAl;

    var btnTekDoldur = el('button', 'padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer; background:#16a34a; color:#fff; border:0; border-radius:6px;', '▶ Bu Adayı Doldur ve Kaydet');
    btnTekDoldur.onclick = seciliKaydiDoldur;

    var btnToplu = el('button', 'padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer; background:#8b5cf6; color:#fff; border:0; border-radius:6px;', '⏩ Hepsini Sırayla Kaydet');
    btnToplu.onclick = function () {
        if (otomatikCalisiyor) topluAktarimDurdur(); else topluAktarimBaslat();
    };

    function cubukBtnGuncelle() {
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

    durumYazi = el('div', 'padding:8px 12px; font-size:12px; color:#cbd5e1; border-bottom:1px solid #374151; line-height:1.4; background:#111827;',
        'Hazır. Sistemdeki başvuruları aktarmak için "Panodan Al" butonuna basın.');

    var yapistirmaAlani = el('textarea',
        'display:none; margin:8px 12px; width:calc(100% - 24px); height:60px; background:#1f2937; color:#e2e8f0; border:1px solid #4b5563; border-radius:6px; font-size:11px; padding:6px;');
    yapistirmaAlani.placeholder = 'Kaydı buraya yapıştırın (Ctrl+V)';
    yapistirmaAlani.addEventListener('input', function () {
        var v = veriyiCoz(yapistirmaAlani.value);
        if (v) { kayitlariYukle(v); yapistirmaAlani.style.display = 'none'; yapistirmaAlani.value = ''; }
    });

    listeKutusu = el('div', 'overflow-y:auto; min-height:80px; max-height:42vh; padding:6px 0;');

    function listeyiCiz() {
        listeKutusu.textContent = '';
        if (!kayitlar.length) {
            listeKutusu.appendChild(el('div', 'padding:14px; color:#9ca3af; text-align:center; font-size:12px;',
                'Henüz aday verisi yüklenmedi. Başvuru uygulamasında "E-MESEM Yardımcısı" butonuna tıklayıp veriyi kopyalayın, ardından buradaki "Panodan Al"a basın.'));
            return;
        }

        kayitlar.forEach(function (k, i) {
            var satir = el('div', 'display:flex; align-items:center; gap:8px; padding:6px 12px; border-bottom:1px solid #1f2937; cursor:pointer; background:' + (i === aktifIndeks ? '#1e3a8a' : 'transparent') + ';');
            var siraRozet = el('span', 'font-size:11px; padding:2px 6px; border-radius:4px; font-weight:bold; background:' + (i === aktifIndeks ? '#3b82f6' : '#374151') + '; color:#fff;', (i + 1));
            var baslikYazi = el('span', 'flex:1; color:#f3f4f6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;',
                `${k.tc || '-'} — ${k.ad || ''} ${k.soyad || ''} (${k.alan || k.basvuruTuru || 'Meslek'})`);

            satir.onclick = function () { aktifIndeks = i; listeyiCiz(); durum(`Seçili aday: ${k.ad || ''} ${k.soyad || ''} (${k.tc})`, '#60a5fa'); };
            satir.appendChild(siraRozet);
            satir.appendChild(baslikYazi);
            listeKutusu.appendChild(satir);
        });
    }

    var ayarSatiri = el('div', 'display:flex; align-items:center; justify-content:space-between; padding:8px 12px; font-size:11px; color:#9ca3af; border-top:1px solid #374151; background:#182234;');
    var lblGecikme = el('span', null, 'MERNİS Bekleme Süresi:');
    var selGecikme = el('select', 'background:#1f2937; color:#fff; border:1px solid #4b5563; border-radius:4px; padding:2px 4px; font-size:11px;');
    [['1200', '1.2 sn (Hızlı)'], ['1800', '1.8 sn (Önerilen)'], ['2800', '2.8 sn (Yavaş İnternet)'], ['4000', '4.0 sn (Yoğun Saatler)']].forEach(function (opt) {
        var o = el('option', null, opt[1]);
        o.value = opt[0];
        if (opt[0] === '1800') o.selected = true;
        selGecikme.appendChild(o);
    });
    selGecikme.onchange = function () { beklemeSuresi = Number(selGecikme.value) || 1800; };
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
