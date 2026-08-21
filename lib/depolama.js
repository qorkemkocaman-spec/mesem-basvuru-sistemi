/* ------------------------------------------------------------------
   Depolama katmanı — ada (aday) fotoğrafları için.

   İki katmanlı bir şema seçer (arka uç):

     [Varsayılan] PostgreSQL (fotograflar tablosu, JSONB base64)
         - Ortam değişkeni gerekmez, mevcut davranışın birebir aynısıdır.

     [Cloudflare R2]  (ücretsiz 10 GB + sıfır egress — S3 uyumlu)
         - Aşağıdaki R2_* değişkenleri tanımlıysa fotoğraflar R2'ye yazılır:
             R2_ACCOUNT_ID            Cloudflare hesab kimliği
             R2_ACCESS_KEY_ID         R2 API belirteci (Access Key ID)
             R2_SECRET_ACCESS_KEY     R2 API belirteci (Secret Access Key)
             R2_BUCKET                R2'daki bucket adı
             R2_ENDPOINT              [Opsiyonel] Endpoint; varsayı
                                      https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com.
                                      Kendi S3-uyumlu sunucusu (örn. MinIO) ya
                                      yerel denemek için nerayıbilir.
         - Fotoğraf anahtarı: <kurum>/<TC>
         - Eski Postgres kayıtları kaybolmaz: fotoGetir R2'de bulamazsa
           Postgres'ten okuyup otomatik R2'ye kopyalar ("lazy migrasyon").
------------------------------------------------------------------- */
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/* R2 yapılandırması eksiksiz mi? */
export function r2AktifMi() {
    return !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET
    );
}

let _r2 = null;
function r2() {
    if (_r2) return _r2;
    /* R2 endpoint: varsayı Cloudflare; R2_ENDPOINT opsiyonel (MinIO deneme icin). */
    const eksiz = String(process.env.R2_ENDPOINT || '').trim();
    const endpoint = eksiz
        ? eksiz
        : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    _r2 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        },
        forcePathStyle: true
    });
    return _r2;
}

/* "data:<mime>;base64,<govde>" → { mime, buffer } | null */
export function medyayiAyris(tam) {
    if (typeof tam !== 'string' || tam.length < 50) return null;
    const ayrac = tam.indexOf(',');
    if (ayrac < 0) return null;
    const baslik = tam.slice(0, ayrac);
    const govde = tam.slice(ayrac + 1);
    const m = /^data:([^;]+)/.exec(baslik);
    const mime = (m && m[1]) || 'image/png';
    const buffer = Buffer.from(govde, 'base64');
    if (buffer.length < 10) return null;
    return { mime, buffer };
}

/* { mime, buffer } → "data:<mime>;base64,<govde>" */
export function medyaUret(mime, buffer) {
    return `data:${mime};base64,${buffer.toString('base64')}`;
}

/* R2 nesne anahtarı: kurum izolasyonu ad + TC. */
export function anahtar(kurum, tc) {
    return `${kurum}/${tc}`;
}

/* Fotoğrafı R2'ye yazar; başarısızsa false döner. */
export async function r2FotoYaz(kurum, tc, medya) {
    const ayrik = medyayiAyris(medya);
    if (!ayrik) return false;
    await r2().send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: anahtar(kurum, tc),
        Body: ayrik.buffer,
        ContentType: ayrik.mime
    }));
    return true;
}

/* Fotoğrafı R2'den dataURL olarak getirir; yoksa null döner. */
export async function r2FotoGetir(kurum, tc) {
    try {
        const obj = await r2().send(new GetObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: anahtar(kurum, tc)
        }));
        const bytes = new Uint8Array(await obj.Body.transformToByteArray());
        const mime = obj.ContentType || 'image/png';
        return medyaUret(mime, Buffer.from(bytes));
    } catch (e) {
        const bulunamadi = e && (
            e.name === 'NoSuchKey' ||
            (e.$metadata && e.$metadata.httpStatusCode === 404)
        );
        if (bulunamadi) return null;
        throw e;
    }
}

/* Fotoğrafı R2'den siler (bulunamazsa sessizce geçer). */
export async function r2FotoSil(kurum, tc) {
    try {
        await r2().send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: anahtar(kurum, tc)
        }));
    } catch (e) { /* yok say */ }
}