# Kehadiran Kelab Kelas Kemahiran al-Quran

PWA khusus untuk kehadiran Kelab Kelas Kemahiran al-Quran. Jenis aktiviti dan nama kelas ditetapkan dalam aplikasi; guru hanya memilih tarikh serta perjumpaan. Semua murid, rekod, barisan luar talian dan descriptor wajah kekal di IndexedDB peranti guru. Aplikasi tidak menyimpan imej muka.

## Jalankan dan pasang

Layankan folder ini menggunakan HTTPS atau `localhost` (contoh `npx serve .`), kemudian buka alamat itu pada telefon dan pilih **Add to Home Screen**. Kamera tidak dibenarkan pada HTTP biasa. Service worker menyimpan fail aplikasi untuk penggunaan seterusnya tanpa internet. Ujian logik: `npm test`; semakan sintaks: `npm run check`.

## Pengecaman muka dan mod luar talian

Pengecaman menggunakan face-api.js Tiny Face Detector. Model yang diperlukan telah disertakan dalam `models/` daripada repositori model rasmi face-api.js. Terbitkan seluruh folder itu bersama aplikasi; service worker akan menyimpan model untuk kegunaan luar talian. Pustaka face-api.js masih dimuatkan daripada CDN pada lawatan pertama dan dicache oleh service worker selepas berjaya dimuatkan. Untuk hos tanpa capaian rangkaian langsung, simpan pustaka sebagai `vendor/face-api.min.js` dan tukar rujukan CDN di `index.html` kepada `./vendor/face-api.min.js`.

Konfigurasi lalai kamera ialah 5 wajah, 720p, input 416, ambang jarak 0.48 dan dua pengesahan. Pilihan sah maksimum wajah 3/5/8, resolusi 480p/720p/1080p dan input 224/416/608. Ambang lebih kecil lebih ketat. Daftar 3–8 sampel per murid dalam pencahayaan berbeza.

## Apps Script dan Google Sheet

1. Buat atau buka Google Sheet khusus aplikasi dan buka **Extensions → Apps Script**. Salin kandungan `Code.gs` ke projek Apps Script yang terikat kepada Sheet.
2. Di **Project Settings → Script properties**, tetapkan `HADIR_TOKEN` kepada token rawak yang hanya anda simpan. Masukkan nilai yang sama pada Tetapan aplikasi setiap peranti guru. Token tidak disimpan dalam repository atau bundle frontend.
3. Jalankan `setupSheets` sekali daripada editor dan benarkan akses. Skema aktif aplikasi ialah:
   - **Senarai**: `Nama`, `Kelas`, `ID` (ID pilihan). Aplikasi hanya memuatkan nama dan kelas.
   - **Kehadiran**: `Tahun`, `Tarikh`, `Jenis Aktiviti`, `Nama Aktiviti`, `Perjumpaan`, `Kelas`, `Nama Murid`, `Status`, `Sebab`, `Kunci Rekod`, `Dikemas kini`. Aktiviti baharu ditetapkan sebagai `Kemahiran al-Quran` / `Kelas Kemahiran al-Quran`.
   - **Aktiviti**: `Nama Aktiviti`, `Jenis`, `Status`; baris aktif KKQ ditambah jika belum ada.
   - **Murid** menggunakan lajur `Nama`, `Kelas`, `ID` dan `Dikemas kini`. Jalankan `setupSheets`; lajur legacy `Kumpulan al-Quran`, `Kelab` dan `Persatuan` dibuang daripada tab ini.
   - **Kelab** dan **Log** dikekalkan untuk keserasian atau rekod operasi; aplikasi semasa menetapkan `Kemahiran al-Quran` / `Kelas Kemahiran al-Quran` secara tetap dan tidak memerlukan pilihan kelab atau aktiviti tambahan pada skrin.

   Fungsi ini mencipta tab hilang dan melengkapkan tajuk yang kosong sahaja. Lajur legacy Kumpulan al-Quran, Kelab dan Persatuan pada tab **Murid** dibuang apabila `setupSheets` dijalankan; rekod pada lajur lain dikekalkan. Semak tab **Senarai** supaya setiap baris murid mempunyai nama dan kelas yang betul.
4. **Deploy → New deployment → Web app**, jalankan sebagai akaun pemilik Sheet, pilih akses yang membenarkan peranti guru mengakses endpoint, dan deploy. Salin URL HTTPS `/exec` ke Tetapan. URL `/dev` akan dinormalisasi ke `/exec`.
5. Eksport tab **Senarai** sebagai CSV dengan tajuk sekurang-kurangnya `Nama` dan `Kelas` untuk import murid. Import memadankan gabungan nama dan kelas; baris yang sepadan tidak mengganti data sedia ada.

Kehadiran dihantar selepas setiap rekod. Jika gagal atau luar talian, rekod kekal di IndexedDB dan dicuba semula apabila talian kembali; butang Hantar rekod tertunda mencuba semula secara manual. Apps Script menggunakan kunci komposit tahun/tarikh/jenis/nama aktiviti/perjumpaan/kelas/nama murid untuk kemas kini idempoten.

## Sandaran dan eksport

Tab Tetapan menyediakan muat turun dan pulih sandaran JSON, termasuk descriptor wajah. Simpan fail sandaran dengan selamat pada peranti sekolah. Laporan boleh dicetak dengan **Cetak / PDF**, pilih **Save as PDF**, orientasi landskap; CSS cetak membenarkan beberapa halaman.

## Had operasi

Aliran kamera memerlukan ujian pada telefon sebenar dengan kamera, HTTPS, model yang diterbitkan bersama laman dan muatan pertama pustaka face-api.js. Penghantaran Apps Script memerlukan token pada Script Properties dan konfigurasi pada peranti guru.
