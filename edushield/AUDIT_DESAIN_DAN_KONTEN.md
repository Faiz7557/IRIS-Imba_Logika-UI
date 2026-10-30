# Audit desain, interaksi, dan konten EduShield

Catatan versi: dokumen ini merekam perombakan sidebar awal. Permukaan kartu aktif kemudian diperbarui menjadi dark glass; lihat KARTU_GLASS.md untuk perubahan dan bukti terbaru.

Permintaan: hilangkan kode “A” pada navigasi, gunakan sidebar, rombak desain dan palet melalui skill apple-design, tambahkan gerak yang halus, dan kurasi isi prototype secara menyeluruh. Implementasi memakai apple-design dan emil-design-eng. Tidak menambahkan klaim afiliasi dengan Apple, aset logo Apple, font proprietary yang diunduh, maupun SF Symbols.

## Hasil dan keputusan desain

Antarmuka aktif berubah dari landing page Onda hitam/violet menjadi aplikasi perencanaan dengan sidebar, panel putih, latar abu terang, teks grafit, dan aksen biru. Kode A1–A8, B1–B4, C1–C3, serta L1–L3 dihapus dari label yang terlihat; rute internal dipertahankan untuk kompatibilitas. Nama tugas menjadi navigasi utama.

| Before | After | Why |
|---|---|---|
| Navbar horizontal mengulang akses cepat dan daftar semua layar | Sidebar dikelompokkan menjadi Tinjauan, Simulasi, dan Usulan | Hierarki tugas terlihat tanpa membaca kode layar |
| Kode A/B/C dan badge kode pada judul | Ikon, nama halaman, breadcrumb, dan satu state aktif | Kode implementasi tidak membantu pengguna menentukan langkah |
| Hero “Terarah” sangat besar dengan orb dekoratif | Ringkasan anggaran dan hasil, dengan konteks skenario dan ring porsi anggaran | Produk digunakan untuk menganalisis, sehingga data dan tindakan harus lebih dekat |
| Hitam/violet dominan dan Arial Black | Grafit, biru analisis, putih, font sistem | Mengurangi kontras bidang yang berlebihan dan memperbaiki hierarki baca |
| Menu mobile disclosure yang mendorong konten | Panel samping bermaterial dengan scrim dan fokus dialog | Posisi navigasi konsisten dengan sidebar desktop |
| Gerak awal hero tanpa hubungan dengan aktivitas analisis | Spring drawer yang dapat dibalik, transisi halaman singkat, feedback saat ditekan | Gerak menjelaskan perubahan keadaan |
| render() mengganti range input setiap input slider | Kontrol dipertahankan; hanya hasil dan tabel diperbarui | Drag pointer dan fokus tetap tersambung |
| Solver mengulangi interval pencarian yang sudah tidak berubah | Iterasi berhenti setelah kedua batas tetap pada presisi floating point | Mengurangi kerja sinkron tanpa mengubah hasil |
| Tanda positif kontribusi model berwarna hijau | Kontribusi memakai warna informasional dan tanda numerik | Kontribusi positif menaikkan risiko, bukan otomatis hal yang baik |
| Label perbandingan hanya berubah warna | Segmented control memiliki aria-pressed dan fokus dipertahankan | Keadaan pilihan terbaca oleh teknologi bantu |
| Footer kecil berkontras lemah | Warna teks kecil diperkuat | Teks sekunder tetap harus terbaca |

## Audit dan kurasi 18 layar

| Before | After | Why |
|---|---|---|
| A1: slogan dan “proyeksi siswa tertahan” untuk nilai evaluasi | Ringkasan nasional; “Putus sekolah tercegah · simulasi”; baseline merata dan seed 0 eksplisit | Menghindari pembacaan sebagai hasil observasi, seluruh siswa bertahan, atau proyeksi model yang berbeda |
| A2: radar dengan konteks simulasi tersebar | Tujuan pencarian dan sifat risiko simulasi ada pada ringkasan; petak tetap diberi simbol | Tidak menyamakan petak dengan peta geografis atau warna sebagai satu-satunya informasi |
| A3: “laju” dan kontribusi bertanda positif/negatif | Risiko terprediksi, sumber kemiskinan BPS 2025, dan faktor model bernada netral | Memisahkan prediksi, sumber riil, dan hubungan non-kausal |
| A4: judul promosi dan simbol parameter tanpa panduan lokal | Simulator kuota; setiap penggeser memiliki label, satuan, dan penjelasan | Pengguna mengetahui parameter yang berubah dan aturan kelayakannya |
| A5: greedy/oracle sebagai jargon utama | Prioritas risiko tertinggi/acuan ideal simulasi; evaluasi dan proyeksi dipilih eksplisit | Pembanding ideal hanya diketahui pada simulasi, bukan saat keputusan nyata |
| A6: nama kunci mc_regret muncul pada penjelasan | Arti keunggulan positif/negatif dijelaskan terhadap merata | Detail penyimpanan tidak membantu penafsiran hasil |
| A7: judul slogan dan istilah hold-harmless | Transisi kuota; batas penurunan 10% per tahun dijelaskan | Menunjukkan tugas dan perlindungan yang benar-benar dihitung |
| A8: “Lembar keputusan” | Lembar usulan, catatan peninjau, dan label belum menetapkan penerima | Menghindari kesan kewenangan keputusan otomatis |
| B1: “Kuota daerah, alasan yang terbuka” | Ringkasan daerah, perbandingan merata/EduShield/transisi | Nama halaman menjelaskan isinya; merata tetap bukan riwayat kuota aktual |
| B2: “Mengapa skor kami” | Penjelasan risiko | Sistem memprediksi laju agregat dan bukan skor kelayakan individu |
| B3: “Ajukan koreksi” terkesan mengirim | Koreksi data; ringkasan dan status menyebut pratinjau, belum dikirim/disimpan | Tidak memberi konfirmasi palsu untuk layanan yang belum ada |
| B4: “Lapor realisasi” | Laporan realisasi, pilihan berkas lokal, keterangan tidak diunggah | Pengguna memahami batas tindakan yang tersedia |
| C1: “Muat data” terkesan mengimpor | Paket data semester; pemeriksaan lokal dan metadata calon berkas | Memilih berkas tidak berarti mengubah paket atau model |
| C2: judul berorientasi janji keputusan | Kalibrasi model; indikator dan rencana pemeriksaan | Hasil referensi tidak diklaim sebagai pelatihan ulang aktif |
| C3: antrean contoh berpotensi disangka operasi produksi | Audit & anomali dengan status rancangan yang eksplisit | Tidak mengklaim pencatatan server atau otorisasi yang belum tersedia |
| L1: palet violet/Arial Black | Identitas sistem, palet biru/grafit, font lokal, dan prinsip gerak | Dokumentasi mencerminkan aplikasi aktif |
| L2: jargon arsitektur dan klaim 38 provinsi tanpa batas konteks | Asal data, proksi, rentang stabilitas, faktor model, ID internal, dan versi | Pengelompokan berkas tidak sama dengan verifikasi administrasi terkini |
| L3: jadwal dan indikator pilot | Rencana uji coba dengan target yang belum tercapai | Membedakan usulan riset dari hasil yang telah terbukti |

## Prinsip editorial

Nama halaman menjelaskan isi; tombol menjelaskan tindakan. “Anggaran” dipakai pada kontrol utama, sedangkan istilah teknis seperti KKT, κ, dan harga bayangan disertai konteks. Seed, asumsi manfaat, rentang P5–P95, dan keterbatasan model tetap dipertahankan. Tidak mengarang sumber, klien, hasil pilot, atau kemampuan produksi. Data BPS tidak diperbarui otomatis; tanggal dan periode mengikuti metadata paket lokal.

Skenario aktif dan eksperimen referensi tetap dipisahkan. Rentang stabilitas bukan interval prediksi maupun kepercayaan. Kuota tetap kontinu dan populasi rentan tetap proksi. Asumsi κ=1,74 belum menjadi bukti efek kausal terverifikasi. Peran adalah pemilih ruang kerja, bukan autentikasi. Data pribadi siswa tidak ditambahkan.

## Aksesibilitas dan gerak

Sidebar desktop menjadi dialog pada ≤1023 px. Pengguna dapat menutup melalui tombol, scrim, atau Escape. Fokus tidak masuk ke latar saat dialog terbuka, tetap berada di dalam panel saat Tab, dan kembali ke pemicu saat ditutup. Memilih tautan menuju halaman aktif juga mengembalikan fokus dengan benar. Perubahan ukuran ke desktop menghapus inert dan scroll lock.

Spring mempertahankan posisi/velocity saat target berubah. Setelah penutupan dimulai, scrim tidak mengunci tombol pemicu sehingga animasi dapat dibalik. Transisi halaman tidak diterapkan pada aksi keyboard. Reduced-motion melakukan perubahan langsung; reduced-transparency menghilangkan blur dan prefers-contrast mempertegas pemisah. Tidak ada animasi berulang atau gulir yang diambil alih.

Tabel memiliki region berlabel dan dapat difokuskan. Formulir memiliki label, status live, serta batas input. Teks memakai rem; pembesaran 200% diperiksa di desktop dan mobile. Simbol I–IV, nilai angka, dan pola garis melengkapi warna.

## Verifikasi dan batas bukti

Bukti terbaru ada di `verification/apple/`:

- `report.json`: pengujian 18 rute pada enam lebar, tanpa overflow halaman, satu judul utama dan satu tautan sidebar aktif; pemeriksaan interaksi, fokus, drag pointer, status pratinjau, ekspor, PDF/cetak, pembesaran teks, pembalikan animasi, dan reduced-motion.
- `solver-equivalence.json`: seluruh field hasil simulasi identik hingga bit terakhir dengan solver sebelum perubahan, pada delapan skenario termasuk kedua batas cakupan yang sama. Perubahan hanya berhenti saat iterasi tidak membuat kemajuan numerik lagi.
- `contrast.json`: rasio pasangan token teks diperiksa terhadap ambang 4,5:1. Ini pemeriksaan pasangan terpilih, bukan sertifikasi WCAG menyeluruh.
- Screenshot seluruh layar desktop dan mobile; `Sidebar-mobile.png` memperlihatkan panel navigasi. `Lembar-Usulan.pdf` memperlihatkan mode cetak dengan catatan peninjau.

Uji fixture `node edushield/test_app.cjs` tetap dijalankan: parity skema, anggaran, batas, lintasan lima tahun, serta penolakan skenario tidak layak. Angka performa dicatat sebagai hasil pada host ini, bukan jaminan latensi universal.

Chrome pengujian membatalkan unduhan Blob native; status aslinya dicatat di report.json. Isi CSV/JSON diverifikasi dari Blob yang dihasilkan handler ekspor. Penyimpanan unduhan langsung tidak dinyatakan lulus. Pembukaan dan ekspor aplikasi tidak melakukan permintaan jaringan eksternal dalam pengujian.

Pengujian dilakukan dengan Chromium/Chrome, belum dengan perangkat iOS fisik, Safari, pembaca layar manusia, atau studi pengguna. Material memakai fallback solid ketika blur tidak didukung. Pengujian usability nyata tetap diperlukan sebelum pilot.

## Berkas aktif dan distribusi

`app/index.html`, `style.css`, `ui.js`, `app.js`, `kkt.js`, `logo.svg`, dan catatan kredit diperbarui. Paket data dan formulanya tidak diubah. `README.md` dan `DESIGN.md` menjelaskan versi aktif. Cadangan ada di `verification/before-apple/`.

Paket baru: `deliverables/UEC0032_EduShield_Prototype_Sidebar_Offline.zip`. Paket Onda sebelumnya dan audit historisnya tetap tersedia sebagai versi terdahulu. Source Onda dan pemberitahuan lisensi MIT tetap tersimpan; antarmuka aktif tidak memakai aset Apple proprietary atau sumber jaringan eksternal.
