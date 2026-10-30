# Audit dan implementasi template Onda pada EduShield

Referensi: `design-studio-website-template-main.zip` yang diberikan pengguna; sumber aslinya 8B, https://github.com/8bsite/design-studio-website-template. Referensi Treasury Management sebelumnya digantikan oleh ZIP ini. Audit dilakukan dari HTML, CSS, JavaScript, README, CREDITS, LICENSE, dan preview desktop/mobile yang tersedia di arsip, bukan dari ringkasan halaman web.

## Temuan keseluruhan

Template adalah situs studio satu halaman dengan sepuluh bagian utama, navigasi, dan footer, CSS inline, GSAP 3.13.0/ScrollTrigger dan Lenis 1.3.4 dari CDN. Identitas visual utamanya adalah bidang #0D0C11 dan putih, satu aksen #6C3CFF, permukaan #EFEEF4, judul sangat besar dan rapat, titik lingkaran, tombol pil, sudut kartu 28 px, serta orb dengan garis orbit. Gabarito dipakai untuk judul dan Onest untuk isi. Banyak komponen mempunyai koreografi gulir: foto berpindah, track horizontal disematkan, roda klien, kartu bertumpuk, ring proses, kolase, dan pergantian gambar.

Kekuatan: identitas konsisten, hierarki judul kuat, pergantian bidang mudah dibaca, tombol utama jelas, FAQ native, dan jalur reduced-motion tersedia. Keterbatasan: foto dan font tidak dibundel; runtime animasi memerlukan CDN; track horizontal panjang menambah jarak gulir; beberapa transisi berpotensi bertumpuk; menu mobile memerlukan JavaScript. Formulir kontak/newsletter hanya validasi lokal, kartu proyek/artikel belum mempunyai tujuan, dan data klien, alamat, hasil proyek, serta lowongan adalah demo. Hal-hal tersebut tidak cocok dipindahkan mentah ke aplikasi analisis kuota.

## Audit dan pemetaan komponen

| Area template | Perilaku asli | Implementasi EduShield |
|---|---|---|
| Navigation | Bar tetap, tautan seksi, CTA, overlay mobile | Masthead melekat, akses cepat empat layar, CTA lembar keputusan; Menu mobile membuka navigasi semua layar dan peran |
| Hello / hero | Kata raksasa, foto bundar, orbit; foto berpindah saat gulir | Beranda “Terarah”, pengantar kuota, CTA simulator, orb SVG violet lokal dengan orbit |
| Statement | Pernyataan dua baris; kata menggelap mengikuti gulir | “Setiap kuota, lebih bermakna” dan penjelasan ringkasan nasional |
| Selected work | Lima kartu dalam track horizontal panjang | Ringkasan pagu/proksi/manfaat dan panel cakupan gugus, semuanya memakai hasil solver aktif |
| Never a one-off | Enam klien dalam roda berputar | Area klien demo dihilangkan; konteks 514 kabupaten/kota dan 38 provinsi tetap tampil |
| What we do | Lima kartu jasa bertumpuk | Panel analisis dan kontrol di semua layar, permukaan lavender dan radius konsisten |
| How we work | Empat stasiun dalam ring animasi | Empat langkah nyata: risiko, simulasi, transisi, keputusan; urutan terlihat tanpa gulir yang disematkan |
| Inside the studio | Kolase lima foto dan lowongan | Tidak dipakai karena tidak relevan; fungsi layar dinas/admin dipertahankan |
| Ideas and news | Empat cerita dan frame gambar sticky | Digantikan dokumentasi identitas, arsitektur/data, dan rencana pilot |
| Fair questions | FAQ native details | Komponen details yang sudah ada tetap berfungsi dan diberi tema konsisten |
| Let's talk | Bidang violet, kontak, formulir contoh | Bidang violet mengarahkan pengguna ke simulator; tanpa formulir kontak fiktif |
| Footer | “Bye”, kolom tautan, newsletter dan kredit | Brand, dokumentasi, versi data/model/hash, dan atribusi 8B; tanpa newsletter |

Ini adaptasi bahasa visual ke aplikasi multi-layar. Struktur agency, jumlah kartu foto, dan skrip GSAP yang mengandalkan selector tertentu tidak disalin ke layar kerja. Source referensi asli tetap tersimpan tanpa perubahan untuk ditinjau.

## Sistem visual yang diterapkan

- Gelap/teks #0D0C11; putih #FFFFFF; violet #6C3CFF; tautan #6030E8; permukaan #EFEEF4; teks sekunder #5D5A67; garis #DBD9E3.
- Judul memakai Arial Black dengan cadangan Segoe UI/Arial, isi Segoe UI/Arial lokal. Gabarito/Onest tidak disertakan dalam ZIP dan akses font eksternal tidak tersedia; karena itu hasil metrik tipografi berbeda dari Onda asli.
- Orb lokal `app/assets/allocation-orb.svg` menggantikan foto eksternal. Seluruh aplikasi dapat dibuka langsung melalui file lokal tanpa server atau koneksi.
- Judul analisis memakai titik violet; CTA dan navigasi aktif berbentuk pil. Tabel, label angka, notifikasi, input, pilihan, grafik, petak risiko, bejana, dan identitas visual menerima token yang sama.
- Animasi hanya kemunculan awal singkat pada hero; reduced-motion menghapusnya. Tidak ada smooth-scroll override atau animasi berjalan terus-menerus.

## Fungsi dan aksesibilitas

Seluruh 18 rute A1–A8, B1–B4, C1–C3, L1–L3 dipertahankan. Solver, data, parameter, dan rumus tidak diubah. Formulir produksi tetap jelas sebagai mockup; batas interpretasi dan penanda data simulasi tetap terlihat. Perubahan shell mempertahankan reset, pemilih peran, drilldown wilayah, penggeser, pencarian, pembanding, serta handler CSV/JSON/cetak.

Tampilan ≤800 px memakai disclosure Menu dengan `aria-expanded`/`aria-controls`; Escape menutup menu dan mengembalikan fokus. Tampilan ≤560 px memakai panel satu kolom. Tabel panjang digeser di dalam region berlabel yang dapat difokuskan. Grid formulir mempunyai track minimum nol agar nama wilayah panjang tidak melebarkan halaman. Tautan lewati navigasi, indikator fokus, label input, status live, dan simbol kategori risiko dipertahankan. Tampilan cetak menghilangkan navigasi dan mempertahankan banner usulan simulasi.

## Bukti verifikasi

- `node edushield/test_app.cjs`: solver cocok dengan fixture numerik, lima skema cocok dengan ringkasan, batas dan pagu terpenuhi, enam skenario transisi diuji.
- `node edushield/test_theme.cjs`: 18 rute × empat lebar (1440, 768, 390, 375), satu h1 per layar, banner simulasi terlihat, dan tidak ada overflow halaman. Pengujian juga mencakup menu/Escape/peran, CTA, penggeser, input tidak layak, reset, pencarian, drilldown, pemilih evaluasi/proyeksi, isi ekspor, cetak/PDF, dan preferensi motion.
- `verification/onda/report.json`: status akhir dan rincian browser. Screenshot desktop/mobile seluruh layar ada dalam folder yang sama. `Beranda-desktop.png` dan `Beranda-mobile.png` adalah preview utama.
- `verification/onda/contrast.json`: 13 pasangan token teks statis memenuhi 4,5:1, minimum 5,63:1. Ini pemeriksaan token, bukan sertifikasi aksesibilitas menyeluruh.
- Permintaan jaringan saat penggunaan aplikasi diperiksa dalam pengujian browser; aset aplikasi dimuat lokal.

Batas verifikasi unduhan: Chrome pada host pengujian membatalkan semua unduhan Blob, termasuk kontrol teks sederhana. Handler ekspor asli dijalankan, Blob CSV/JSON diambil untuk diverifikasi dan disimpan sebagai bukti. Dialog/penyimpanan unduhan browser belum terverifikasi dalam lingkungan ini. PDF dihasilkan oleh browser dan visibilitas mode cetak diperiksa.

## Berkas dan distribusi

Antarmuka aktif: `app/index.html`, `app/style.css`, `app/app.js`, `app/logo.svg`, dan `app/assets/allocation-orb.svg`. `data.js`, `app_data.json`, dan `kkt.js` tidak diubah. Identitas visual L1 dan DESIGN.md diperbarui agar konsisten. Cadangan empat berkas antarmuka sebelum adaptasi ada di `verification/before-onda/`.

Kode template berlisensi MIT; pemberitahuan hak cipta disertakan dalam `app/TEMPLATE_LICENSE.txt`, atribusi terlihat di footer, dan catatan adaptasi tersedia di `app/TEMPLATE_CREDITS.md`. Tidak ada foto Unsplash maupun GSAP/Lenis yang didistribusikan dalam aplikasi aktif. README/CREDITS asli tetap berada bersama source referensi.

Paket distribusi baru menggunakan nama `deliverables/UEC0032_EduShield_Prototype_Onda_Offline.zip`, terpisah dari paket review lama. Setelah diekstrak, buka `edushield/app/index.html`.
