/* ==================================================================
   E-MESEM Doldurma Yardımcısı  (sürüm 1.0)
   ------------------------------------------------------------------
   Bu betik E-MESEM sayfasında çalışır. Başvuru sistemimizde bir kaydın
   yanındaki "E-MESEM'e Aktar" düğmesine basıldığında kayıt panoya
   kopyalanır; burada "Panodan Al" denince veriler okunur.

   İlk kullanımda alanları bir kez öğretirsiniz:
     1) Soldaki listeden bir alanı seçin (örn. "TC Kimlik No")
     2) E-MESEM sayfasındaki ilgili kutuya tıklayın
   Eşleştirme tarayıcıya kaydedilir; sonraki kayıtlarda tek "Doldur"
   yeterlidir. E-MESEM'in HTML yapısını bilmeye gerek yoktur, sayfa
   değişse bile eşleştirmeyi yeniden öğretebilirsiniz.
================================================================== */
(function () {
    'use strict';

    if (window.__mesemYardimci) {
        window.__mesemYardimci.gorunurluk();
        return;
    }

    var ESLEME_ANAHTARI = 'mesemEsleme::' + location.host + location.pathname;
    var VERI_ANAHTARI = 'mesemSonKayit';
    var kayit = null;              // { alanlar: [{id, ad, deger}] }
    var esleme = {};               // alanId -> secici
    var ogrenilenAlan = null;      // öğretme kipinde seçili alan
    var panel, listeKutusu, durumYazi;

    /* ---------------- yardımcılar ---------------- */
    function el(etiket, stil, metin) {
        var e = document.createElement(etiket);
        if (stil) e.setAttribute('style', stil);
        if (metin != null) e.textContent = metin;
        return e;
    }

    function durum(metin, renk) {
        durumYazi.textContent = metin;
        durumYazi.style.color = renk || '#cbd5e1';
    }

    function eslemeyiOku() {
        try { esleme = JSON.parse(localStorage.getItem(ESLEME_ANAHTARI) || '{}'); }
        catch (e) { esleme = {}; }
    }

    function eslemeyiYaz() {
        try { localStorage.setItem(ESLEME_ANAHTARI, JSON.stringify(esleme)); } catch (e) { }
    }

    /* Bir öğe için olabildiğince kalıcı bir seçici üretir. */
    function seciciUret(hedef) {
        if (hedef.id) return '#' + CSS.escape(hedef.id);
        if (hedef.name) {
            var ayni = document.querySelectorAll('[name="' + hedef.name + '"]');
            if (ayni.length === 1) return '[name="' + hedef.name + '"]';
        }
        // Son çare: DOM üzerindeki konumdan yol üret
        var parcalar = [];
        var d = hedef;
        while (d && d.nodeType === 1 && parcalar.length < 6) {
            var parca = d.tagName.toLowerCase();
            if (d.id) { parcalar.unshift('#' + CSS.escape(d.id)); break; }
            var ebeveyn = d.parentNode;
            if (ebeveyn) {
                var kardesler = Array.prototype.filter.call(ebeveyn.children, function (c) {
                    return c.tagName === d.tagName;
                });
                if (kardesler.length > 1) parca += ':nth-of-type(' + (kardesler.indexOf(d) + 1) + ')';
            }
            parcalar.unshift(parca);
            d = ebeveyn;
        }
        return parcalar.join(' > ');
    }

    function hedefBul(secici) {
        try { return document.querySelector(secici); } catch (e) { return null; }
    }

    /* Değeri yazar ve sayfanın haberdar olması için olayları tetikler.
       (ASP.NET / React / jQuery tabanlı sayfaların hepsinde çalışması için) */
    function degerYaz(hedef, deger) {
        if (!hedef) return false;
        var etiket = hedef.tagName.toLowerCase();

        if (etiket === 'select') {
            var bulundu = false;
            var aranan = String(deger).toLocaleLowerCase('tr-TR').trim();
            Array.prototype.forEach.call(hedef.options, function (o) {
                if (bulundu) return;
                var m = (o.textContent || '').toLocaleLowerCase('tr-TR').trim();
                var v = (o.value || '').toLocaleLowerCase('tr-TR').trim();
                if (m === aranan || v === aranan || (aranan && m.indexOf(aranan) === 0)) {
                    hedef.value = o.value; bulundu = true;
                }
            });
            if (!bulundu) return false;
        } else if (hedef.type === 'checkbox') {
            var acik = deger === true || deger === 'Evet' || deger === 'true' || deger === '1';
            if (hedef.checked !== acik) hedef.click();
            return true;
        } else {
            var yerlestirici = Object.getOwnPropertyDescriptor(
                etiket === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
                'value'
            );
            if (yerlestirici && yerlestirici.set) yerlestirici.set.call(hedef, String(deger));
            else hedef.value = String(deger);
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
        hedef.style.outline = '3px solid ' + renk;
        setTimeout(function () { hedef.style.outline = eski; }, 1400);
    }

    /* ---------------- veri alma ---------------- */
    function veriyiCoz(metin) {
        var nesne;
        try { nesne = JSON.parse(metin); } catch (e) { return null; }
        if (!nesne || !Array.isArray(nesne.alanlar)) return null;
        return nesne;
    }

    async function panodanAl() {
        durum('Pano okunuyor...');
        try {
            var metin = await navigator.clipboard.readText();
            var c = veriyiCoz(metin);
            if (!c) { yapistirmaKutusuAc('Panoda geçerli bir kayıt bulunamadı. Aşağıya elle yapıştırın.'); return; }
            kayitYuklendi(c);
        } catch (e) {
            yapistirmaKutusuAc('Tarayıcı pano izni vermedi. Kaydı aşağıya yapıştırın (Ctrl+V).');
        }
    }

    function kayitYuklendi(c) {
        kayit = c;
        try { sessionStorage.setItem(VERI_ANAHTARI, JSON.stringify(c)); } catch (e) { }
        listeyiCiz();
        durum('Kayıt hazır: ' + (c.baslik || (c.alanlar.length + ' alan')), '#4ade80');
    }

    function yapistirmaKutusuAc(mesaj) {
        durum(mesaj, '#fbbf24');
        yapistirmaAlani.style.display = 'block';
        yapistirmaAlani.focus();
    }

    /* ---------------- liste ---------------- */
    function listeyiCiz() {
        listeKutusu.textContent = '';
        if (!kayit) {
            listeKutusu.appendChild(el('div', 'padding:10px; color:#94a3b8; font-size:12px;',
                'Önce başvuru sisteminde bir kaydın yanındaki "E-MESEM\'e Aktar" düğmesine basın, sonra buradan "Panodan Al" deyin.'));
            return;
        }
        kayit.alanlar.forEach(function (a) {
            if (!a.deger && a.deger !== 0) return;
            var satir = el('div', 'display:flex; align-items:center; gap:6px; padding:4px 6px; border-bottom:1px solid #1e293b; font-size:12px;');
            var eslendi = !!esleme[a.id];

            var dugme = el('button', 'flex:0 0 20px; height:20px; border:0; border-radius:4px; cursor:pointer; font-size:11px; background:' +
                (eslendi ? '#16a34a' : '#475569') + '; color:#fff;', eslendi ? '✓' : '+');
            dugme.title = eslendi ? 'Eşleşti - değiştirmek için tıklayın' : 'Tıklayın, sonra E-MESEM\'deki kutuya tıklayın';
            dugme.onclick = function () { ogrenmeyiBaslat(a); };

            var ad = el('span', 'flex:0 0 118px; color:#93c5fd; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;', a.ad);
            ad.title = a.ad;

            var deger = el('span', 'flex:1; color:#e2e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;',
                a.deger === true ? 'Evet' : String(a.deger));
            deger.title = String(a.deger);
            deger.style.cursor = 'copy';
            deger.onclick = function () {
                navigator.clipboard.writeText(String(a.deger)).then(function () {
                    durum(a.ad + ' panoya kopyalandı.', '#4ade80');
                });
            };

            satir.appendChild(dugme); satir.appendChild(ad); satir.appendChild(deger);
            listeKutusu.appendChild(satir);
        });
    }

    /* ---------------- öğretme kipi ---------------- */
    function ogrenmeyiBaslat(alan) {
        ogrenilenAlan = alan;
        document.body.style.cursor = 'crosshair';
        durum('"' + alan.ad + '" için E-MESEM sayfasındaki kutuya tıklayın. (Vazgeçmek için Esc)', '#fbbf24');
    }

    function ogrenmeyiBitir() {
        ogrenilenAlan = null;
        document.body.style.cursor = '';
    }

    document.addEventListener('click', function (olay) {
        if (!ogrenilenAlan) return;
        if (panel.contains(olay.target)) return;
        var hedef = olay.target.closest('input, select, textarea');
        if (!hedef) return;
        olay.preventDefault(); olay.stopPropagation();
        esleme[ogrenilenAlan.id] = seciciUret(hedef);
        eslemeyiYaz();
        vurgula(hedef, '#22c55e');
        durum('"' + ogrenilenAlan.ad + '" eşleştirildi.', '#4ade80');
        ogrenmeyiBitir();
        listeyiCiz();
    }, true);

    document.addEventListener('keydown', function (olay) {
        if (olay.key === 'Escape' && ogrenilenAlan) { ogrenmeyiBitir(); durum('Eşleştirme iptal edildi.'); }
    });

    /* ---------------- doldurma ---------------- */
    function doldur() {
        if (!kayit) { durum('Önce kaydı alın.', '#f87171'); return; }
        var yazilan = 0, atlanan = [];
        kayit.alanlar.forEach(function (a) {
            if (!a.deger && a.deger !== 0) return;
            var secici = esleme[a.id];
            if (!secici) return;
            var hedef = hedefBul(secici);
            if (!hedef) { atlanan.push(a.ad + ' (kutu bulunamadı)'); return; }
            if (degerYaz(hedef, a.deger)) { yazilan++; vurgula(hedef, '#3b82f6'); }
            else atlanan.push(a.ad + ' (uygun seçenek yok)');
        });
        if (!yazilan && !atlanan.length) {
            durum('Hiç alan eşleştirilmemiş. Önce + düğmeleriyle öğretin.', '#fbbf24');
            return;
        }
        durum(yazilan + ' alan dolduruldu.' + (atlanan.length ? ' Atlanan: ' + atlanan.join(', ') : ''),
            atlanan.length ? '#fbbf24' : '#4ade80');
    }

    /* ---------------- panel ---------------- */
    panel = el('div', [
        'position:fixed', 'top:14px', 'right:14px', 'width:340px', 'max-height:80vh',
        'background:#0f172a', 'color:#e2e8f0', 'border:1px solid #334155', 'border-radius:10px',
        'box-shadow:0 12px 34px rgba(0,0,0,.45)', 'z-index:2147483647',
        'font-family:Segoe UI, Arial, sans-serif', 'display:flex', 'flex-direction:column', 'overflow:hidden'
    ].join(';'));

    panel.id = 'mesemYardimciPanel';

    var baslik = el('div', 'display:flex; align-items:center; gap:8px; padding:8px 10px; background:#1e293b; cursor:move; user-select:none;');
    baslik.appendChild(el('strong', 'flex:1; font-size:13px; color:#f59e0b;', 'E-MESEM Doldurma Yardımcısı'));
    var kucultDugme = el('button', 'border:0; background:#334155; color:#e2e8f0; width:22px; height:22px; border-radius:4px; cursor:pointer;', '–');
    var kapatDugme = el('button', 'border:0; background:#7f1d1d; color:#fee; width:22px; height:22px; border-radius:4px; cursor:pointer;', '×');
    baslik.appendChild(kucultDugme); baslik.appendChild(kapatDugme);

    var govde = el('div', 'display:flex; flex-direction:column; min-height:0;');

    var dugmeCubugu = el('div', 'display:flex; flex-wrap:wrap; gap:5px; padding:8px 10px; border-bottom:1px solid #1e293b;');
    function cubukDugmesi(metin, renk, islev) {
        var d = el('button', 'border:0; border-radius:5px; padding:5px 9px; font-size:12px; cursor:pointer; background:' + renk + '; color:#fff;', metin);
        d.onclick = islev;
        dugmeCubugu.appendChild(d);
        return d;
    }
    cubukDugmesi('Panodan Al', '#2563eb', panodanAl);
    cubukDugmesi('Doldur', '#16a34a', doldur);
    cubukDugmesi('Eşleşmeyi Sıfırla', '#7c3aed', function () {
        if (!confirm('Bu sayfa için öğretilen tüm alan eşleştirmeleri silinecek. Emin misiniz?')) return;
        esleme = {}; eslemeyiYaz(); listeyiCiz(); durum('Eşleştirmeler silindi.');
    });

    durumYazi = el('div', 'padding:6px 10px; font-size:11px; color:#cbd5e1; border-bottom:1px solid #1e293b; line-height:1.4;',
        'Hazır. Kaydı almak için "Panodan Al".');

    var yapistirmaAlani = el('textarea',
        'display:none; margin:8px 10px; width:calc(100% - 20px); height:60px; background:#111827; color:#e2e8f0; border:1px solid #334155; border-radius:5px; font-size:11px; padding:5px;');
    yapistirmaAlani.placeholder = 'Kaydı buraya yapıştırın (Ctrl+V)';
    yapistirmaAlani.addEventListener('input', function () {
        var c = veriyiCoz(yapistirmaAlani.value);
        if (c) { kayitYuklendi(c); yapistirmaAlani.style.display = 'none'; yapistirmaAlani.value = ''; }
    });

    listeKutusu = el('div', 'overflow:auto; min-height:60px; max-height:46vh;');

    var altNot = el('div', 'padding:6px 10px; font-size:10px; color:#64748b; border-top:1px solid #1e293b; line-height:1.4;',
        'Alan adının yanındaki + ile bir alanı seçip E-MESEM kutusuna tıklayarak öğretirsiniz. Değere tıklamak onu panoya kopyalar.');

    govde.appendChild(dugmeCubugu);
    govde.appendChild(durumYazi);
    govde.appendChild(yapistirmaAlani);
    govde.appendChild(listeKutusu);
    govde.appendChild(altNot);
    panel.appendChild(baslik);
    panel.appendChild(govde);
    document.body.appendChild(panel);

    /* küçült / kapat */
    kucultDugme.onclick = function () {
        var kapali = govde.style.display === 'none';
        govde.style.display = kapali ? 'flex' : 'none';
        kucultDugme.textContent = kapali ? '–' : '+';
    };
    kapatDugme.onclick = function () { panel.remove(); window.__mesemYardimci = null; };

    /* sürükleme */
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

    /* açılış */
    eslemeyiOku();
    try {
        var son = sessionStorage.getItem(VERI_ANAHTARI);
        if (son) { var c = veriyiCoz(son); if (c) kayit = c; }
    } catch (e) { }
    listeyiCiz();
    if (kayit) durum('Son alınan kayıt yüklendi. Yeni kayıt için "Panodan Al".', '#4ade80');

    window.__mesemYardimci = {
        gorunurluk: function () {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        },
        doldur: doldur
    };
})();
