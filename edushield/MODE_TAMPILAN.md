# Light dan dark mode

Palet utama tetap biru. Light mengembalikan warna putih/abu kartu sebelum penerapan dark glass; dark mempertahankan charcoal, gradient, dan kontrol transparan. Geometri kartu, sidebar, animasi, dan alur kerja dipakai bersama.

Tombol matahari dan bulan di toolbar adalah dua pilihan yang tersedia. Mode default light. `theme-init.js` membaca pilihan tersimpan sebelum stylesheet agar pemuatan ulang tidak menampilkan mode yang salah. Handler tidak menggambar ulang main sehingga parameter, hasil, elemen slider, dan isian formulir tetap ada. Penyimpanan ditangani dengan try/catch; bila dibatasi oleh browser, tombol tetap bekerja selama sesi.

Mode cetak menggunakan kartu putih dan teks hitam, terlepas dari mode layar. Aksen utama #0071E3 dan makna warna risiko dipertahankan.

Verifikasi: suite antarmuka standar di verification/dual-mode/report.json; uji dua mode di modes-report.json. Uji meliputi semua 18 rute pada desktop/mobile di kedua mode, state simulator, reload pilihan light/dark, storage yang tidak tersedia, dan warna hasil cetak.
