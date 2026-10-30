# Audit sumber dan klaim — 30 Oktober 2026

Tidak semua URL yang ada di daftar pustaka berhasil dibaca penuh. Status berikut membedakan metadata, isi yang terbaca, dan tabel yang belum terverifikasi. “Primer” menyatakan asal sumber, bukan jaminan bahwa seluruh halaman sudah ditelaah.

| Plan | Hasil verifikasi | Keputusan naskah |
|---|---|---|
| R1 APS 0,86/0,54/0,09 | Laman publikasi BPS terbaca; angka ditemukan pada media, belum pada tabel primer | Angka dan grafik urgensi tersebut tidak dipakai |
| R2 ATS 19,20% | Tabel BPS asli belum terbaca | Tidak dipakai |
| R3 ATS nasional | Belum memperoleh snapshot dasbor bertanggal | Tidak memakai angka jutaan ATS |
| R4 Perpres 3/2026 | Judul/nomor dan maksud terkonfirmasi rilis Bappenas 3 Juni 2026 dan Kemendikdasmen 4 Juni 2026; halaman peraturan gagal diakses | Kutip rilis pemerintah; tidak membuat klaim pasal |
| R5 PIP Rp1,8 juta | Rilis Puslapdik 7 Juli 2025 terbaca, menyebut nominal penuh dan Rp900 ribu bagi kelas awal/akhir | Digunakan dengan pengecualian nominal setengah tahun |
| R6 Rp2,86 T / 5.364.986 siswa | Teks primer terindeks dari domain foresight.bpk.go.id, IHPS II 2020, Gambar 1.9 hlm. cetak 140; PDF penuh 20,9 MB melampaui batas pembaca web | Dipakai sebagai temuan historis TA 2018–Semester I 2020, bukan kebocoran 2026 |
| R7 5,5 juta tidak menerima | Primer belum ditemukan | Tidak dipakai |
| R8 efek PIP SMA 2,8% | Abstrak situs JPBM dan repositori tesis UI terbaca. PDF jurnal gagal diakses. Abstrak menyebut probit/marginal effect, tetapi tabel satuan belum diperiksa | κ=1,74 disebut asumsi, bukan kalibrasi empiris yang sudah sah. LM3 membuka pembalikan target 0,028 dan kewajiban kalibrasi ulang jika relatif |
| R9 BPS kovariat | Salinan lokal lengkap dan header asal dipertahankan; laman kemiskinan terbaca sebagai metadata; tabel umur mengembalikan 403 saat peninjauan ulang | Atribusi BPS atas salinan lokal, bukan klaim unduh ulang tervalidasi angka demi angka |
| R10 teori | Buku Boyd tersedia di laman penulis Stanford; SPO terkonfirmasi preprint penulis dan daftar publikasi Grigas. Sparrow/Cameron pada repositori universitas | Digunakan untuk kerangka, bukan peminjaman ukuran efek ke SMA masa kini |
| R11 proportional fairness | Laman penulis Kelly Cambridge terbaca, judul/jurnal/volume/halaman terkonfirmasi | Turunan sendiri pada utilitas log. Kesetaraan pembanding hanya pada biaya seragam |
| R12 water-filling kanal | Tidak diperlukan untuk membenarkan turunan spesifik EduShield | Rujukan opsional Cover–Thomas dihilangkan; tidak mengklaim algoritma baru |
| R13 respons fraksional | Laman NBER penulis Papke–Wooldridge menjelaskan metode, mengonfirmasi publikasi JAE 11:619–632 (1996) | Hubungan konseptual dijelaskan; implementasi tetap GLM binomial berbobot |
| R14 PDP | Teks UU terbaca pada JDIH Komdigi; Pasal 20(2)e dan 25 diperiksa | Mandat pengendali, kewajiban data anak, dan identifikasi ulang tidak dianggap selesai hanya karena agregasi |
| R15 kovariat opsional | Tidak ditambahkan | Menghindari perluasan yang tidak terverifikasi |

Seluruh 15 referensi dipanggil dalam urutan kemunculan dan mempunyai nomor pustaka. Tanggal akses tercatat. Artikel LightGBM memakai prosiding resmi NeurIPS. Rumberger tidak dipertahankan karena uraian ringkas tidak memerlukan klaim spesifik dari buku itu. Tidak ada kutipan panjang yang disalin.

## Hal yang perlu diperiksa sebelum klaim empiris diperkuat

1. Tabel penuh Listiyanto–Qibthiyyah dan kelompok estimandnya; “marginal effect” pada abstrak belum cukup untuk menjustifikasi transfer efek ke setiap wilayah.
2. Audit angka salinan BPS terhadap unduhan resmi mesin dan kode wilayah, termasuk periode proyeksi umur.
3. Tidak memakai hasil simulasi sebagai estimasi retensi riil. Rerata DGP 2,5% dipilih untuk eksperimen, bukan dikutip dari BPS.
4. Tidak menulis “semua URL hidup” berdasarkan tautan yang hanya ada; keterbatasan 403, timeout, dan batas ukuran tetap dicatat di sini.

## Tambahan 30 Oktober 2026 (versi esai IRIS Imba)

| Kunci | Hasil verifikasi | Keputusan naskah |
|---|---|---|
| bpsaps | Tabel BPS "APS Menurut Provinsi dan Kelompok Umur" dibaca langsung di bps.go.id (dirender peramban), data 2025, diperbarui 28 Agustus 2026. Salinan: `edushield/data/raw/bps_aps_provinsi_2025.csv` | APS 7–12 = 99,23; 16–18 = 77,86; Papua Tengah 44,61; DIY 93,03; dipakai di BAB I dan Gambar 1 |
| bpsats | Tabel BPS "Angka Anak Tidak Sekolah Menurut Jenjang Pendidikan dan Kuintil Pengeluaran", Susenas 2023, diperbarui 8 April 2026. Salinan: `bps_ats_kuintil_2023.csv` | ATS usia SMA K1 30,66 vs K5 14,67; Gambar 1c |
| puslapdik | Rilis Puslapdik 22 Januari 2026, kalimat "telah menjangkau sekitar 19 juta peserta didik" terbaca | Dipakai sebagai skala PIP 2025; angka anggaran tidak dipakai karena berbeda antarsumber |
| aktivasi | Rilis Puslapdik 30 Januari 2026, 2.510.032 penerima PIP 2025 belum aktivasi rekening per 31 Desember 2025 | Dipakai sebagai indikasi bantuan belum sampai |

Angka media sekunder (GoodStats, JPNN) tentang APS 0,86%/1,02% dan ATS 19,20% tetap tidak dipakai karena tabel primernya tidak terbaca.
