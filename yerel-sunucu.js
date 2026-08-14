/* ------------------------------------------------------------------
   Yerel deneme sunucusu (Vercel'i taklit eder)
   Kullanım:
       DATABASE_URL=... OTURUM_SIRRI=... ADMIN_ANAHTARI=... node yerel-sunucu.js
   Vercel'de bu dosya kullanılmaz; orada /api altındaki dosyalar
   doğrudan sunucusuz işlev olarak çalışır.
------------------------------------------------------------------- */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

const TURLER = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

const islevler = {
    '/api/veri': (await import('./api/veri.js')).default,
    '/api/kurum': (await import('./api/kurum.js')).default
};

http.createServer(async (istek, yanit) => {
    const adres = new URL(istek.url, 'http://localhost');
    const yol = adres.pathname;

    if (islevler[yol]) {
        // Vercel'in res.status().json() arayüzünü taklit et
        yanit.status = (kod) => { yanit.statusCode = kod; return yanit; };
        yanit.json = (govde) => { yanit.end(JSON.stringify(govde)); };
        try {
            await islevler[yol](istek, yanit);
        } catch (e) {
            yanit.statusCode = 500;
            yanit.end(JSON.stringify({ status: 'error', message: e.message }));
        }
        return;
    }

    const dosya = path.join(kok, 'public', yol === '/' ? 'index.html' : yol);
    if (!dosya.startsWith(path.join(kok, 'public'))) { yanit.statusCode = 403; yanit.end(); return; }
    fs.readFile(dosya, (hata, icerik) => {
        if (hata) { yanit.statusCode = 404; yanit.end('bulunamadi'); return; }
        yanit.setHeader('Content-Type', TURLER[path.extname(dosya)] || 'application/octet-stream');
        yanit.end(icerik);
    });
}).listen(PORT, () => console.log('yerel sunucu http://localhost:' + PORT));
