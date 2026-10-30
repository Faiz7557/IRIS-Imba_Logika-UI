# EduShield prototype · sidebar dan antarmuka sistem

Buka `app/index.html` langsung di Chrome atau Edge. Tidak memerlukan internet, server, atau instalasi paket antarmuka. Data BPS lokal dipadukan dengan risiko, manfaat, dan kuota simulasi. Ini perencanaan kuota kontinu agregat, belum merupakan penetapan penerima.

## Antarmuka aktif

Sidebar berisi nama halaman tanpa kode layar, dikelompokkan menurut tugas dan ruang kerja. Pada lebar di bawah 1024 px, sidebar menjadi panel yang dapat dibuka dan ditutup, dengan pengelolaan fokus, Escape, dan latar redup. Sidebar dan latar memakai biru analisis, putih, dan abu terang. Kartu tersedia dalam mode light (warna putih sebelumnya) dan dark glass charcoal sesuai referensi SignIn1, dengan aksen biru yang sama. Tombol matahari/bulan di toolbar mengganti seluruh tampilan dan menyimpan pilihan lokal. Tipografi memakai font sistem lokal. Transisi singkat menghormati preferensi pengurangan gerak dan transparansi.

`app/cards.css` memuat style kartu gelap, terpisah dari layout dasar dan tidak diterapkan pada cetakan. `app/ui.js` menangani navigasi, animasi, fokus, dan region tabel. `app/app.js` berisi layar dan handler. Slider simulator mempertahankan elemen input saat hasil berubah sehingga drag pointer tetap tersambung. Solver menghentikan iterasi ketika batas pencarian tidak lagi berubah pada presisi floating point; hasilnya identik dengan versi sebelumnya pada delapan skenario pembanding.

Audit desain dan kurasi seluruh 18 layar: `AUDIT_DESAIN_DAN_KONTEN.md`. Spesifikasi aktif: `DESIGN.md`. Audit Onda sebelumnya merupakan catatan historis.

## Verifikasi

```powershell
node edushield/test_app.cjs
node edushield/test_apple.cjs
```

Uji browser memerlukan Node.js, Chrome, dan Playwright (paket Node atau paket Python yang telah terpasang). Laporan, screenshot desktop/mobile, dan PDF ada di `verification/apple/`. Uji meliputi 18 rute pada enam lebar, drag slider, navigasi, fokus, formulir pratinjau, hasil ekspor, mode cetak, teks diperbesar, serta pengurangan gerak.

Chrome di host pengujian dapat membatalkan unduhan Blob. Hasil unduhan native dicatat apa adanya dalam report.json; isi CSV/JSON juga diperiksa melalui Blob yang dihasilkan handler asli.

## Data dan reproduksi riset

```powershell
python edushield/edushield.py --export
python edushield/test_kkt.py
```

Ekspor data memerlukan numpy, pandas, scipy, statsmodels, dan scikit-learn. Riset penuh memerlukan lightgbm. Perintah riset/ekspor dapat menulis ulang hasil dan paket data; tidak diperlukan untuk membuka prototype atau mengganti antarmuka. `export_app.py` membangun paket BPS lokal dan outcome seed 0. `app_data.sha256` mengidentifikasi JSON sumber.

## Batas prototype

A1–A5, A7–A8, B1–B2 interaktif. A6 memakai eksperimen tersimpan. B3–B4 dan C1–C3 adalah pratinjau tanpa unggahan, autentikasi, atau layanan server. L1–L3 berisi identitas, arsitektur, dan rencana uji coba. Rute internal dipertahankan untuk tautan lama, sementara kodenya dihilangkan dari label antarmuka.

Petak risiko bukan peta geografis. Pengelompokan 38 provinsi mengikuti berkas sumber lokal, bukan verifikasi batas administratif terkini. Rentang antar-lipatan adalah rentang stabilitas, bukan interval prediksi atau kepercayaan. κ=1,74 tetap asumsi kerja yang membutuhkan verifikasi. Populasi rentan adalah proksi, bukan daftar siswa atau penerima terdaftar. Anggaran simulator mengikuti biaya skenario aktif; eksperimen referensi dapat memakai ketentuan pagu yang berbeda.

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
