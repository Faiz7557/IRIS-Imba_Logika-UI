# EduShield · spesifikasi desain aktif

Pengguna utama: analis kuota pusat. Pengguna sekunder: Dinas Pendidikan dan admin data/model. Produk membantu merencanakan kuota agregat, bukan menentukan kelayakan siswa individual.

## Struktur

Sidebar desktop 248 px; 230 px pada desktop ringkas. Pada lebar ≤1023 px sidebar menjadi dialog 270 px dengan scrim, fokus terkurung, Escape, dan tombol tutup. Navigasi memakai nama tugas dan ikon SVG lokal; kode A/B/C/L hanya tetap pada rute internal agar tautan lama kompatibel. Halaman dokumentasi ikut memiliki state aktif.

Kelompok analis: Tinjauan (ringkasan, radar, profil), Simulasi (simulator, perbandingan, ketahanan), Usulan (transisi, lembar usulan). Dinas dan admin memakai daftar sesuai tugasnya. Dokumentasi selalu tersedia.

Toolbar transparan menampilkan lokasi halaman dan reset. Banner “Mode simulasi” tetap terlihat. Konten memakai judul ringkas, ringkasan fungsi, panel data, dan catatan sesuai konteks.

## Token visual

| Peran | Nilai |
|---|---|
| Latar aplikasi | #F5F6F8 |
| Panel layar | Dark glass #121212 dengan gradient putih 6%; cetak tetap putih |
| Teks | #1D1D1F |
| Teks sekunder | #62636B |
| Aksi utama | #0071E3 |
| Tautan | #0066CC |
| Seleksi navigasi | #DCE9FB dengan teks #0058B0 |
| Konteks informasi | #EDF3FB |
| Garis | #E1E4E9 |
| Manfaat positif | #237548 |

Font sistem: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif. Ukuran teks berbasis rem; angka memakai tabular numerals. Judul merapat pada ukuran besar, isi memiliki leading 1,5–1,7. Panel 16–20 px, input/tombol 9–10 px, jarak dasar 4/8 px. Material transparan hanya pada lapisan navigasi/toolbar, bukan kartu bertumpuk.

## Gerak

- Sidebar mobile: spring kritis (omega 24), posisi dan velocity dipertahankan saat arah dibalik. Pembaruan transform dilakukan langsung pada elemen; opacity scrim mengikuti progress. Tidak memakai animasi width/margin atau pewarisan variabel CSS per frame.
- Perpindahan halaman pointer: opacity dan translasi 8 px, 220 ms, easing cubic-bezier(.23,1,.32,1). Transisi sebelumnya dapat dibatalkan dari nilai tampilan saat itu.
- Aksi keyboard dan reduced-motion: perubahan langsung. Tidak ada loop dekoratif, parallax, scroll-jacking, atau timer penundaan input.
- Feedback tombol muncul saat ditekan. Slider native memperbarui thumb langsung; input tidak diganti saat hasil dihitung ulang. Grafik simulasi tidak diberi tween yang tertinggal dari kontrol.
- Reduced transparency mengubah material menjadi solid; prefers-contrast menambahkan batas yang lebih tegas.

## Konten

Hasil utama diberi label “Putus sekolah tercegah · simulasi”; ini bukan jumlah seluruh siswa yang bertahan atau penerima aktual. Seed 0 adalah evaluasi outcome simulasi. Perbandingan membedakan evaluasi dari proyeksi. Populasi rentan selalu disebut proksi. Rujukan 38 provinsi mengikuti berkas lokal, bukan klaim batas administrasi terkini. Asumsi κ, rentang stabilitas, dan status mockup dijelaskan sesuai konteks.

Semua 18 layar tetap tersedia. Audit per layar, alasan perubahan, batas verifikasi, dan bukti pengujian terdapat pada AUDIT_DESAIN_DAN_KONTEN.md. Laporan aktif ada di verification/apple/. Laporan Onda sebelumnya merupakan arsip historis.

## Permukaan kartu aktif

`app/cards.css` mengadaptasi permukaan card pada komponen SignIn1 yang diberikan pengguna. Dasar #121212, gradient putih transparan menuju charcoal, border putih tipis, radius 24 px (20 px mobile), blur 4 px, bayangan lembut, ikon bundar, serta input transparan. Semua panel/hero memakai treatment yang sama; teks, grafik, tabel, status, dan kontrol disesuaikan untuk permukaan gelap. Gaya sidebar dan layout tetap mengikuti spesifikasi di atas. CSS dibatasi pada screen agar hasil cetak tetap putih. Reduced transparency memakai dasar solid dan high contrast memakai border lebih tegas.

## Dua mode tampilan

Light mempertahankan palet putih/abu/biru sebelumnya. Dark mempertahankan card charcoal dan aksen biru, dengan sidebar/toolbar/latar gelap yang selaras. Bentuk card dan layout sama pada keduanya. `data-theme` di elemen html memilih mode; `theme-init.js` membaca pilihan sebelum paint dan `ui.js` memperbarui aria-pressed serta preferensi tersimpan. Dark card di cards.css dibatasi pada root dark, tema shell di themes.css. Cetak selalu menggunakan variabel terang.
