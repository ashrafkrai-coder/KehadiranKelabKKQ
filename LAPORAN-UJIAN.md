# Laporan ujian

Ujian automatik meliputi sanitasi HTML, URL HTTPS Apps Script `/dev` ke `/exec`, pemadanan nama bersama kelas, status H/T/TS, pengiraan peratus, had sesi 1–12, tetapan kamera tidak sah dan kunci deduplikasi.

Jalankan `npm test` dan `npm run check`.

Ujian queue luar talian membuat simulasi JSON serialize/reload untuk mengesahkan rekod mengekalkan kunci identiti. Aplikasi menggunakan IndexedDB untuk rekod dan queue, dan hanya membuang item selepas respons Apps Script berjaya; integrasi IndexedDB dalam pelayar sebenar belum diuji.

Ujian dijalankan dengan Node.js 24.21.0 dan npm 11.19.0: 12 ujian lulus dan `npm run check` lulus. Semakan manual kamera belum dapat dibuat kerana memerlukan telefon/kamera, HTTPS, pustaka face-api.js dan fail model setempat. Sediakan aset tersebut mengikut README sebelum operasi imbasan. Semakan deployment Apps Script memerlukan spreadsheet, token dan URL milik sekolah.
