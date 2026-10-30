# BAB I
# PENDAHULUAN
## 1.1 Latar belakang
PIP menyediakan bantuan SMA/SMK Rp1,8 juta per siswa per tahun, dengan nominal setengah tahun bagi kelas awal/akhir [1]. Kuota terbatas memerlukan keputusan tentang daerah penerima dan besar dukungannya. IHPS II 2020 BPK mencatat sedikitnya 5.364.986 siswa senilai Rp2,86 triliun menerima penyaluran tidak tepat sasaran pada periode TA 2018–Semester I 2020 [2]. Temuan historis ini menunjukkan kebutuhan validasi; ia tidak mengukur salah sasaran tahun 2026.
Rilis pemerintah mengenai Perpres 3/2026 menempatkan pencegahan dan penanganan anak tidak sekolah sebagai agenda terkoordinasi [3]. Kami mengusulkan EduShield untuk membantu penyusunan kuota PIP kabupaten/kota: prediksi laju putus sekolah dihubungkan dengan optimasi imbal hasil menurun. Tambahan kuota diasumsikan memberi manfaat lebih kecil setelah cakupan wilayah meningkat.
## 1.2 Rumusan masalah
Seberapa baik laju diprediksi ketika provinsi uji disembunyikan? Bagaimana kuota dibagi pada pagu tetap dan batas perlindungan? Bagaimana usulan dijelaskan dan diterapkan bertahap?
## 1.3 Tujuan
Kami mendemonstrasikan alur prediksi–alokasi yang dapat diaudit. Prediksi yang dijelaskan mendukung sistem cerdas, simulasi pagu mendukung adaptasi, sedangkan transisi dan kalibrasi mendukung keberlanjutan. Seluruh outcome, kuota, dan manfaat evaluasi adalah simulasi; studi ini belum mengukur dampak di lapangan.
[PAGE]
# BAB II
# LANDASAN TEORI
## 2.1 Dari prediksi menuju keputusan
Elmachtoub dan Grigas menekankan kerugian keputusan akibat kesalahan prediksi [4]. EduShield memakai alur predict-then-optimize, tetapi belum melatih model dengan fungsi kerugian SPO+. Prediksi menggunakan GLM binomial berbobot siswa rentan, dengan fungsi logit. Pemodelan respons terbatas berkaitan dengan kerangka Papke dan Wooldridge [5].
## 2.2 Imbal hasil menurun dan KKT
Untuk proksi siswa rentan Vᵢ, laju prediksi ρᵢ, dan kuota xᵢ, manfaat diasumsikan:
[EQ] sᵢ(xᵢ) = Vᵢρᵢ[1 − exp(−κxᵢ/Vᵢ)]                                      (1)
Kami memaksimumkan Σsᵢ dengan Σcᵢxᵢ=B dan αVᵢ≤xᵢ≤βVᵢ. Tujuan cekung dan kendala linear memungkinkan karakterisasi KKT [6]. Penurunan sendiri dari (1) memberi:
[EQ] xᵢ* = clip{(Vᵢ/κ) ln[κρᵢ/(λ*cᵢ)], αVᵢ, βVᵢ}                           (2)
Pengali λ* dicari dengan bagi-dua. Wilayah interior memiliki manfaat marjinal per rupiah sama. Utilitas log Σwᵢln xᵢ berkaitan dengan proportional fairness [7] dan memberi xᵢ=wᵢ/(λcᵢ); untuk biaya seragam dan wᵢ=Vᵢρᵢ, kuotanya proporsional risiko.
## 2.3 Asumsi efek bantuan
Abstrak Listiyanto–Qibthiyyah menyebut pengaruh PIP SMA 2,8 persen dengan marginal effect [8]. Tabel lengkap dan satuan efek belum berhasil diperiksa. Karena itu κ=1,74 diperlakukan sebagai asumsi skenario, disertai sensitivitas. LM1–LM4 membuka penurunan dan batas penafsirannya.
[PAGE]
# BAB III
# PEMBAHASAN
## 3.1 Data dan desain studi
Salinan lokal tabel BPS kemiskinan 2025 [9] dan penduduk menurut umur 2026 [10] dipadankan pada 514 kabupaten/kota, 38 provinsi. Statistik Pendidikan 2025 memberi konteks indikator [11]; anak tidak sekolah, partisipasi sekolah, dan laju putus sekolah memiliki penyebut berbeda.
Proksi Vᵢ=bulat(0,6 × penduduk 15–19 × 0,74 × proporsi miskin), minimum 10. Faktor usia dan partisipasi merupakan asumsi; kemiskinan penduduk belum tentu mewakili siswa. Total proksi 853.330 bukan jumlah penerima terdaftar. Pagu simulasi dasar Rp844,80 miliar mencakup 55% proksi pada biaya Rp1,8 juta.
[FIG data|Gambar 1. Kovariat kemiskinan nyata pada salinan BPS dan laju putus sekolah simulasi; outcome tidak berasal dari Dapodik]
Laju benar dibangkitkan dari logit dengan ambang kemiskinan, interaksi keterpencilan, efek provinsi dan galat wilayah; rerata tertimbangnya 2,5% dalam simulasi. Outcome teramati binomial. GLM tidak memuat seluruh komponen pembangkit. Seed 0 memakai sepuluh pembagian lima lipatan provinsi; Monte Carlo memakai 30 outcome baru. DGP dan seed dibuka di LM2.
[PAGE]
## 3.2 Melihat risiko lebih awal
Dalam simulasi, GLM tanpa riwayat mencapai MAE 0,670 poin persentase, Spearman 0,769, dan AUC 0,907. Zona Merah berarti laju benar di atas rerata tertimbang, bukan klasifikasi siswa. LightGBM [12] tidak mengungguli GLM pada MAE dan Spearman dalam eksperimen ini.
[TABLE prediction]
[FIG prediction|Gambar 2. Prediksi di provinsi uji versus laju benar seed 0; risiko ekstrem Supiori diremehkan dalam simulasi]
Supiori memiliki laju benar 38,05% dan prediksi 23,36% dalam simulasi. Rentang antar-lipatan hanya menunjukkan stabilitas model, bukan interval prediksi. Standardisasi memakai seluruh kovariat sehingga pengujian bersifat transduktif, meskipun outcome uji tidak dipakai melatih model. Pilot harus membekukan praproses latih dan menguji semester berikutnya.
[PAGE]
## 3.3 Membagi kuota dengan cerdas
Batas cakupan dasar 20–95% dari Vᵢ. Merata memberi cakupan sama; kemiskinan dan greedy memakai urutan prioritas. Proporsional memakai Vᵢρᵢ, KKT memakai (2), sedangkan oracle mengetahui laju benar simulasi.
[TABLE allocation]
[FIG schemes|Gambar 3. Median keunggulan atas merata dalam 30 simulasi; garis adalah P5–P95, bukan interval kepercayaan efek kebijakan]
Dalam simulasi, median keunggulan KKT 7,34% [5,71; 9,41], proporsional 7,54%, dan manfaat KKT/oracle 97,82%. KKT tidak selalu mengalahkan proporsional pada laju benar. Pada seed 0, cakupan Zona Merah greedy 89,65% melebihi KKT 82,13%, tetapi siswa tertahan lebih sedikit. Harga bayangan model 6,77 siswa/Rp1 miliar bergantung pada κ; ia bukan estimasi pengembalian anggaran riil.
[PAGE]
## 3.4 Ketahanan dan transisi
Optimasi tiga κ dievaluasi pada enam kurva benar. Dalam simulasi, 17 dari 18 median keunggulan terhadap merata positif. Ini bukan regret terhadap optimum kurva evaluasi dan tidak menjamin setiap ulangan positif.
[FIG robustness|Gambar 4. Median keunggulan atas merata ketika kurva manfaat evaluasi berbeda dari asumsi optimasi, seluruhnya simulasi]
Pada pagu 30%, median keunggulan KKT 20,16%; pada pagu 80%, 2,14%. Biaya terpencil +15% pada pagu tetap memberi 7,13%. Simulator interaktif mendefinisikan porsi pagu dari biaya cakupan penuh skenario aktif, sehingga kedua eksperimen berbeda.
[FIG transition|Gambar 5. Transisi lima wilayah seed 0 dengan lantai max(αVᵢ, 0,9xᵢ tahun lalu), pada pagu tetap simulasi]
Median keunggulan transisi pertama 6,96%, sekitar 0,39 poin persentase di bawah KKT langsung. Batas turun 10% per tahun dipenuhi pada pagu tetap. Pemotongan pagu antar-tahun dapat membuat lantai baru tidak layak dan memerlukan keputusan kebijakan.
[PAGE]
## 3.5 EduShield sebagai ruang keputusan
Analis meninjau risiko dan alasan wilayah, mengubah pagu, membandingkan skema serta transisi, lalu mencetak usulan. Dinas melihat alasan kuotanya; banding, realisasi dan kalibrasi masih mockup berlabel.
[TABLE features]
[FIG app|Gambar 6. Simulator kuota 514 wilayah; tinggi bejana menunjukkan cakupan, sedangkan profil menjelaskan manfaat marjinal; seluruh angka simulasi]
Arsitektur menghubungkan data agregat, analitik Python, paket JSON berversi, dan antarmuka offline. Peta petak bersifat non-geografis. Ekspor memuat label simulasi, parameter, versi, dan hash. Kuota kontinu belum dibulatkan; pergantian ruang kerja belum merupakan autentikasi.
Uji tiga pagu memberi selisih relatif maksimum JavaScript–Python 3 × 10⁻¹⁵ dan waktu peramban sekitar 10,9 ms. Seluruh 18 layar diuji tanpa galat JavaScript. Rincian layar dan alasan desain tersedia di lampiran prototype.
[PAGE]
## 3.6 Aktualisasi dan tata kelola
Pilot 0–6 bulan diusulkan pada NTT dan Papua Pegunungan untuk memadankan agregat Dapodik–DTSEN–BPS, mengaudit V dan menguji semester berikutnya. Target awal MAE ≤0,7 poin persentase dan seluruh wilayah pilot cocok belum merupakan capaian. Tahap 6–18 bulan menguji kuota tambahan melalui desain bertahap atau kuasi-eksperimen, dengan pengukuran retensi dan estimasi κ lokal. Tahap 18–36 bulan membangun siklus semesteran, banding, dan audit bias.
Studi Sparrow [13] dan Cameron [14] memberi alasan menguji bantuan finansial, tetapi konteksnya berbeda dan tidak membuktikan kurva respons wilayah yang diasumsikan. Pilot perlu memisahkan hambatan kuota, pencairan, dan akses sekolah.
Kekuatan EduShield adalah tujuan serta alasan keputusan yang eksplisit. Kelemahannya: outcome semi-sintetis, proksi ekologis, dan κ belum tervalidasi. Peluangnya adalah pembaruan agregat semesteran. Ancaman bias usulan, manipulasi indikator dan penolakan perubahan ditangani melalui pemeriksaan silang sumber, koreksi dan transisi.
UU PDP Pasal 20 ayat (2) huruf e memuat dasar kepentingan umum atau pelaksanaan kewenangan, sesuai mandat pengendali [15]. Jika produksi memproses data pribadi anak, kewajiban Pasal 25, termasuk persetujuan orang tua/wali sesuai peraturan, tetap harus ditangani. Sel agregat kecil perlu diperiksa untuk mencegah identifikasi ulang.
Pejabat berwenang memutuskan. Produksi memerlukan kontrol akses, log perubahan dan alasan, verifikasi banding serta peninjauan manusia. Target manfaat ≥95% optimum tahun ketiga hanya berlaku terhadap model; dampak riil harus diukur dari retensi teramati dan distribusi manfaat antarkelompok.
[PAGE]
# BAB IV
# PENUTUP
## 4.1 Kesimpulan
Dalam simulasi 514 kabupaten/kota, GLM tanpa riwayat mencapai MAE 0,670 poin persentase dan Spearman 0,769 pada pemisahan provinsi. Kesalahan wilayah ekstrem dan belum adanya validasi temporal membatasi generalisasi.
Dalam simulasi, median keunggulan KKT 7,34% terhadap merata, proporsional 7,54%, dan manfaat KKT/oracle 97,82%. Proporsional tetap kompetitif. Kontribusi KKT adalah aturan optimal untuk tujuan yang dinyatakan, batas perlindungan, harga bayangan dan transisi konsisten.
Prototype offline menghitung kuota, memisahkan seed 0 dari Monte Carlo, dan mengekspor asumsi serta versi. Transisi memenuhi batas penurunan 10% per tahun pada pagu tetap dalam pengujian. Keputusan memerlukan peninjauan manusia.
## 4.2 Keterbatasan dan saran
Outcome simulasi belum mendukung klaim dampak kebijakan. Vᵢ adalah proksi; κ=1,74 masih asumsi selama satuan efek studi belum diperiksa pada teks penuh. Rentang antar-lipatan hanya mengukur stabilitas. Kuota kontinu belum menjadi bilangan penerima final.
Kami menyarankan pilot agregat dengan audit sumber, validasi temporal, pemeriksaan bias ekstrem, dan pengukuran respons bantuan. Pembulatan kuota serta konflik pagu antar-tahun diuji bersama dinas. Keberhasilan perlu dinilai dari perbaikan keputusan dan keberlanjutan sekolah yang teramati.


DAFTAR PUSTAKA
[1] Puslapdik, “Klarifikasi Puslapdik: Nominal Dana PIP Jenjang SMA dan SMK Sebesar Rp1.800.000,” 7 Juli 2025. https://puslapdik.kemendikdasmen.go.id/klarifikasi-puslapdik-nominal-dana-pip-jenjang-sma-dan-smk-sebesar-rp1-800-000/
[2] Badan Pemeriksa Keuangan, Ikhtisar Hasil Pemeriksaan Semester II Tahun 2020, Gambar 1.9, hlm. 140, 2021. https://foresight.bpk.go.id/wp-content/uploads/2021/09/IHPS-II-2020.pdf
[3] Kementerian PPN/Bappenas, “Pemerintah Luncurkan Perpres Pencegahan dan Penanganan Anak Tidak Sekolah, Perkuat Hak Pendidikan Anak Indonesia,” 3 Juni 2026. https://www.bappenas.go.id/id/berita/pemerintah-luncurkan-perpres-pencegahan-dan-penanganan-anak-tidak-sekolah-perkuat-hak-pendidikan-anak-indonesia-ijzHs
[4] A. N. Elmachtoub dan P. Grigas, “Smart ‘Predict, then Optimize’,” Management Science, vol. 68, no. 1, hlm. 9–26, 2022. https://arxiv.org/abs/1710.08005
[5] L. E. Papke dan J. M. Wooldridge, “Econometric methods for fractional response variables with an application to 401(k) plan participation rates,” J. Appl. Econometrics, vol. 11, hlm. 619–632, 1996. https://www.nber.org/papers/t0147
[6] S. Boyd dan L. Vandenberghe, Convex Optimization. Cambridge University Press, 2004, bab 5. https://web.stanford.edu/~boyd/cvxbook/
[7] F. P. Kelly, A. K. Maulloo, dan D. K. H. Tan, “Rate control in communication networks: shadow prices, proportional fairness and stability,” J. Oper. Res. Soc., vol. 49, hlm. 237–252, 1998. https://www.statslab.cam.ac.uk/~frank/rate.html
[8] H. A. Listiyanto dan R. M. Qibthiyyah, “The Impact of School Voucher Program on School Dropouts in Indonesia,” JPBM, vol. 8, no. 2, hlm. 113–127, 2022, doi: 10.17977/um003v8i22022p113. https://journal2.um.ac.id/index.php/jpbm/article/view/29249
[9] BPS, “Persentase Penduduk Miskin (P0) Menurut Kabupaten/Kota,” data 2025, salinan lokal diarsipkan 30 Oktober 2026. https://www.bps.go.id/id/statistics-table/2/NjIxIzI=/persentase-penduduk-miskin--p0--menurut-kabupaten-kota--persen-.html
[10] BPS, “Jumlah Penduduk menurut Kabupaten/Kota dan Kelompok Umur,” data 2026, salinan lokal diarsipkan 30 Oktober 2026. https://www.bps.go.id/id/statistics-table/2/Mjc5MCMy/-jumlah-penduduk-menurut-kabupaten-kota-dan-kelompok-umur.html
[11] BPS, Statistik Pendidikan 2025, nomor publikasi 04200.25022, 21 November 2025, revisi 8 Mei 2026. https://www.bps.go.id/id/publication/2025/11/21/d048070f37740b0e04d99350/statistics-of-education-2025.html
[12] G. Ke dkk., “LightGBM: A Highly Efficient Gradient Boosting Decision Tree,” Advances in Neural Information Processing Systems 30, 2017. https://papers.nips.cc/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html
[13] R. A. Sparrow, “Protecting education for the poor in times of crises: An evaluation of a scholarship programme in Indonesia,” Oxford Bull. Econ. Stat., vol. 69, hlm. 99–122, 2007, doi: 10.1111/j.1468-0084.2006.00438.x. https://research.vu.nl/en/publications/protecting-education-for-the-poor-in-times-of-crises-an-evaluatio/
[14] L. Cameron, “Can a public scholarship program successfully reduce school drop-outs in a time of economic crisis? Evidence from Indonesia,” Econ. Educ. Rev., vol. 28, no. 3, hlm. 308–317, 2009. https://research.monash.edu/en/publications/can-a-public-scholarship-program-successfully-reduce-school-drop-/
[15] Republik Indonesia, Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, khususnya Pasal 20 dan 25. https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/