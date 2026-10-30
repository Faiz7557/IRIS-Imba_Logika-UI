# BAB I
# PENDAHULUAN
## 1.1 Latar belakang
PIP menyediakan bantuan SMA/SMK Rp1,8 juta per siswa per tahun, dengan nominal setengah tahun bagi kelas awal/akhir [[pip]]. Kuota terbatas memerlukan keputusan tentang daerah penerima dan besar dukungannya. IHPS II 2020 BPK mencatat sedikitnya 5.364.986 siswa senilai Rp2,86 triliun menerima penyaluran tidak tepat sasaran pada periode TA 2018–Semester I 2020 [[bpk]]. Temuan historis ini menunjukkan kebutuhan validasi; ia tidak mengukur salah sasaran tahun 2026.
Rilis pemerintah mengenai Perpres 3/2026 menempatkan pencegahan dan penanganan anak tidak sekolah sebagai agenda terkoordinasi [[perpres]]. Kami mengusulkan EduShield untuk membantu penyusunan kuota PIP kabupaten/kota: prediksi laju putus sekolah dihubungkan dengan optimasi imbal hasil menurun. Tambahan kuota diasumsikan memberi manfaat lebih kecil setelah cakupan wilayah meningkat.
## 1.2 Rumusan masalah
Seberapa baik laju diprediksi ketika provinsi uji disembunyikan? Bagaimana kuota dibagi pada pagu tetap dan batas perlindungan? Bagaimana usulan dijelaskan dan diterapkan bertahap?
## 1.3 Tujuan
Kami mendemonstrasikan alur prediksi–alokasi yang dapat diaudit. Prediksi yang dijelaskan mendukung sistem cerdas, simulasi pagu mendukung adaptasi, sedangkan transisi dan kalibrasi mendukung keberlanjutan. Seluruh outcome, kuota, dan manfaat evaluasi adalah simulasi; studi ini belum mengukur dampak di lapangan.
[PAGE]
# BAB II
# LANDASAN TEORI
## 2.1 Dari prediksi menuju keputusan
Elmachtoub dan Grigas menekankan kerugian keputusan akibat kesalahan prediksi [[spo]]. EduShield memakai alur predict-then-optimize, tetapi belum melatih model dengan fungsi kerugian SPO+. Prediksi menggunakan GLM binomial berbobot siswa rentan, dengan fungsi logit. Pemodelan respons terbatas berkaitan dengan kerangka Papke dan Wooldridge [[papke]].
## 2.2 Imbal hasil menurun dan KKT
Untuk proksi siswa rentan Vᵢ, laju prediksi ρᵢ, dan kuota xᵢ, manfaat diasumsikan:
[EQ] sᵢ(xᵢ) = Vᵢρᵢ[1 − exp(−κxᵢ/Vᵢ)]                                      (1)
Kami memaksimumkan Σsᵢ dengan Σcᵢxᵢ=B dan αVᵢ≤xᵢ≤βVᵢ. Tujuan cekung dan kendala linear memungkinkan karakterisasi KKT [[boyd]]. Penurunan sendiri dari (1) memberi:
[EQ] xᵢ* = clip{(Vᵢ/κ) ln[κρᵢ/(λ*cᵢ)], αVᵢ, βVᵢ}                           (2)
Pengali λ* dicari dengan bagi-dua. Wilayah interior memiliki manfaat marjinal per rupiah sama. Utilitas log Σwᵢln xᵢ berkaitan dengan proportional fairness [[kelly]] dan memberi xᵢ=wᵢ/(λcᵢ); untuk biaya seragam dan wᵢ=Vᵢρᵢ, kuotanya proporsional risiko.
## 2.3 Asumsi efek bantuan
Abstrak Listiyanto–Qibthiyyah menyebut pengaruh PIP SMA 2,8 persen dengan marginal effect [[study]]. Tabel lengkap dan satuan efek belum berhasil diperiksa. Karena itu κ=1,74 diperlakukan sebagai asumsi skenario, disertai sensitivitas. LM1–LM4 membuka penurunan dan batas penafsirannya.
[PAGE]
# BAB III
# PEMBAHASAN
## 3.1 Data dan desain studi
Salinan lokal tabel BPS kemiskinan 2025 [[sma]] dan penduduk menurut umur 2026 [[spp]] dipadankan pada {{n_kab}} kabupaten/kota, 38 provinsi. Statistik Pendidikan 2025 memberi konteks indikator [[bpsedu]]; anak tidak sekolah, partisipasi sekolah, dan laju putus sekolah memiliki penyebut berbeda.
Proksi Vᵢ=bulat(0,6 × penduduk 15–19 × 0,74 × proporsi miskin), minimum 10. Faktor usia dan partisipasi merupakan asumsi; kemiskinan penduduk belum tentu mewakili siswa. Total proksi {{V_total}} bukan jumlah penerima terdaftar. Pagu simulasi dasar Rp{{B_miliar}} miliar mencakup 55% proksi pada biaya Rp1,8 juta.
[FIG data|Gambar 1. Kovariat kemiskinan nyata pada salinan BPS dan laju putus sekolah simulasi; outcome tidak berasal dari Dapodik]
Laju benar dibangkitkan dari logit dengan ambang kemiskinan, interaksi keterpencilan, efek provinsi dan galat wilayah; rerata tertimbangnya 2,5% dalam simulasi. Outcome teramati binomial. GLM tidak memuat seluruh komponen pembangkit. Seed 0 memakai sepuluh pembagian lima lipatan provinsi; Monte Carlo memakai 30 outcome baru. DGP dan seed dibuka di LM2.
[PAGE]
## 3.2 Melihat risiko lebih awal
Dalam simulasi, GLM tanpa riwayat mencapai MAE {{mae}} poin persentase, Spearman {{spearman}}, dan AUC {{auc}}. Zona Merah berarti laju benar di atas rerata tertimbang, bukan klasifikasi siswa. LightGBM [[lgb]] tidak mengungguli GLM pada MAE dan Spearman dalam eksperimen ini.
[TABLE prediction]
[FIG prediction|Gambar 2. Prediksi di provinsi uji versus laju benar seed 0; risiko ekstrem Supiori diremehkan dalam simulasi]
Supiori memiliki laju benar 38,05% dan prediksi 23,36% dalam simulasi. Rentang antar-lipatan hanya menunjukkan stabilitas model, bukan interval prediksi. Standardisasi memakai seluruh kovariat sehingga pengujian bersifat transduktif, meskipun outcome uji tidak dipakai melatih model. Pilot harus membekukan praproses latih dan menguji semester berikutnya.
[PAGE]
## 3.3 Membagi kuota dengan cerdas
Batas cakupan dasar 20–95% dari Vᵢ. Merata memberi cakupan sama; kemiskinan dan greedy memakai urutan prioritas. Proporsional memakai Vᵢρᵢ, KKT memakai (2), sedangkan oracle mengetahui laju benar simulasi.
[TABLE allocation]
[FIG schemes|Gambar 3. Median keunggulan atas merata dalam 30 simulasi; garis adalah P5–P95, bukan interval kepercayaan efek kebijakan]
Dalam simulasi, median keunggulan KKT {{gain_mc}}% [{{gain_p5}}; {{gain_p95}}], proporsional {{prop_mc}}%, dan manfaat KKT/oracle {{oracle_mc}}%. KKT tidak selalu mengalahkan proporsional pada laju benar. Pada seed 0, cakupan Zona Merah greedy {{greedy_cover}}% melebihi KKT {{kkt_cover}}%, tetapi siswa tertahan lebih sedikit. Harga bayangan model {{lambda}} siswa/Rp1 miliar bergantung pada κ; ia bukan estimasi pengembalian anggaran riil.
[PAGE]
## 3.4 Ketahanan dan transisi
Optimasi tiga κ dievaluasi pada enam kurva benar. Dalam simulasi, 17 dari 18 median keunggulan terhadap merata positif. Ini bukan regret terhadap optimum kurva evaluasi dan tidak menjamin setiap ulangan positif.
[FIG robustness|Gambar 4. Median keunggulan atas merata ketika kurva manfaat evaluasi berbeda dari asumsi optimasi, seluruhnya simulasi]
Pada pagu 30%, median keunggulan KKT {{pagu30}}%; pada pagu 80%, {{pagu80}}%. Biaya terpencil +15% pada pagu tetap memberi {{remote_mc}}%. Simulator interaktif mendefinisikan porsi pagu dari biaya cakupan penuh skenario aktif, sehingga kedua eksperimen berbeda.
[FIG transition|Gambar 5. Transisi lima wilayah seed 0 dengan lantai max(αVᵢ, 0,9xᵢ tahun lalu), pada pagu tetap simulasi]
Median keunggulan transisi pertama {{hh1}}%, sekitar {{hhgap}} poin persentase di bawah KKT langsung. Batas turun 10% per tahun dipenuhi pada pagu tetap. Pemotongan pagu antar-tahun dapat membuat lantai baru tidak layak dan memerlukan keputusan kebijakan.
[PAGE]
## 3.5 EduShield sebagai ruang keputusan
Analis meninjau risiko dan alasan wilayah, mengubah pagu, membandingkan skema serta transisi, lalu mencetak usulan. Dinas melihat alasan kuotanya; banding, realisasi dan kalibrasi masih mockup berlabel.
[TABLE features]
[FIG app|Gambar 6. Simulator kuota 514 wilayah; tinggi bejana menunjukkan cakupan, sedangkan profil menjelaskan manfaat marjinal; seluruh angka simulasi]
Arsitektur menghubungkan data agregat, analitik Python, paket JSON berversi, dan antarmuka offline. Peta petak bersifat non-geografis. Ekspor memuat label simulasi, parameter, versi, dan hash. Kuota kontinu belum dibulatkan; pergantian ruang kerja belum merupakan autentikasi.
Uji tiga pagu memberi selisih relatif maksimum JavaScript–Python {{solver_error}} dan waktu peramban sekitar {{solve_ms}} ms. Seluruh 18 layar diuji tanpa galat JavaScript. Rincian layar dan alasan desain tersedia di lampiran prototype.
[PAGE]
## 3.6 Aktualisasi dan tata kelola
Pilot 0–6 bulan diusulkan pada NTT dan Papua Pegunungan untuk memadankan agregat Dapodik–DTSEN–BPS, mengaudit V dan menguji semester berikutnya. Target awal MAE ≤0,7 poin persentase dan seluruh wilayah pilot cocok belum merupakan capaian. Tahap 6–18 bulan menguji kuota tambahan melalui desain bertahap atau kuasi-eksperimen, dengan pengukuran retensi dan estimasi κ lokal. Tahap 18–36 bulan membangun siklus semesteran, banding, dan audit bias.
Studi Sparrow [[sparrow]] dan Cameron [[cameron]] memberi alasan menguji bantuan finansial, tetapi konteksnya berbeda dan tidak membuktikan kurva respons wilayah yang diasumsikan. Pilot perlu memisahkan hambatan kuota, pencairan, dan akses sekolah.
Kekuatan EduShield adalah tujuan serta alasan keputusan yang eksplisit. Kelemahannya: outcome semi-sintetis, proksi ekologis, dan κ belum tervalidasi. Peluangnya adalah pembaruan agregat semesteran. Ancaman bias usulan, manipulasi indikator dan penolakan perubahan ditangani melalui pemeriksaan silang sumber, koreksi dan transisi.
UU PDP Pasal 20 ayat (2) huruf e memuat dasar kepentingan umum atau pelaksanaan kewenangan, sesuai mandat pengendali [[pdp]]. Jika produksi memproses data pribadi anak, kewajiban Pasal 25, termasuk persetujuan orang tua/wali sesuai peraturan, tetap harus ditangani. Sel agregat kecil perlu diperiksa untuk mencegah identifikasi ulang.
Pejabat berwenang memutuskan. Produksi memerlukan kontrol akses, log perubahan dan alasan, verifikasi banding serta peninjauan manusia. Target manfaat ≥95% optimum tahun ketiga hanya berlaku terhadap model; dampak riil harus diukur dari retensi teramati dan distribusi manfaat antarkelompok.
[PAGE]
# BAB IV
# PENUTUP
## 4.1 Kesimpulan
Dalam simulasi 514 kabupaten/kota, GLM tanpa riwayat mencapai MAE {{mae}} poin persentase dan Spearman {{spearman}} pada pemisahan provinsi. Kesalahan wilayah ekstrem dan belum adanya validasi temporal membatasi generalisasi.
Dalam simulasi, median keunggulan KKT {{gain_mc}}% terhadap merata, proporsional {{prop_mc}}%, dan manfaat KKT/oracle {{oracle_mc}}%. Proporsional tetap kompetitif. Kontribusi KKT adalah aturan optimal untuk tujuan yang dinyatakan, batas perlindungan, harga bayangan dan transisi konsisten.
Prototype offline menghitung kuota, memisahkan seed 0 dari Monte Carlo, dan mengekspor asumsi serta versi. Transisi memenuhi batas penurunan 10% per tahun pada pagu tetap dalam pengujian. Keputusan memerlukan peninjauan manusia.
## 4.2 Keterbatasan dan saran
Outcome simulasi belum mendukung klaim dampak kebijakan. Vᵢ adalah proksi; κ=1,74 masih asumsi selama satuan efek studi belum diperiksa pada teks penuh. Rentang antar-lipatan hanya mengukur stabilitas. Kuota kontinu belum menjadi bilangan penerima final.
Kami menyarankan pilot agregat dengan audit sumber, validasi temporal, pemeriksaan bias ekstrem, dan pengukuran respons bantuan. Pembulatan kuota serta konflik pagu antar-tahun diuji bersama dinas. Keberhasilan perlu dinilai dari perbaikan keputusan dan keberlanjutan sekolah yang teramati.
