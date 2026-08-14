/* ------------------------------------------------------------------
   /api/kurum — kurum hesaplarını yönetir (yalnızca yönetici)
   Her istek "x-yonetim-anahtari" başlığında ADMIN_ANAHTARI değerini taşır.

   Gövde: { action, kurum, sifre, ad }
     listele        → kurum listesi (şifre bilgisi dönmez)
     ekle           → yeni kurum + şifre
     sifreDegistir  → mevcut kurumun şifresini yeniler
     durum          → kurumu askıya al / geri aç
------------------------------------------------------------------- */
import { baglanti, semayiHazirla } from '../lib/db.js';
import { tuzUret, sifreOzeti, kurumAdiniDuzelt } from '../lib/kimlik.js';
import crypto from 'node:crypto';

export const config = { runtime: 'nodejs' };

function yanit(res, kod, govde) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(kod).json(govde);
}

function anahtarGecerliMi(req) {
    const beklenen = process.env.ADMIN_ANAHTARI || '';
    if (!beklenen || beklenen.length < 12) return false;
    const gelen = String(req.headers['x-yonetim-anahtari'] || '');
    if (gelen.length !== beklenen.length) return false;
    return crypto.timingSafeEqual(Buffer.from(gelen), Buffer.from(beklenen));
}

async function govdeyiOku(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
        try { return JSON.parse(req.body); } catch (e) { return {}; }
    }
    const metin = await new Promise((coz) => {
        let t = '';
        req.on('data', (p) => { t += p; });
        req.on('end', () => coz(t));
    });
    try { return JSON.parse(metin || '{}'); } catch (e) { return {}; }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return yanit(res, 405, { status: 'error', message: 'Yalnızca POST kabul edilir.' });
    }
    if (!anahtarGecerliMi(req)) {
        return yanit(res, 401, { status: 'error', message: 'Yönetim anahtarı geçersiz.' });
    }

    const govde = await govdeyiOku(req);
    const islem = String(govde.action || '');

    try {
        await semayiHazirla();
        const sql = baglanti();

        if (islem === 'listele') {
            const satirlar = await sql`
                SELECT k.kurum, k.ad, k.aktif, k.olusturma,
                       (SELECT count(*) FROM kayitlar y WHERE y.kurum = k.kurum AND NOT y.silindi) AS kayit_sayisi
                FROM kurumlar k ORDER BY k.kurum`;
            const liste = satirlar.map((s) => ({
                kurum: s.kurum,
                ad: s.ad,
                aktif: s.aktif,
                olusturma: s.olusturma,
                kayitSayisi: Number(s.kayit_sayisi)
            }));
            return yanit(res, 200, { status: 'success', data: liste });
        }

        const kurum = kurumAdiniDuzelt(govde.kurum);
        if (!kurum) return yanit(res, 400, { status: 'error', message: 'Kurum adı gerekli.' });

        if (islem === 'ekle' || islem === 'sifreDegistir') {
            const sifre = String(govde.sifre || '');
            if (sifre.length < 8) {
                return yanit(res, 400, { status: 'error', message: 'Şifre en az 8 karakter olmalı.' });
            }
            const tuz = tuzUret();
            const ozet = sifreOzeti(sifre, tuz);

            if (islem === 'ekle') {
                const varMi = await sql`SELECT 1 FROM kurumlar WHERE kurum = ${kurum}`;
                if (varMi.length) {
                    return yanit(res, 409, { status: 'error', message: kurum + ' zaten kayıtlı. Şifre değiştirmek için "sifreDegistir" kullanın.' });
                }
                await sql`
                    INSERT INTO kurumlar (kurum, ad, sifre_ozeti, tuz)
                    VALUES (${kurum}, ${String(govde.ad || "").slice(0, 160)}, ${ozet}, ${tuz})`;
                return yanit(res, 200, { status: 'success', kurum, mesaj: kurum + ' eklendi.' });
            }

            const sonuc = await sql`
                UPDATE kurumlar SET sifre_ozeti = ${ozet}, tuz = ${tuz}
                WHERE kurum = ${kurum} RETURNING kurum`;
            if (!sonuc.length) return yanit(res, 404, { status: 'error', message: kurum + ' bulunamadı.' });
            await sql`DELETE FROM giris_denemeleri WHERE kurum = ${kurum}`;
            return yanit(res, 200, { status: 'success', kurum, mesaj: kurum + ' şifresi değiştirildi.' });
        }

        if (islem === 'durum') {
            const aktif = govde.aktif !== false;
            const sonuc = await sql`
                UPDATE kurumlar SET aktif = ${aktif} WHERE kurum = ${kurum} RETURNING kurum, aktif`;
            if (!sonuc.length) return yanit(res, 404, { status: 'error', message: kurum + ' bulunamadı.' });
            return yanit(res, 200, {
                status: 'success', kurum,
                mesaj: kurum + (aktif ? ' yeniden açıldı.' : ' askıya alındı.')
            });
        }

        return yanit(res, 400, { status: 'error', message: 'Bilinmeyen işlem: ' + islem });
    } catch (e) {
        console.error('kurum api hatası', e);
        return yanit(res, 500, { status: 'error', message: e.message || 'Sunucu hatası' });
    }
}
