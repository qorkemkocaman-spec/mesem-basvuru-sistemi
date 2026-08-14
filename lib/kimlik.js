/* ------------------------------------------------------------------
   Kimlik doğrulama yardımcıları
   - Şifreler: kurum başına rastgele tuz + scrypt özeti (düz metin saklanmaz)
   - Oturum: sunucuda tablo tutmadan, HMAC ile imzalanmış süreli anahtar
   Ortam değişkeni: OTURUM_SIRRI (uzun, rastgele bir metin)
------------------------------------------------------------------- */
import crypto from 'node:crypto';

const OTURUM_SURESI_SN = 8 * 60 * 60;   // 8 saat

function sir() {
    const s = process.env.OTURUM_SIRRI;
    if (!s || s.length < 16) {
        throw new Error('OTURUM_SIRRI tanımlı değil veya çok kısa. Vercel ortam değişkenlerine uzun ve rastgele bir değer yazın.');
    }
    return s;
}

/* ---- Şifre ---- */
export function tuzUret() {
    return crypto.randomBytes(16).toString('hex');
}

export function sifreOzeti(sifre, tuz) {
    return crypto.scryptSync(String(sifre), tuz, 64).toString('hex');
}

export function sifreDogruMu(sifre, tuz, ozet) {
    let hesap;
    try {
        hesap = Buffer.from(sifreOzeti(sifre, tuz), 'hex');
    } catch (e) {
        return false;
    }
    const kayitli = Buffer.from(String(ozet), 'hex');
    if (hesap.length !== kayitli.length) return false;
    return crypto.timingSafeEqual(hesap, kayitli);          // zamanlama saldırısına kapalı
}

/* ---- Oturum anahtarı ---- */
function b64(veri) {
    return Buffer.from(veri).toString('base64url');
}

export function anahtarUret(kurum) {
    const govde = b64(JSON.stringify({
        k: kurum,
        b: Date.now(),
        s: Math.floor(Date.now() / 1000) + OTURUM_SURESI_SN
    }));
    const imza = crypto.createHmac('sha256', sir()).update(govde).digest('base64url');
    return govde + '.' + imza;
}

export function anahtariCoz(anahtar) {
    if (!anahtar || typeof anahtar !== 'string' || !anahtar.includes('.')) return null;
    const [govde, imza] = anahtar.split('.');
    const beklenen = crypto.createHmac('sha256', sir()).update(govde).digest('base64url');
    if (imza.length !== beklenen.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(imza), Buffer.from(beklenen))) return null;
    let icerik;
    try {
        icerik = JSON.parse(Buffer.from(govde, 'base64url').toString('utf8'));
    } catch (e) {
        return null;
    }
    if (!icerik.k || !icerik.s || icerik.s < Math.floor(Date.now() / 1000)) return null;
    return { kurum: icerik.k, bitis: icerik.s };
}

/* ---- Kurum adı biçimi ---- */
export function kurumAdiniDuzelt(ad) {
    return String(ad || '')
        .trim()
        .toLocaleUpperCase('tr-TR')
        .replace(/\s+/g, '_')
        .replace(/[^0-9A-ZÇĞİÖŞÜ_.-]/g, '')
        .slice(0, 60);
}
