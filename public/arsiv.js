/* ==================================================================
   E-MESEM Başvuru Sistemi - Arşiv Uyumluluk Katmanı
   ------------------------------------------------------------------
   Arşiv yönetimi artık tamamen index.html içine entegre edilmiştir
   (tabArsiv, arsivKayitlar, kaydiArsiveTasi, countArsiv).
   Bu dosya, eski script'lerle geriye dönük uyumluluk için tutulur.
   ================================================================== */
(function () {
    'use strict';
    if (window.__mesemArsivModulu) return;
    window.__mesemArsivModulu = true;

    window.__mesemArsiv = {
        arsivKayitlariniGetir: function () {
            try {
                if (window.arsivKayitlar && Array.isArray(window.arsivKayitlar)) return window.arsivKayitlar;
                const kurum = localStorage.getItem('mesem_aktif_kurum') || '';
                return JSON.parse(localStorage.getItem('mesem_arsiv_' + kurum) || '[]');
            } catch (e) { return []; }
        },
        arsiveTasi: function (id) {
            if (typeof window.kaydiArsiveTasi === 'function') {
                window.kaydiArsiveTasi(id);
                return true;
            }
            return false;
        },
        arsivdenGeriAl: function (id) {
            if (typeof window.kaydiArsivdenGeriAl === 'function') {
                window.kaydiArsivdenGeriAl(id);
                return true;
            }
            return false;
        }
    };
})();