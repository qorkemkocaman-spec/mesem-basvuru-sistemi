/* ==================================================================
   E-MESEM Başvuru Sistemi - Arşiv & E-MESEM Kayıt Karşılaştırma Modülü
   ------------------------------------------------------------------
   Bu modül, ana uygulama (index.html) yüklendikten sonra çalışır ve:
     1. "Arşiv" sekmesini yönetir
     2. E-MESEM "Sınav Öğrenci Ön Kayıt" ekranından kopyalanan
        TC/Ad Soyad listesi ile web uygulamasındaki kayıtları karşılaştırır
     3. E-MESEM'de GERÇEKTEN kaydedilmiş kişileri ana listeden alıp
        arşive taşır
     4. E-MESEM robotu paneline "Kayıt Listesini Kopyala" butonu ekler
   ================================================================== */
(function () {
    'use strict';

    if (window.__mesemArsivModulu) return;
    window.__mesemArsivModulu = true;

    function hazirMi() {
        return !!(window.__mesemUygulama && document.getElementById('tabArsiv'));
    }

    function bekle(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    // Ana uygulama nesnesi global olarak kullanılabilir durumda değilse,
    // DOM'daki elementler üzerinden erişmeye çalışırız.
    function arsivKayitlariniGetir() {
        try {
            // Ana uygulama değişkenlerine erişim için global scope'u dene
            if (window.arsivKayitlar && Array.isArray(window.arsivKayitlar)) return window.arsivKayitlar;
            // localStorage'dan oku
            const aktifKurum = localStorage.getItem('mesem_aktif_kurum') || '';
            const anahtar = 'mesem_arsiv_' + aktifKurum;
            const veri = localStorage.getItem(anahtar);
            return veri ? JSON.parse(veri) : [];
        } catch (e) {
            return [];
        }
    }

    function anaKayitlariGetir() {
        try {
            if (window.kayitlar && Array.isArray(window.kayitlar)) return window.kayitlar;
            const aktifKurum = localStorage.getItem('mesem_aktif_kurum') || '';
            const anahtar = 'mesem_kayitlar_' + aktifKurum;
            const veri = localStorage.getItem(anahtar);
            return veri ? JSON.parse(veri) : [];
        } catch (e) {
            return [];
        }
    }

    /* ============================================================
       E-MESEM KAYIT LİSTESİ ÇÖZÜMLEME
       E-MESEM "Sınav Öğrenci Ön Kayıt" ekranındaki kayıt listesi
       tablosundan kopyalanan metin şu formatlarda olabilir:
         - TC Kimlik No + Ad Soyad (sekmeli tablo)
         - Sekme adları (Kalfalık Sınavı / Ustalık Sınavı / İş Pedagojisi)
       Bu fonksiyon her iki formatı da çözer ve TC -> {tc, ad, soyad, kategori}
       şeklinde normalize edilmiş bir liste döndürür.
       ============================================================ */
    function emesemKayitListesiniCoz(metin) {
        if (!metin || typeof metin !== 'string') return [];
        const satirlar = metin.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const sonuc = [];
        let aktifKategori = null;

        const kategoriEslestir = (s) => {
            const k = s.toLocaleLowerCase('tr-TR');
            if (k.includes('pedagoji') || k.includes('usta ogretici')) return 'İş Pedagojisi Kursu';
            if (k.includes('ustalik')) return 'Ustalık Sınavı';
            if (k.includes('kalfalik')) return 'Kalfalık Sınavı';
            return null;
        };

        for (const satir of satirlar) {
            // Sekme başlığı satırı mı?
            const kategori = kategoriEslestir(satir);
            if (kategori && satir.length < 60 && !/\d{11}/.test(satir)) {
                aktifKategori = kategori;
                continue;
            }

            // TC Kimlik No içeren satır mı?
            const tcMatch = satir.match(/\b([1-9][0-9]{10})\b/);
            if (!tcMatch) continue;
            const tc = tcMatch[1];

            // TC'den sonraki metni ad soyad olarak al
            const tcIndex = satir.indexOf(tc);
            let adSoyadMetin = satir.substring(tcIndex + tc.length).trim();
            // Baştaki ayraçları temizle
            adSoyadMetin = adSoyadMetin.replace(/^[\s\t|,;\-–—]+/, '').trim();
            // Sondaki fazlalıkları temizle (doğum tarihi, telefon vb.)
            adSoyadMetin = adSoyadMetin
                .replace(/\s{2,}/g, ' ')
                .replace(/\t+/g, ' ')
                .replace(/\|+/g, ' ')
                .replace(/\d{2}[./]\d{2}[./]\d{4}/g, '')  // Doğum tarihi
                .replace(/\d{2}[./]\d{2}[./]\d{2}/g, '')   // Kısa tarih
                .replace(/0[5-9]\d{8}/g, '')               // Telefon
                .replace(/5\d{8}/g, '')                    // Telefon (kısa)
                .trim();

            // Ad Soyad'ı parçala
            const adSoyadParts = adSoyadMetin.split(/\s+/).filter(Boolean);
            let ad = '';
            let soyad = '';
            if (adSoyadParts.length === 1) {
                ad = adSoyadParts[0];
            } else if (adSoyadParts.length >= 2) {
                ad = adSoyadParts[0];
                soyad = adSoyadParts.slice(1).join(' ');
            }

            sonuc.push({
                tc: tc,
                ad: ad,
                soyad: soyad,
                kategori: aktifKategori
            });
        }

        return sonuc;
    }

    /* ============================================================
       E-MESEM KAYIT KARŞILAŞTIRMA & ARŞİVE TAŞIMA
       ============================================================ */
    function arsiveTasi(kayitlar, arsivListesi) {
        if (!kayitlar || !arsivListesi || !arsivListesi.length) return { tasinan: 0, bulunamayan: 0 };

        const eslesenTcler = new Set(arsivListesi.map(k => k.tc));
        const tasinan = [];
        const kalan = [];

        for (const k of kayitlar) {
            if (eslesenTcler.has(String(k.tc || ''))) {
                const arsivKaydi = arsivListesi.find(a => a.tc === String(k.tc));
                const tasinanKayit = Object.assign({}, k, {
                    arsivTarihi: new Date().toISOString(),
                    arsivTC: arsivKaydi ? arsivKaydi.tc : k.tc,
                    arsivAdSoyad: arsivKaydi ? (arsivKaydi.ad + ' ' + arsivKaydi.soyad).trim() : (k.ad + ' ' + k.soyad).trim()
                });
                tasinan.push(tasinanKayit);
            } else {
                kalan.push(k);
            }
        }

        return { tasinan: tasinan, kalan: kalan };
    }

    /* ============================================================
       ARAYÜZ: ARŞİV BUTONLARI VE MODAL
       ============================================================ */
    function arsivPaneliniOlustur() {
        // Ana actions çubuğuna "Arşiv" butonu ekle
        const actionsBar = document.querySelector('.actions');
        if (!actionsBar) return;
        if (document.getElementById('btnArsivYonetimi')) return;

        const btnArsiv = document.createElement('button');
        btnArsiv.id = 'btnArsivYonetimi';
        btnArsiv.className = 'btn btn-secondary';
        btnArsiv.type = 'button';
        btnArsiv.innerHTML = '📦 Arşiv & E-MESEM Karşılaştırma';
        btnArsiv.style.background = '#334155';
        btnArsiv.addEventListener('click', arsivModaliAc);
        actionsBar.appendChild(btnArsiv);
    }

    function arsivModaliGoster() {
        // Modal var mı kontrol et, yoksa oluştur
        let modal = document.getElementById('arsivYonetimModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'arsivYonetimModal';
            modal.className = 'modal-overlay';
            modal.style.cssText = 'display:none;';
            modal.innerHTML = `
                <div class="modal-box dark" style="max-width:1100px;">
                    <button class="close-btn" id="btnArsivKapat" type="button">&#10005;</button>
                    <h2 style="color:var(--primary); margin-top:0; display:flex; align-items:center; gap:8px;">📦 Arşiv & E-MESEM Kayıt Karşılaştırma</h2>
                    <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
                        E-MESEM "Sınav Öğrenci Ön Kayıt" ekranındaki kayıt listesinden kopyaladığınız
                        <strong>TC Kimlik No ve Ad Soyad</strong> bilgilerini aşağıya yapıştırın.
                        Eşleşen kişiler ana listeden silinip arşive taşınır.
                    </p>

                    <div style="background:#0f172a; padding:16px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:14px;">
                        <div style="font-weight:700; color:#c084fc; font-size:14px; margin-bottom:8px;">📋 E-MESEM Kayıt Listesini Yapıştırın</div>
                        <textarea id="arsivEmesemListe" rows="8" style="width:100%; font-family:monospace; font-size:12px; background:#0f172a; color:#fff; border:1px solid #475569; border-radius:6px; padding:10px;"
                            placeholder="E-MESEM ekranındaki kayıt listesi tablosunu seçip Ctrl+C ile kopyalayın, ardından buraya Ctrl+V ile yapıştırın.&#10;&#10;Örnek:&#10;10000000146  AHMET YILMAZ&#10;10000000238  MEHMET DEMİR&#10;..."></textarea>
                        <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                            <button class="btn btn-success btn-sm" id="btnArsivKarsilastir" type="button" style="font-weight:bold;">🔍 Karşılaştır ve Arşive Taşı</button>
                            <button class="btn btn-secondary btn-sm" id="btnArsivOrnekDoldur" type="button">📝 Örnek Doldur</button>
                            <button class="btn btn-teal btn-sm" id="btnArsivTumunuKopyala" type="button">📋 Arşivdekileri Kopyala</button>
                            <button class="btn btn-danger btn-sm" id="btnArsivTemizle" type="button">🗑️ Arşivi Temizle</button>
                        </div>
                        <div id="arsivSonuc" style="margin-top:10px; font-size:13px; color:var(--primary); line-height:1.6;"></div>
                    </div>

                    <div style="display:flex; gap:12px;">
                        <div style="flex:1; background:#0f172a; padding:14px; border-radius:8px; border:1px solid var(--border-color); min-width:0;">
                            <div style="font-weight:700; color:#38bdf8; font-size:13px; margin-bottom:8px;">📚 Ana Liste</div>
                            <div id="arsivAnaListeOzet" style="font-size:12px; color:#94a3b8;">Yükleniyor...</div>
                        </div>
                        <div style="flex:1; background:#0f172a; padding:14px; border-radius:8px; border:1px solid var(--border-color); min-width:0;">
                            <div style="font-weight:700; color:#4ade80; font-size:13px; margin-bottom:8px;">📦 Arşiv</div>
                            <div id="arsivListeOzet" style="font-size:12px; color:#94a3b8;">Yükleniyor...</div>
                        </div>
                    </div>

                    <div style="margin-top:16px; text-align:right;">
                        <button class="btn btn-secondary" id="btnArsivKapat2" type="button">Kapat</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Olayları bağla
            modal.querySelector('#btnArsivKapat').addEventListener('click', () => modal.style.display = 'none');
            modal.querySelector('#btnArsivKapat2').addEventListener('click', () => modal.style.display = 'none');
            modal.querySelector('#btnArsivKarsilastir').addEventListener('click', arsivKarsilastirVeTasi);
            modal.querySelector('#btnArsivOrnekDoldur').addEventListener('click', arsivOrnekDoldur);
            modal.querySelector('#btnArsivTumunuKopyala').addEventListener('click', arsivleriKopyala);
            modal.querySelector('#btnArsivTemizle').addEventListener('click', arsiviTemizle);
        }

        arsivOzetleriGuncelle();
        modal.style.display = 'flex';
    }

    function arsivModaliAc() {
        arsivModaliGoster();
    }

    /* ============================================================
       ARŞİV İŞLEMLERİ
       ============================================================ */
    function arsivKarsilastirVeTasi() {
        const alan = document.getElementById('arsivEmesemListe');
        const sonuc = document.getElementById('arsivSonuc');
        if (!alan || !sonuc) return;

        const metin = alan.value;
        if (!metin.trim()) {
            sonuc.innerHTML = '<span style="color:#ef4444;">⚠️ Lütfen önce E-MESEM kayıt listesini yapıştırın.</span>';
            return;
        }

        const emesemListesi = emesemKayitListesiniCoz(metin);
        if (!emesemListesi.length) {
            sonuc.innerHTML = '<span style="color:#ef4444;">❌ Yapıştırılan metinde geçerli TC Kimlik No bulunamadı. Lütfen E-MESEM kayıt listesi tablosunu doğru kopyaladığınızdan emin olun.</span>';
            return;
        }

        // Ana uygulama kayıtlarını localStorage'dan oku
        const aktifKurum = localStorage.getItem('mesem_aktif_kurum') || '';
        const anahtar = 'mesem_kayitlar_' + aktifKurum;
        let anaKayitlar = [];
        try {
            anaKayitlar = JSON.parse(localStorage.getItem(anahtar) || '[]');
        } catch (e) {
            anaKayitlar = [];
        }

        if (!anaKayitlar || !anaKayitlar.length) {
            sonuc.innerHTML = `<span style="color:#fbbf24;">⚠️ Ana listede kayıtlı aday bulunamadı (${aktifKurum || 'kurum bilinmiyor'}). Önce kayıt ekleyin veya buluttan yükleyin.</span>`;
            return;
        }

        const { tasinan, kalan } = arsiveTasi(anaKayitlar, emesemListesi);
        if (tasinan.length === 0) {
            sonuc.innerHTML = `<span style="color:#fbbf24;">ℹ️ E-MESEM listesindeki TC'lerle eşleşen kayıt bulunamadı (${emesemListesi.length} TC, ${anaKayitlar.length} kayıt).</span>`;
            return;
        }

        // localStorage'a yaz - ana liste ve arşiv
        try {
            if (aktifKurum) {
                localStorage.setItem('mesem_kayitlar_' + aktifKurum, JSON.stringify(kalan));
                const arsivAnahtar = 'mesem_arsiv_' + aktifKurum;
                let mevcutArsiv = [];
                try { mevcutArsiv = JSON.parse(localStorage.getItem(arsivAnahtar) || '[]'); } catch (e) { mevcutArsiv = []; }
                localStorage.setItem(arsivAnahtar, JSON.stringify(mevcutArsiv.concat(tasinan)));
            }
        } catch (e) {
            console.error('Arşive taşıma localStorage hatası:', e);
        }

        // Sayfayı yenile - böylece kayitlar ve arsivKayitlar değişkenleri güncellenir
        location.reload();

        const tasinanOzet = tasinan.map(k => `${k.ad || ''} ${k.soyad || ''} (${k.tc})`).slice(0, 5).join(', ');
        sonuc.innerHTML = `
            <div style="color:#4ade80; font-weight:bold; margin-bottom:6px;">✅ ${tasinan.length} kişi E-MESEM kayıt listesiyle eşleşti ve arşive taşındı.</div>
            <div style="font-size:12px; color:#94a3b8;">${tasinan.length > 5 ? tasinanOzet + ' ...' : tasinanOzet}</div>
            <div style="font-size:12px; color:#fbbf24; margin-top:4px;">Ana listede ${kalan.length} kayıt kaldı.</div>
        `;

        arsivOzetleriGuncelle();
        alan.value = '';
    }

    function arsivOrnekDoldur() {
        const alan = document.getElementById('arsivEmesemListe');
        if (!alan) return;
        alan.value = `Kalfalık Sınavı
10000000146  AHMET YILMAZ
10000000238  MEHMET DEMİR

Ustalık Sınavı
10000000349  ALİ KAYA

İş Pedagojisi Kursu
10000000450  AYŞE ŞAHİN`;
    }

    function arsivleriKopyala() {
        const arsiv = window.arsivKayitlar || [];
        if (!arsiv.length) {
            const sonuc = document.getElementById('arsivSonuc');
            if (sonuc) sonuc.innerHTML = '<span style="color:#fbbf24;">⚠️ Arşivde kayıt bulunmuyor.</span>';
            return;
        }
        const metin = arsiv.map(k => `${k.tc || ''}  ${k.ad || ''} ${k.soyad || ''}`.trim()).join('\n');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(metin).then(() => {
                const sonuc = document.getElementById('arsivSonuc');
                if (sonuc) sonuc.innerHTML = `<span style="color:#4ade80;">✅ ${arsiv.length} arşiv kaydı panoya kopyalandı.</span>`;
            });
        } else {
            // Fallback
            const sonuc = document.getElementById('arsivSonuc');
            if (sonuc) sonuc.innerHTML = `<span style="color:#fbbf24;">⚠️ Pano erişimi yok. F12 konsolundan kopyalayın.</span>`;
        }
    }

    function arsiviTemizle() {
        if (!confirm('Arşivdeki tüm kayıtlar silinecek. Emin misiniz?')) return;
        window.arsivKayitlar = [];
        try {
            const aktifKurum = localStorage.getItem('mesem_aktif_kurum') || '';
            if (aktifKurum) localStorage.setItem('mesem_arsiv_' + aktifKurum, '[]');
        } catch (e) { }
        if (typeof window.tumunuYenile === 'function') window.tumunuYenile();
        if (typeof window.sekmeSayaclariniGuncelle === 'function') window.sekmeSayaclariniGuncelle();
        arsivOzetleriGuncelle();
        const sonuc = document.getElementById('arsivSonuc');
        if (sonuc) sonuc.innerHTML = '<span style="color:#4ade80;">✅ Arşiv temizlendi.</span>';
    }

    function arsivOzetleriGuncelle() {
        const anaOzet = document.getElementById('arsivAnaListeOzet');
        const arsivOzet = document.getElementById('arsivListeOzet');
        if (!anaOzet || !arsivOzet) return;

        const ana = window.kayitlar || [];
        const arsiv = window.arsivKayitlar || [];

        let anaKalfalik = 0, anaUstalik = 0, anaPedagoji = 0;
        ana.forEach(k => {
            const tur = String(k.basvuruTuru || '').toLocaleLowerCase('tr-TR');
            if (tur.includes('pedagoji')) anaPedagoji++;
            else if (tur.includes('ustalik')) anaUstalik++;
            else anaKalfalik++;
        });

        let arsivKalfalik = 0, arsivUstalik = 0, arsivPedagoji = 0;
        arsiv.forEach(k => {
            const tur = String(k.basvuruTuru || '').toLocaleLowerCase('tr-TR');
            if (tur.includes('pedagoji')) arsivPedagoji++;
            else if (tur.includes('ustalik')) arsivUstalik++;
            else arsivKalfalik++;
        });

        anaOzet.innerHTML = `
            <div>Toplam: <strong style="color:#fff;">${ana.length}</strong></div>
            <div style="font-size:11px; margin-top:4px;">
                🔹 Kalfalık: ${anaKalfalik}<br>
                🔹 Ustalık: ${anaUstalik}<br>
                🔹 Pedagoji: ${anaPedagoji}
            </div>
        `;
        arsivOzet.innerHTML = `
            <div>Toplam: <strong style="color:#fff;">${arsiv.length}</strong></div>
            <div style="font-size:11px; margin-top:4px;">
                🔹 Kalfalık: ${arsivKalfalik}<br>
                🔹 Ustalık: ${arsivUstalik}<br>
                🔹 Pedagoji: ${arsivPedagoji}
            </div>
        `;
    }

    /* ============================================================
       E-MESEM ROBOTU İÇİN "KAYIT LİSTESİNİ KOPYALA" BUTONU
       Bu buton robot panelinde görünür. E-MESEM ekranındaki kayıt
       listesi tablosunu seçip panoya kopyalamayı sağlar.
       ============================================================ */
    function robotKayitListesiKopyala() {
        const belgeler = [document];
        try {
            const iframeler = document.querySelectorAll('iframe, frame');
            for (const f of iframeler) {
                try {
                    const d = f.contentDocument || (f.contentWindow && f.contentWindow.document);
                    if (d && d.body) belgeler.push(d);
                } catch (e) { }
            }
        } catch (e) { }

        // E-MESEM kayıt listesi tablosunu bul
        let tabloBulundu = null;
        for (const doc of belgeler) {
            // Muhtemel kayıt listesi tabloları
            const adaylar = doc.querySelectorAll('table');
            for (const t of adaylar) {
                const metin = t.textContent || '';
                if (/\d{11}/.test(metin) && (metin.includes('TC') || metin.includes('Kimlik') || metin.includes('Ad') || metin.includes('Soyad') || metin.includes('Ön Kayıt'))) {
                    tabloBulundu = t;
                    break;
                }
            }
            if (tabloBulundu) break;

            // Grid/liste div'leri de dene
            const gridler = doc.querySelectorAll('.rgMasterTable, .RadGrid, table.rgMasterTable, .k-grid, div[role="grid"] table');
            for (const g of gridler) {
                if (/\d{11}/.test(g.textContent || '')) {
                    tabloBulundu = g;
                    break;
                }
            }
            if (tabloBulundu) break;
        }

        if (!tabloBulundu) {
            return { basarili: false, mesaj: 'Kayıt listesi tablosu bulunamadı. Lütfen "Sınav Öğrenci Ön Kayıt" ekranında olduğunuzdan emin olun.' };
        }

        // Tabloyu TSV (sekmeyle ayrılmış) metne çevir
        const satirlar = [];
        const trler = tabloBulundu.querySelectorAll('tr');
        for (const tr of trler) {
            const hucreler = tr.querySelectorAll('th, td');
            const satirMetni = Array.from(hucreler).map(h => (h.textContent || '').trim()).join('\t');
            if (satirMetni.trim()) satirlar.push(satirMetni);
        }

        const metin = satirlar.join('\n');
        if (!metin.trim()) {
            return { basarili: false, mesaj: 'Tablo boş görünüyor.' };
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(metin).then(() => {
                return { basarili: true, mesaj: 'Kayıt listesi panoya kopyalandı (' + satirlar.length + ' satır).' };
            }).catch(() => {
                return { basarili: false, mesaj: 'Pano erişimi reddedildi. Manuel kopyalayın.' };
            });
        }

        // Fallback: seç ve kopyala
        try {
            const range = document.createRange();
            range.selectNodeContents(tabloBulundu);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('copy');
            sel.removeAllRanges();
            return { basarili: true, mesaj: 'Kayıt listesi panoya kopyalandı (' + satirlar.length + ' satır).' };
        } catch (e) {
            return { basarili: false, mesaj: 'Kopyalama hatası: ' + e.message };
        }
    }

    /* ============================================================
       BAŞLATMA
       ============================================================ */
    function baslat() {
        // Ana uygulama global değişkenlerine erişim kur
        // index.html'deki script global değişkenlerini kullanmak için
        // window üzerinden erişim sağla (let değişkenleri window'a yazılmaz).
        // Bu nedenle localStorage üzerinden senkronize oluruz.

        // Arşiv butonunu ana sayfaya ekle
        arsivPaneliniOlustur();

        // E-MESEM robotu paneline buton ekleme işlemi robot tarafındadır (emesem-yardimci.js)
        // Burada sadece ana uygulama tarafındaki butonları bağlarız.

        // Arşiv sekmesi tıklaması zaten index.html'de işleniyor
        // tabArsiv elementine tıklama dinleyicisi ekleyelim (index.html'de eklenmediyse)
        const tabArsiv = document.getElementById('tabArsiv');
        if (tabArsiv && !tabArsiv.dataset.arsivBagli) {
            tabArsiv.dataset.arsivBagli = '1';
            tabArsiv.addEventListener('click', function () {
                if (typeof window.navSekmeDegistir === 'function') {
                    window.navSekmeDegistir('Arsiv');
                } else {
                    // Fallback: sekme değişimini elle yap
                    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
                    tabArsiv.classList.add('active');
                    const form = document.getElementById('basvuruForm');
                    if (form) form.style.display = 'none';
                    const baslik = document.getElementById('tabloBaslikYazi');
                    if (baslik) baslik.textContent = '📦 Arşivlenmiş E-MESEM Kayıtları';
                }
            });
        }

        // Başlangıçta arşiv sayacını güncelle
        if (typeof window.sekmeSayaclariniGuncelle === 'function') {
            setTimeout(window.sekmeSayaclariniGuncelle, 500);
        }
    }

    // Ana uygulama yüklendikten sonra başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(baslat, 1000);
        });
    } else {
        setTimeout(baslat, 1000);
    }

    // Window API'si
    window.__mesemArsiv = {
        arsivKarsilastirVeTasi: arsivKarsilastirVeTasi,
        arsivModaliAc: arsivModaliAc,
        emesemKayitListesiniCoz: emesemKayitListesiniCoz,
        robotKayitListesiKopyala: robotKayitListesiKopyala
    };
})();