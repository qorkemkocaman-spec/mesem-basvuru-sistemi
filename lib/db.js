/* ------------------------------------------------------------------
   Veritabanı katmanı (PostgreSQL)
   Tek ortam değişkeni gerekir: DATABASE_URL
     - Vercel + Neon: Neon panelinden gelen "pooled" bağlantı adresi
     - Yerel deneme: postgres://... adresi
   Şema ilk istekte kendiliğinden oluşur, elle SQL çalıştırmak gerekmez.

   Aşağıdaki `sql` işlevi etiketli şablon olarak kullanılır:
       await sql`SELECT * FROM kurumlar WHERE kurum = ${kurum}`
   Değerler her zaman parametre olarak gider; SQL enjeksiyonu mümkün değildir.
------------------------------------------------------------------- */
import pg from 'pg';

let _havuz = null;
let _semaHazir = false;

function havuz() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL tanımlı değil. Vercel proje ayarlarından Neon veritabanını bağlayın.');
    }
    if (!_havuz) {
        const adres = process.env.DATABASE_URL;
        const yerel = /localhost|127\.0\.0\.1|@\/|host=\/|\/tmp/.test(adres);
        _havuz = new pg.Pool({
            connectionString: adres,
            ssl: yerel ? false : { rejectUnauthorized: false },
            max: 3,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 8000
        });
        _havuz.on('error', (e) => console.error('veritabanı havuz hatası', e.message));
    }
    return _havuz;
}

/* Etiketli şablon: sorgu metnini $1, $2... parametrelerine çevirir. */
export function baglanti() {
    const h = havuz();
    return async function sql(parcalar, ...degerler) {
        let metin = '';
        parcalar.forEach((p, i) => {
            metin += p;
            if (i < degerler.length) metin += '$' + (i + 1);
        });
        const sonuc = await h.query(metin, degerler);
        return sonuc.rows;
    };
}

export async function semayiHazirla() {
    if (_semaHazir) return;
    const sql = baglanti();

    await sql`
        CREATE TABLE IF NOT EXISTS kurumlar (
            kurum        TEXT PRIMARY KEY,
            ad           TEXT NOT NULL DEFAULT '',
            sifre_ozeti  TEXT NOT NULL,
            tuz          TEXT NOT NULL,
            aktif        BOOLEAN NOT NULL DEFAULT TRUE,
            olusturma    TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;

    await sql`
        CREATE TABLE IF NOT EXISTS kayitlar (
            kurum       TEXT NOT NULL,
            id          TEXT NOT NULL,
            veri        JSONB NOT NULL,
            guncelleme  TIMESTAMPTZ NOT NULL DEFAULT now(),
            silindi     BOOLEAN NOT NULL DEFAULT FALSE,
            PRIMARY KEY (kurum, id)
        )`;

    await sql`CREATE INDEX IF NOT EXISTS kayitlar_kurum_idx ON kayitlar (kurum) WHERE NOT silindi`;

    await sql`
        CREATE TABLE IF NOT EXISTS giris_denemeleri (
            kurum    TEXT PRIMARY KEY,
            sayi     INTEGER NOT NULL DEFAULT 0,
            pencere  TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;

    /* Silinen kayıtların izi 60 gün tutulur (eşitleme çakışmasını önlemek için),
       sonra tamamen temizlenir. */
    await sql`DELETE FROM kayitlar WHERE silindi AND guncelleme < now() - INTERVAL '60 days'`;

    _semaHazir = true;
}
