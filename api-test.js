/* ------------------------------------------------------------------
   API testleri — gerçek Postgres üzerinde uçtan uca çalışır.
   Çalıştırma: node api-test.js   (yerel-sunucu.js açık olmalı)
------------------------------------------------------------------- */
const KOK = process.env.KOK || 'http://localhost:3000';
const YONETIM = process.env.ADMIN_ANAHTARI;

let hata = 0;
function kontrol(ad, kosul, ek) {
    if (kosul) console.log('  OK   ' + ad);
    else { hata++; console.log('  HATA ' + ad + (ek ? ' -> ' + ek : '')); }
}

async function cagir(yol, govde, basliklar) {
    const yanit = await fetch(KOK + yol, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, basliklar || {}),
        body: JSON.stringify(govde)
    });
    let sonuc;
    try { sonuc = await yanit.json(); } catch (e) { sonuc = { status: 'error', message: 'json degil' }; }
    sonuc._http = yanit.status;
    return sonuc;
}

const yonetim = (g) => cagir('/api/kurum', g, { 'x-yonetim-anahtari': YONETIM });
const veri = (g) => cagir('/api/veri', g);

const kayitOrnek = (id, ad, tc, sira) => ({
    id, sira, basvuruNo: 'K202608-000' + sira, kayitTarihi: new Date().toISOString(),
    ad, soyad: 'Test', tc, dogumTarihi: '2008-01-01', alan: 'Metal Teknolojisi',
    dal: 'Kaynakçılık', basvuruTuru: 'Ustalık/Kalfalık', kalfalikSinavGir: true
});

(async () => {
    console.log('== 1. Ping ==');
    const p = await veri({ action: 'ping' });
    kontrol('Sunucu yanıt veriyor', p.status === 'success', JSON.stringify(p));

    console.log('\n== 2. Yönetim anahtarı ==');
    const yetkisiz = await cagir('/api/kurum', { action: 'listele' }, { 'x-yonetim-anahtari': 'yanlis-anahtar-123456' });
    kontrol('Yanlış anahtar reddedildi', yetkisiz._http === 401);
    kontrol('Anahtarsız istek reddedildi', (await cagir('/api/kurum', { action: 'listele' }))._http === 401);

    console.log('\n== 3. Kurum ekleme ==');
    const damga = Date.now().toString().slice(-6);
    const kurumA = 'TEST_A_' + damga;
    const kurumB = 'TEST_B_' + damga;
    kontrol('Kurum A eklendi', (await yonetim({ action: 'ekle', kurum: kurumA, sifre: 'GucluSifre123' })).status === 'success');
    kontrol('Kurum B eklendi', (await yonetim({ action: 'ekle', kurum: kurumB, sifre: 'BaskaSifre456' })).status === 'success');
    kontrol('Aynı kurum ikinci kez eklenemiyor',
        (await yonetim({ action: 'ekle', kurum: kurumA, sifre: 'GucluSifre123' }))._http === 409);
    kontrol('Kısa şifre reddedildi',
        (await yonetim({ action: 'ekle', kurum: 'TEST_C_' + damga, sifre: '123' }))._http === 400);
    const liste = await yonetim({ action: 'listele' });
    kontrol('Listede kurumlar görünüyor', liste.data.some(k => k.kurum === kurumA));
    kontrol('Listede şifre bilgisi dönmüyor', !JSON.stringify(liste.data).includes('sifre_ozeti'));

    console.log('\n== 4. Giriş ==');
    kontrol('Yanlış şifre reddedildi',
        (await veri({ action: 'login', kurum: kurumA, data: { sifre: 'yanlis' } }))._http === 401);
    kontrol('Olmayan kurum reddedildi',
        (await veri({ action: 'login', kurum: 'YOK_' + damga, data: { sifre: 'birsey123' } }))._http === 401);
    const girisA = await veri({ action: 'login', kurum: kurumA, data: { sifre: 'GucluSifre123' } });
    kontrol('Doğru şifreyle giriş yapıldı', girisA.status === 'success' && !!girisA.token);
    const girisB = await veri({ action: 'login', kurum: kurumB, data: { sifre: 'BaskaSifre456' } });
    kontrol('İkinci kurum da girdi', !!girisB.token);
    kontrol('Kurum adı büyük harfe çevriliyor',
        (await veri({ action: 'login', kurum: kurumA.toLowerCase(), data: { sifre: 'GucluSifre123' } })).status === 'success');

    console.log('\n== 5. Oturum kontrolü ==');
    kontrol('Anahtarsız veri okunamıyor',
        (await veri({ action: 'load', kurum: kurumA })).status === 'unauthorized');
    kontrol('Bozuk anahtar reddedildi',
        (await veri({ action: 'load', kurum: kurumA, token: 'uydurma.anahtar' })).status === 'unauthorized');
    kontrol('A kurumunun anahtarı B kurumunda çalışmıyor',
        (await veri({ action: 'load', kurum: kurumB, token: girisA.token })).status === 'unauthorized');

    console.log('\n== 6. Kayıt yazma / okuma ==');
    const k1 = kayitOrnek('id-1', 'Ahmet', '10000000146', 1);
    const k2 = kayitOrnek('id-2', 'Elif', '14502232470', 2);
    const yazma = await veri({
        action: 'sync', kurum: kurumA, token: girisA.token,
        data: [
            { tip: 'upsert', id: k1.id, kayit: k1, ts: new Date().toISOString() },
            { tip: 'upsert', id: k2.id, kayit: k2, ts: new Date().toISOString() }
        ]
    });
    kontrol('İki kayıt yazıldı', yazma.yazilan === 2, JSON.stringify(yazma));
    const okuma = await veri({ action: 'load', kurum: kurumA, token: girisA.token });
    kontrol('İki kayıt okundu', okuma.data.length === 2, 'gelen: ' + okuma.data.length);
    kontrol('Alanlar bozulmadan geldi',
        okuma.data[0].ad === 'Ahmet' && okuma.data[0].tc === '10000000146' && okuma.data[0].kalfalikSinavGir === true);
    kontrol('Sıra numarasına göre sıralı', okuma.data[0].sira === 1 && okuma.data[1].sira === 2);
    kontrol('Güncelleme damgası eklendi', !!okuma.data[0].guncelleme);

    console.log('\n== 7. Kurumların verisi ayrı ==');
    const okumaB = await veri({ action: 'load', kurum: kurumB, token: girisB.token });
    kontrol('B kurumu A kurumunun kayıtlarını görmüyor', okumaB.data.length === 0, 'gelen: ' + okumaB.data.length);
    await veri({
        action: 'sync', kurum: kurumB, token: girisB.token,
        data: [{ tip: 'upsert', id: 'id-1', kayit: kayitOrnek('id-1', 'BaskaKurum', '17500543050', 1), ts: new Date().toISOString() }]
    });
    const tekrarA = await veri({ action: 'load', kurum: kurumA, token: girisA.token });
    kontrol('Aynı id iki kurumda çakışmıyor',
        tekrarA.data.find(k => k.id === 'id-1').ad === 'Ahmet');

    console.log('\n== 8. Çakışma koruması (eski damga yazamaz) ==');
    const eski = new Date(Date.now() - 60000).toISOString();
    const eskiYazma = await veri({
        action: 'sync', kurum: kurumA, token: girisA.token,
        data: [{ tip: 'upsert', id: 'id-1', kayit: Object.assign({}, k1, { ad: 'ESKI' }), ts: eski }]
    });
    kontrol('Eski damgalı yazma atlandı', eskiYazma.atlanan === 1, JSON.stringify(eskiYazma));
    const sonrasi = await veri({ action: 'load', kurum: kurumA, token: girisA.token });
    kontrol('Kayıt bozulmadı', sonrasi.data.find(k => k.id === 'id-1').ad === 'Ahmet');

    const yeniYazma = await veri({
        action: 'sync', kurum: kurumA, token: girisA.token,
        data: [{ tip: 'upsert', id: 'id-1', kayit: Object.assign({}, k1, { ad: 'Ahmet Güncel' }), ts: new Date().toISOString() }]
    });
    kontrol('Yeni damgalı güncelleme geçti', yeniYazma.yazilan === 1);
    kontrol('Güncel değer okundu',
        (await veri({ action: 'load', kurum: kurumA, token: girisA.token })).data.find(k => k.id === 'id-1').ad === 'Ahmet Güncel');

    console.log('\n== 9. Silme ==');
    const silme = await veri({
        action: 'sync', kurum: kurumA, token: girisA.token,
        data: [{ tip: 'sil', id: 'id-2', ts: new Date().toISOString() }]
    });
    kontrol('Kayıt silindi', silme.silinen === 1, JSON.stringify(silme));
    const silmeSonrasi = await veri({ action: 'load', kurum: kurumA, token: girisA.token });
    kontrol('Silinen kayıt listede yok', silmeSonrasi.data.length === 1 && !silmeSonrasi.data.some(k => k.id === 'id-2'));

    console.log('\n== 10. Şifre değiştirme ==');
    kontrol('Şifre değişti',
        (await yonetim({ action: 'sifreDegistir', kurum: kurumA, sifre: 'YeniSifre789' })).status === 'success');
    kontrol('Eski şifre artık geçersiz',
        (await veri({ action: 'login', kurum: kurumA, data: { sifre: 'GucluSifre123' } }))._http === 401);
    const yeniGiris = await veri({ action: 'login', kurum: kurumA, data: { sifre: 'YeniSifre789' } });
    kontrol('Yeni şifreyle giriş yapılıyor', yeniGiris.status === 'success');
    kontrol('Şifre değişince veriler yerinde',
        (await veri({ action: 'load', kurum: kurumA, token: yeniGiris.token })).data.length === 1);

    console.log('\n== 11. Kurumu askıya alma ==');
    kontrol('Kurum askıya alındı',
        (await yonetim({ action: 'durum', kurum: kurumB, aktif: false })).status === 'success');
    kontrol('Askıdaki kurum giriş yapamıyor',
        (await veri({ action: 'login', kurum: kurumB, data: { sifre: 'BaskaSifre456' } }))._http === 401);
    kontrol('Kurum geri açıldı',
        (await yonetim({ action: 'durum', kurum: kurumB, aktif: true })).status === 'success');
    kontrol('Geri açılan kurum giriş yapıyor',
        (await veri({ action: 'login', kurum: kurumB, data: { sifre: 'BaskaSifre456' } })).status === 'success');

    console.log('\n== 12. Hatalı deneme sınırı ==');
    const kurumD = 'TEST_D_' + damga;
    await yonetim({ action: 'ekle', kurum: kurumD, sifre: 'SinirTesti123' });
    let kilitlendi = false;
    for (let i = 0; i < 7; i++) {
        const d = await veri({ action: 'login', kurum: kurumD, data: { sifre: 'yanlis' } });
        if (d._http === 429) { kilitlendi = true; break; }
    }
    kontrol('5 hatalı denemeden sonra kilitlendi', kilitlendi);
    kontrol('Kilitliyken doğru şifre de beklemeli',
        (await veri({ action: 'login', kurum: kurumD, data: { sifre: 'SinirTesti123' } }))._http === 429);

    console.log('\n== 13. Temizleme (yedekli) ==');
    kontrol('Yanlış onayla temizlenmiyor',
        (await veri({ action: 'clear', kurum: kurumA, token: yeniGiris.token, data: { onay: 'YANLIS' } }))._http === 400);
    const temizle = await veri({ action: 'clear', kurum: kurumA, token: yeniGiris.token, data: { onay: kurumA } });
    kontrol('Temizlendi ve yedek bırakıldı', temizle.status === 'success' && !!temizle.yedek, JSON.stringify(temizle));
    kontrol('Liste boşaldı',
        (await veri({ action: 'load', kurum: kurumA, token: yeniGiris.token })).data.length === 0);

    console.log('\n== 14. Sınırlar ==');
    kontrol('500\'den fazla işlem reddedildi',
        (await veri({
            action: 'sync', kurum: kurumB, token: girisB.token,
            data: new Array(501).fill(0).map((_, i) => ({ tip: 'upsert', id: 'x' + i, kayit: kayitOrnek('x' + i, 'A', '1', 1), ts: new Date().toISOString() }))
        }))._http === 413);
    kontrol('Bilinmeyen işlem reddedildi',
        (await veri({ action: 'saçma', kurum: kurumB, token: girisB.token }))._http === 400);
    const getIstek = await fetch(KOK + '/api/veri');
    kontrol('GET isteği reddedildi', getIstek.status === 405);

    console.log('\n' + (hata === 0 ? 'TÜM API TESTLERİ GEÇTİ' : hata + ' API TESTİ BAŞARISIZ'));
    process.exit(hata === 0 ? 0 : 1);
})();
