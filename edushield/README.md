# EduShield prototype · sidebar dan antarmuka sistem

Buka `app/index.html` langsung di Chrome atau Edge. Tidak memerlukan internet, server, atau instalasi paket antarmuka. Data BPS lokal dipadukan dengan risiko, manfaat, dan kuota simulasi. Ini perencanaan kuota agregat (kontinu dan bulat), belum merupakan penetapan penerima. Mode demo: `app/index.html?demo=1` mengatur ulang alur usulan dan membuka tur enam langkah.

## Antarmuka aktif

Satu alur bernomor dengan delapan rute: `#beranda`, `#peta` (1, peta 514 kabupaten/kota dan profil wilayah), `#simulator` (2, bejana harga bayangan, perbandingan skema, transisi lima tahun), `#audit` (3, nilai audit data), `#replay` (4), `#usulan` (5, alur Analis pusat ↔ Dinas Pendidikan), `#lembar` (6, kuota bulat, cetak, ekspor), dan `#metode`. Kode rute lama (A1–L3) dialihkan ke rute baru. Pemilih peran di sidebar bukan autentikasi.

Berkas: `app.js` (keadaan, solver cepat, ekspor), `screens/*.js` (satu berkas per layar), `viz/*.js` (peta, bejana, pareto), `store.js` (status usulan di `localStorage`), `tour.js` (tur dan `?demo=1`), `ui.js` (navigasi, tema, fokus), `kkt.js` (solver, pembulatan, nilai audit), `geo.js` dan `data.js` (hasil skrip; jangan disunting tangan). Mode terang/gelap, ikon keadaan, dan pengurangan gerak tetap seperti versi penyisihan. Riwayat rencana final: `../rencana-final/`.

## Verifikasi

```powershell
node edushield/test_app.cjs          # solver, pembulatan, nilai audit (setara Python)
node edushield/test_store.cjs        # mesin status usulan
node edushield/test_peta3d.cjs        # peta 3D Beranda (three.js) dan cadangan 2D
node edushield/test_apple.cjs        # antarmuka: 8 rute, alur demo, tur, ekspor
node edushield/test_modes.cjs        # mode terang/gelap, cetak, penyimpanan diblokir
node edushield/test_state_icons.cjs  # ikon keadaan dan umpan balik tindakan
python edushield/test_kkt.py
python edushield/test_geo.py
```

`app/vendor/three.min.js` adalah three.js 0.159.0 (MIT), disertakan lokal dan ditambal untuk menghapus peringatan deprecation; SHA tercatat di `app/TEMPLATE_CREDITS.md`.

Uji browser memerlukan Node.js, Chrome, dan Playwright (paket Node atau paket Python yang telah terpasang) dan membuka aplikasi dari `file://` tanpa jaringan. Keluaran ditulis ke `verification/final/<uji>/` (atau `EDUSHIELD_UI_REPORT_DIR`); folder `verification/` lain adalah arsip penyisihan. `test_apple.cjs` mencakup delapan rute pada enam lebar (1440, 1024, 1023, 768, 390, 375), 18 kode rute lama, peta 514 wilayah, drag penggeser, tab simulator, alur usulan dua peran, ekspor CSV/JSON/PDF, mode cetak, teks diperbesar, pengurangan gerak, tur papan ketik, dan `?demo=1`.

Chrome di host pengujian dapat membatalkan unduhan Blob. Hasil unduhan native dicatat apa adanya dalam report.json; isi CSV/JSON juga diperiksa melalui Blob yang dihasilkan handler asli.

## Data dan reproduksi riset

```powershell
python edushield/edushield.py --export
python edushield/test_kkt.py
```

Ekspor data memerlukan numpy, pandas, scipy, statsmodels, dan scikit-learn. Riset penuh memerlukan lightgbm. Perintah riset/ekspor dapat menulis ulang hasil dan paket data; tidak diperlukan untuk membuka prototype atau mengganti antarmuka. `export_app.py` membangun paket BPS lokal dan outcome seed 0. `app_data.sha256` mengidentifikasi JSON sumber.

## Batas prototype

Tingkat data 3 (semi-sintetis): kemiskinan, penduduk, dan penyaluran PIP 2025 adalah data nyata; laju putus sekolah per wilayah adalah simulasi yang rata-ratanya dikalibrasi ke angka nasional BPS 0,86%. κ = 1,74 adalah asumsi bentuk kurva, bukan hasil kalibrasi. Interval prediksi konformal 90% menjamin cakupan rata-rata, bukan per wilayah. Replay menguji ketahanan terhadap data baru, bukan efek kausal bantuan. Populasi rentan adalah proksi, bukan daftar siswa atau penerima terdaftar. Skema aktual memakai data penyaluran, bukan kebutuhan. Batas wilayah dari quarcs-lab/indonesia514 (MIT menurut README; tahun batas tidak disebut). Alur usulan hanya tersimpan di perangkat; tidak ada server, unggahan, atau autentikasi. Perubahan angka dibanding esai: `../rencana-final/hasil/perkembangan.md`.

## Referensi dan cadangan

Template Onda awal tersimpan di `reference/design-studio/`. Lisensi dan kredit historis disertakan di `app/TEMPLATE_LICENSE.txt` dan `app/TEMPLATE_CREDITS.md`. Cadangan sebelum perombakan ini ada di `verification/before-apple/`; cadangan versi sebelumnya ada di `verification/before-onda/`. Paket distribusi terbaru: `../deliverables/UEC0032_EduShield_Prototype_Light_Dark_Offline.zip`.

Style kartu dari referensi React diadaptasi ke HTML/CSS aplikasi offline; tidak menambahkan login, migrasi React, Tailwind, atau aset jaringan. Bukti versi kartu ada di `verification/glass-cards/` dan catatan di `KARTU_GLASS.md`. Paket terbaru: `../deliverables/UEC0032_EduShield_Prototype_Light_Dark_Offline.zip`.

Untuk menyimpan bukti tema kartu di folder tersendiri (PowerShell):

```powershell
$env:EDUSHIELD_UI_REPORT_DIR="edushield/verification/glass-cards"
node edushield/test_apple.cjs
```

## Light dan dark mode

Default light. Pilihan disimpan dengan kunci localStorage `edushield-theme` dan diterapkan sebelum stylesheet dimuat. Jika penyimpanan tidak tersedia, kedua mode tetap dapat dipilih selama sesi. Penggantian mode hanya mengubah CSS, bukan parameter atau isi formulir. Mode cetak tetap putih.

Uji kedua mode: `node edushield/test_modes.cjs`. Bukti di `verification/dual-mode/`. Ringkasan implementasi di `MODE_TAMPILAN.md`.

## Ikon dan feedback keadaan

`app/icons.js` menyediakan ikon SVG lokal dan varian keadaan dari referensi Animated State Icons pengguna. `app/icons.css` menyatukan bingkai ikon, ketebalan garis, detail dua lapis, serta feedback menu/tutup, reset/selesai, salin/tersalin, dan ekspor/disiapkan. Keadaan mengikuti tindakan nyata; tidak ada loop demo, notifikasi palsu, ataupun layanan autentikasi tambahan. Clipboard yang ditolak menampilkan kegagalan. Ekspor “disiapkan” tidak menyatakan file sudah tersimpan.

Uji: `node edushield/test_state_icons.cjs`. Laporan ada di `verification/state-icons/icons-report.json`. Pengujian antarmuka menyeluruh memakai `EDUSHIELD_UI_REPORT_DIR=edushield/verification/state-icons` dan `node edushield/test_apple.cjs`. Light/dark, sidebar, dan preferensi pengurangan gerak dipertahankan.
