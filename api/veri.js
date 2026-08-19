/* ------------------------------------------------------------------
   Tek uç nokta: /api/veri
   Gövde: { action, kurum, token, data }
   Yanıt: { status: 'success' | 'error' | 'unauthorized', ... }

   İşlemler
     ping   → sunucu ayakta mı (tarayıcı bunu görürse bulut moduna geçer)
     login  → kurum + şifre doğrulaması, 8 saatlik oturum anahtarı verir
     load   → kurumun tüm kayıtları
     sync   → kayıt bazında upsert / sil (çakışma damgasıyla)
     clear  → kurumun tüm kayıtlarını sil (önce yedek satırı bırakır)

   Her istekte oturum anahtarı zorunludur ve anahtardaki kurum ile
   istekteki kurum aynı olmak zorundadır: bir kurum başkasının
   verisine hiçbir şekilde erişemez.
------------------------------------------------------------------- */
import { baglanti, semayiHazirla } from '../lib/db.js';
import { anahtarUret, anahtariCoz, sifreDogruMu, kurumAdiniDuzelt } from '../lib/kimlik.js';

const DENEME_SINIRI = 5;              // 15 dakikada en fazla 5 hatalı şifre
const DENEME_PENCERESI_DK = 15;

export const config = { runtime: 'nodejs' };

function yanit(res, kod, govde) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(kod).json(govde);
}

async function govdeyiOku(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    let metin = '';
    if (typeof req.body === 'string') {
        metin = req.body;
    } else {
        metin = await new Promise((coz) => {
            let t = '';
            req.on('data', (p) => { t += p; });
            req.on('end', () => coz(t));
        });
    }
    if (!metin) return {};
    try { return JSON.parse(metin); } catch (e) { return {}; }
}

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    if (req.method !== 'POST') {
        return yanit(res, 405, { status: 'error', message: 'Yalnızca POST kabul edilir.' });
    }

    const govde = await govdeyiOku(req);
    const islem = String(govde.action || '');

    if (islem === 'ping') {
        return yanit(res, 200, { status: 'success', sunucu: 'e-mesem-basvuru', surum: '4.0' });
    }

    const kurum = kurumAdiniDuzelt(govde.kurum);
    if (!kurum) return yanit(res, 400, { status: 'error', message: 'Kurum adı gerekli.' });

    try {
        await semayiHazirla();
        const sql = baglanti();

        /* ---------------- GİRİŞ ---------------- */
        if (islem === 'login') {
            const sifre = (govde.data && govde.data.sifre) || '';
            if (!sifre) return yanit(res, 400, { status: 'error', message: 'Şifre gerekli.' });

            const denemeler = await sql`
                SELECT sayi, pencere FROM giris_denemeleri WHERE kurum = ${kurum}`;
            if (denemeler.length) {
                const d = denemeler[0];
                const gecenDk = (Date.now() - new Date(d.pencere).getTime()) / 60000;
                if (gecenDk < DENEME_PENCERESI_DK && d.sayi >= DENEME_SINIRI) {
                    const kalan = Math.ceil(DENEME_PENCERESI_DK - gecenDk);
                    return yanit(res, 429, {
                        status: 'error',
                        message: `Çok fazla hatalı deneme. ${kalan} dakika sonra tekrar deneyin.`
                    });
                }
                if (gecenDk >= DENEME_PENCERESI_DK) {
                    await sql`UPDATE giris_denemeleri SET sayi = 0, pencere = now() WHERE kurum = ${kurum}`;
                }
            }

            const satirlar = await sql`
                SELECT sifre_ozeti, tuz, aktif, ad, logo FROM kurumlar WHERE kurum = ${kurum}`;
            const kayitliKurum = satirlar[0];
            const gecerli = kayitliKurum && kayitliKurum.aktif &&
                sifreDogruMu(sifre, kayitliKurum.tuz, kayitliKurum.sifre_ozeti);

            if (!gecerli) {
                await sql`
                    INSERT INTO giris_denemeleri (kurum, sayi, pencere) VALUES (${kurum}, 1, now())
                    ON CONFLICT (kurum) DO UPDATE SET sayi = giris_denemeleri.sayi + 1`;
                // Kurum var mı yok mu bilgisini sızdırmamak için tek mesaj
                return yanit(res, 401, { status: 'error', message: 'Kurum adı veya şifre hatalı.' });
            }

            await sql`DELETE FROM giris_denemeleri WHERE kurum = ${kurum}`;
            return yanit(res, 200, {
                status: 'success',
                token: anahtarUret(kurum),
                kurum,
                ad: (kayitliKurum && kayitliKurum.ad) || '',
                logo: (kayitliKurum && kayitliKurum.logo) || ''
            });
        }

        /* ---------------- Bundan sonrası oturum ister ---------------- */
        const oturum = anahtariCoz(govde.token);
        if (!oturum || oturum.kurum !== kurum) {
            return yanit(res, 401, { status: 'unauthorized', message: 'Oturum geçersiz veya süresi dolmuş.' });
        }

        /* ---------------- YÜKLE ---------------- */
        if (islem === 'load') {
            const satirlar = await sql`
                SELECT id, veri, guncelleme FROM kayitlar
                WHERE kurum = ${kurum} AND NOT silindi
                ORDER BY (veri->>'sira')::numeric NULLS LAST, guncelleme`;
            const kayitlar = satirlar.map((s) => ({
                ...s.veri,
                id: s.id,
                guncelleme: new Date(s.guncelleme).toISOString()
            }));
            return yanit(res, 200, { status: 'success', data: kayitlar });
        }

        /* ---------------- EŞİTLE ---------------- */
        if (islem === 'sync') {
            const islemler = Array.isArray(govde.data) ? govde.data : [];
            if (islemler.length > 500) {
                return yanit(res, 413, { status: 'error', message: 'Tek seferde en çok 500 işlem gönderilebilir.' });
            }
            let yazilan = 0, silinen = 0, atlanan = 0;

            for (const i of islemler) {
                const id = String(i.id || '');
                if (!id) { atlanan++; continue; }
                const damga = i.ts ? new Date(i.ts) : new Date();
                const damgaMetin = isNaN(damga) ? new Date().toISOString() : damga.toISOString();

                if (i.tip === 'sil') {
                    const sonuc = await sql`
                        UPDATE kayitlar SET silindi = TRUE, guncelleme = ${damgaMetin}
                        WHERE kurum = ${kurum} AND id = ${id} AND guncelleme <= ${damgaMetin}
                        RETURNING id`;
                    if (sonuc.length) silinen++; else atlanan++;
                } else {
                    const kayit = i.kayit && typeof i.kayit === 'object' ? i.kayit : null;
                    if (!kayit) { atlanan++; continue; }
                    const temiz = { ...kayit };
                    delete temiz.guncelleme;              // damga sütunda tutulur
                    const sonuc = await sql`
                        INSERT INTO kayitlar (kurum, id, veri, guncelleme, silindi)
                        VALUES (${kurum}, ${id}, ${JSON.stringify(temiz)}::jsonb, ${damgaMetin}, FALSE)
                        ON CONFLICT (kurum, id) DO UPDATE
                            SET veri = EXCLUDED.veri,
                                guncelleme = EXCLUDED.guncelleme,
                                silindi = FALSE
                            WHERE kayitlar.guncelleme <= EXCLUDED.guncelleme
                        RETURNING id`;
                    if (sonuc.length) yazilan++; else atlanan++;   // daha yeni sürüm varsa dokunulmaz
                }
            }
            return yanit(res, 200, { status: 'success', yazilan, silinen, atlanan });
        }

        /* ---------------- LOGO GÜNCELLE ---------------- */
        if (islem === 'logoGuncelle') {
            const yeniLogo = String((govde.data && govde.data.logo) || '').slice(0, 500000);
            if (!yeniLogo) return yanit(res, 400, { status: 'error', message: 'Logo verisi boş olamaz.' });
            const guncel = await sql`SELECT logo FROM kurumlar WHERE kurum = ${kurum}`;
            if (!guncel.length) return yanit(res, 404, { status: 'error', message: kurum + ' bulunamadı.' });
            await sql`UPDATE kurumlar SET logo = ${yeniLogo} WHERE kurum = ${kurum}`;
            return yanit(res, 200, { status: 'success', kurum, mesaj: 'Logo güncellendi.' });
        }

        /* ---------------- TEMİZLE ---------------- */
        if (islem === 'clear') {
            const onay = (govde.data && govde.data.onay) || '';
            if (kurumAdiniDuzelt(onay) !== kurum) {
                return yanit(res, 400, { status: 'error', message: 'Silme onayı için kurum adını doğru yazmanız gerekir.' });
            }
            const yedekAdi = 'YEDEK_' + kurum + '_' + new Date().toISOString().replace(/[:.]/g, '-');
            await sql`
                INSERT INTO kayitlar (kurum, id, veri, guncelleme, silindi)
                SELECT ${yedekAdi}, id, veri, now(), FALSE FROM kayitlar
                WHERE kurum = ${kurum} AND NOT silindi
                ON CONFLICT (kurum, id) DO NOTHING`;
            const sonuc = await sql`
                UPDATE kayitlar SET silindi = TRUE, guncelleme = now()
                WHERE kurum = ${kurum} AND NOT silindi RETURNING id`;
            return yanit(res, 200, { status: 'success', silinen: sonuc.length, yedek: yedekAdi });
        }

        return yanit(res, 400, { status: 'error', message: 'Bilinmeyen işlem: ' + islem });
    } catch (e) {
        console.error('veri api hatası', e);
        return yanit(res, 500, { status: 'error', message: e.message || 'Sunucu hatası' });
    }
}
