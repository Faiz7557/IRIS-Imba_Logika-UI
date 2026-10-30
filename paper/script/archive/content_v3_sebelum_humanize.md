# BAB I|PENDAHULUAN
## 1.1 Latar Belakang
Pada usia sekolah dasar, hampir semua anak Indonesia duduk di bangku sekolah. Angka Partisipasi Sekolah (APS) kelompok umur 7–12 tahun pada 2025 mencapai {{aps_712}}%. Gambaran itu berubah tajam pada usia SMA. APS kelompok umur 16–18 tahun hanya {{aps_nat}}%, sehingga kira-kira satu dari lima remaja usia SMA tidak lagi bersekolah [[bpsaps]]. Penurunan ini juga tidak merata. Di Papua Tengah, APS usia 16–18 tahun hanya {{aps_pt}}%, sedangkan di DI Yogyakarta mencapai {{aps_diy}}% (Gambar 1b).

[FIG fig01_urgensi|Partisipasi sekolah menurun pada usia SMA dan timpang antarwilayah serta antarkelompok pengeluaran: (a) APS nasional 2025, (b) APS umur 16–18 tahun per provinsi 2025 [[bpsaps]], (c) angka anak tidak sekolah usia SMA menurut kuintil pengeluaran 2023 [[bpsats]]]

Kemiskinan menjadi garis pemisah yang paling jelas. Berdasarkan Gambar 1c, angka anak tidak sekolah usia SMA pada kuintil pengeluaran terbawah mencapai {{ats_q1}}%, atau {{ats_ratio}} kali lipat dibandingkan kuintil teratas sebesar {{ats_q5}}% [[bpsats]]. Negara sebenarnya sudah memiliki instrumen untuk menahan anak miskin agar tetap bersekolah, yaitu Program Indonesia Pintar (PIP). Pada 2025, PIP menjangkau sekitar 19 juta peserta didik dari keluarga miskin dan rentan miskin [[puslapdik]], dengan bantuan bagi siswa SMA/SMK sebesar Rp1,8 juta per tahun [[pip]]. Pemerintah juga menempatkan pencegahan anak tidak sekolah sebagai agenda lintas sektor melalui Perpres 3/2026 [[perpres]].

Persoalannya terletak pada cara bantuan itu dibagi. BPK mencatat sedikitnya 5.364.986 siswa dengan nilai Rp2,86 triliun menerima penyaluran PIP yang tidak tepat sasaran pada periode TA 2018 hingga Semester I 2020 [[bpk]]. Hingga 31 Desember 2025, masih ada 2.510.032 penerima PIP 2025 yang belum mengaktifkan rekeningnya [[aktivasi]]. Kedua catatan itu menunjukkan bahwa kuota yang tersedia belum tentu sampai kepada anak yang paling membutuhkan. Di balik itu ada pertanyaan matematis yang jarang dibahas: jika anggaran tetap, berapa kuota yang sebaiknya diberikan kepada setiap kabupaten/kota? Tambahan kuota pertama di wilayah yang tertinggal dapat menahan banyak siswa, tetapi tambahan berikutnya di wilayah yang sudah terlayani memberi manfaat yang makin kecil. Gejala imbal hasil menurun inilah yang belum menjadi dasar pembagian kuota.

Esai ini mengajukan EduShield, sistem pendukung keputusan yang memprediksi risiko putus sekolah di 514 kabupaten/kota, lalu membagi kuota PIP dengan optimasi yang memperhitungkan imbal hasil menurun. Kami menunjukkan bahwa nilai utama matematika di sini bukan terletak pada algoritma yang rumit, melainkan pada pilihan aturan pembagian yang tepat dan pengujian yang jujur terhadap kelemahannya.

## 1.2 Rumusan Masalah
Berdasarkan latar belakang tersebut, rumusan masalah esai ini adalah sebagai berikut. Pertama, seberapa baik risiko putus sekolah tingkat kabupaten/kota dapat diprediksi ketika model diuji pada provinsi yang tidak dipakai saat pelatihan? Kedua, aturan pembagian kuota seperti apa yang paling banyak menahan siswa tetap bersekolah pada pagu yang sama, dan seberapa tahan aturan itu terhadap asumsi yang keliru? Ketiga, bagaimana hasil tersebut diwujudkan menjadi alat yang dapat dipakai pemerintah secara bertahap dan bertanggung jawab?

## 1.3 Tujuan
Tujuan esai ini adalah merancang alur prediksi hingga alokasi yang cerdas karena berbasis risiko, adaptif karena dapat dihitung ulang setiap kali data dan pagu berubah, serta berkelanjutan karena melindungi daerah dari pemotongan kuota yang mendadak. Seluruh outcome, kuota, dan manfaat dalam evaluasi adalah hasil simulasi, sehingga esai ini mendemonstrasikan metode dan belum mengukur dampak di lapangan.

# BAB II|LANDASAN TEORI
## 2.1 Bantuan Tunai dan Keputusan Bersekolah
Bukti dari Indonesia menunjukkan bahwa bantuan tunai pendidikan dapat menahan anak dari keluarga miskin tetap bersekolah, terutama pada masa sulit ekonomi [[sparrow]], [[cameron]]. Listiyanto dan Qibthiyyah melaporkan bahwa PIP berkaitan dengan penurunan peluang putus sekolah jenjang SMA sekitar 2,8 persen [[study]]. Kami memakai temuan ini untuk menetapkan kecepatan manfaat dalam simulasi, tetapi tetap memperlakukannya sebagai asumsi skenario karena tabel lengkap studi tersebut belum dapat kami periksa. Perlu dicatat pula bahwa BPS membedakan angka putus sekolah, anak tidak sekolah, dan partisipasi sekolah karena penyebutnya berbeda [[bpsedu]].

## 2.2 Dari Prediksi ke Keputusan
Model prediksi biasanya dinilai dari ketepatan angkanya. Elmachtoub dan Grigas menunjukkan bahwa ketika prediksi dipakai untuk mengambil keputusan, ukuran yang lebih penting adalah kerugian keputusan, yaitu seberapa buruk keputusan akibat kesalahan prediksi [[spo]]. Pendekatan *predict-then-optimize* ini menjadi kerangka EduShield. Laju putus sekolah suatu wilayah merupakan proporsi, sehingga pemodelannya mengikuti kerangka respons fraksional [[papke]] melalui regresi binomial (GLM). Sebagai pembanding, kami menggunakan LightGBM, yaitu kumpulan pohon keputusan yang saling memperbaiki [[lgb]].

## 2.3 Imbal Hasil Menurun dan Prinsip Mengisi Bejana
Imbal hasil menurun berarti kuota pertama di suatu wilayah menjangkau siswa yang paling rentan, sedangkan kuota berikutnya menjangkau siswa yang lebih aman. Jika manfaat dimodelkan sebagai kurva yang naik lalu melandai, persoalan pembagian kuota menjadi optimasi cekung. Jenis persoalan ini memiliki satu jawaban terbaik yang dapat dicirikan dengan syarat Karush-Kuhn-Tucker (KKT) [[boyd]]. Rumus lengkapnya kami sajikan pada Lampiran 1.

[FIG fig02_bejana|Prinsip pembagian kuota KKT: (a) analogi bejana dengan batas atas dan lantai perlindungan, (b) manfaat marjinal empat wilayah yang dipotong oleh harga bayangan nasional]

Berdasarkan Gambar 2a, jawaban KKT dapat dibayangkan sebagai mengisi air ke deretan bejana. Wilayah berisiko tinggi adalah bejana yang lebih dalam. Air dituangkan hingga permukaannya sama tinggi, yaitu ketika satu tambahan kuota memberi manfaat yang sama di semua wilayah yang sedang diisi. Tinggi permukaan ini disebut harga bayangan, yaitu jumlah siswa tambahan yang tertahan jika anggaran naik sedikit. Wilayah yang sangat dangkal tetap mendapat lantai perlindungan 20%, sedangkan wilayah yang sangat dalam dibatasi 95% dari kebutuhannya. Gambar 2b menunjukkan hal yang sama pada data. Garut dan Brebes berada di titik ketika kurvanya memotong harga bayangan, Supiori tertahan di batas atas, dan Kota Surabaya berada di lantai.

Aturan yang lebih sederhana ternyata termasuk dalam keluarga yang sama. Jika manfaat diukur dengan fungsi logaritma, syarat KKT menghasilkan kuota yang sebanding dengan banyaknya siswa berisiko di setiap wilayah. Aturan ini dikenal sebagai *proportional fairness* [[kelly]]. Dengan demikian, aturan proporsional risiko adalah kasus khusus KKT, bukan pesaing dari luar.

# BAB III|PEMBAHASAN
## 3.1 Rancangan dan Data EduShield
EduShield terdiri atas lima tahap yang ditunjukkan pada Gambar 3. Tahap pertama memakai data agregat nyata, yaitu persentase penduduk miskin 2025 [[sma]] dan jumlah penduduk umur 15–19 tahun 2026 [[spp]] untuk {{n_kab}} kabupaten/kota di 38 provinsi. Dari data itu kami membentuk proksi jumlah siswa rentan setiap wilayah dengan total {{V_total}} siswa. Pagu simulasi sebesar Rp{{B_miliar}} miliar cukup untuk menjangkau 55% proksi tersebut.

[FIG fig03_alur|Alur kerja EduShield dari data agregat hingga keputusan, beserta siklus kalibrasi semesteran]

Data laju putus sekolah per kabupaten/kota belum tersedia secara terbuka. Karena itu, laju benar dibangkitkan melalui simulasi yang bergantung pada kemiskinan, keterpencilan, efek provinsi, dan galat wilayah, dengan rata-rata tertimbang 2,5%. Simulasi ini memberi keuntungan penting: karena laju benar diketahui, setiap aturan pembagian dapat dinilai secara adil. Seluruh percobaan diulang 30 kali dengan data simulasi baru agar hasilnya tidak bergantung pada satu kebetulan.

## 3.2 Melihat Risiko Lebih Awal
Prediksi diuji dengan cara yang keras. Provinsi dibagi ke dalam lima kelompok, model dilatih pada empat kelompok, lalu diuji pada provinsi yang disembunyikan. Pembagian ini diulang sepuluh kali dan hasilnya disajikan pada Tabel 1.

[TABLE prediksi|Kinerja prediksi pada provinsi yang disembunyikan]

Berdasarkan Tabel 1, diketahui bahwa GLM tanpa data riwayat mencapai galat rata-rata (MAE) {{mae}} poin persentase dan korelasi peringkat Spearman {{spearman}}. Model ini mengenali wilayah Zona Merah, yaitu wilayah dengan laju di atas rata-rata, dengan AUC {{auc}}. Kemampuan itu jauh lebih baik daripada mengurutkan wilayah berdasarkan kemiskinan saja (AUC {{auc_pov}}). Jika data riwayat putus sekolah tersedia, MAE turun menjadi {{mae_hist}} poin persentase. LightGBM tidak mengungguli GLM, sehingga model yang lebih sederhana dan lebih mudah dijelaskan kami pilih.

[FIG fig04_prediksi|Prediksi lintas provinsi dibandingkan laju benar simulasi pada {{n_kab}} kabupaten/kota]

Gambar 4 juga memperlihatkan kelemahan model. Prediksi cenderung meremehkan wilayah dengan risiko ekstrem. Supiori memiliki laju benar {{sup_true}}%, tetapi prediksinya hanya {{sup_hat}}%. Temuan ini menjadi alasan mengapa sistem perlu memeriksa wilayah ekstrem secara khusus dan mengapa kemampuan prediksi tidak boleh dijadikan satu-satunya dasar keputusan.

## 3.3 Membagi Kuota: Kecekungan Lebih Penting daripada Kerumitan
Kami membandingkan lima aturan pada pagu yang sama. Pembagian merata menjadi titik awal. Aturan kemiskinan dan *greedy* mengisi wilayah sesuai urutan prioritas hingga batas atas. Aturan proporsional dan KKT memperhitungkan imbal hasil menurun. Ukuran utama yang kami pakai adalah porsi celah antara pembagian merata dan *oracle* yang berhasil ditutup. *Oracle* adalah pembagian terbaik jika laju benar diketahui.

[TABLE alokasi|Perbandingan aturan pembagian kuota pada pagu yang sama]

[FIG fig05_skema|Hasil pembagian kuota: (a) median celah merata hingga *oracle* yang tertutup dalam 30 simulasi, dengan garis P5–P95, (b) cakupan Zona Merah dan keunggulan setiap aturan pada simulasi pertama]

Berdasarkan Tabel 2 dan Gambar 5a, aturan yang memperhitungkan imbal hasil menurun menutup sekitar tiga perempat celah, yaitu {{gap_kkt}}% untuk KKT dan {{gap_prop}}% untuk proporsional. Sebaliknya, aturan berbasis urutan hanya menutup {{gap_pov}}% dan {{gap_greedy}}%. Gambar 5b menjelaskan alasannya. Aturan *greedy* menjangkau Zona Merah paling luas ({{greedy_cover}}%), tetapi hanya menahan {{greedy_gain0}}% siswa lebih banyak daripada pembagian merata. KKT menjangkau lebih sedikit Zona Merah ({{kkt_cover}}%) namun menahan {{kkt_gain0}}% lebih banyak. Menumpuk kuota di wilayah paling berisiko melewati titik ketika manfaat tambahannya sudah kecil, sehingga yang terlihat tepat sasaran belum tentu paling bermanfaat.

Kami juga mengoreksi cara membaca hasil. Rasio manfaat KKT terhadap *oracle* memang mencapai 97,82%, tetapi pembagian merata saja sudah mencapai {{merata_oracle}}%. Angka setinggi itu memberi kesan yang terlalu baik, sehingga ukuran celah tertutup lebih jujur untuk menilai sebuah aturan.

Temuan terpenting adalah hubungan KKT dan proporsional. Dalam 30 simulasi, median keunggulan KKT atas pembagian merata adalah {{gain_mc}}% (P5–P95: {{gain_p5}}–{{gain_p95}}%), sedangkan proporsional {{prop_mc}}%. KKT hanya unggul pada {{kkt_wins}} dari 30 simulasi. Untuk mencari penyebabnya, kami mengulang perbandingan dengan laju benar. Hasilnya berbalik tipis: KKT {{true_kkt}}% dan proporsional {{true_prop}}%. Artinya, selisih kecil itu bersumber dari galat prediksi, bukan dari aturannya. Aturan yang optimal ketika laju diketahui tidak otomatis menjadi yang terbaik ketika laju hanya diperkirakan, persis seperti yang diperingatkan teori *predict-then-optimize* [[spo]]. Dalam seluruh uji pada esai ini, selisih median kedua aturan tidak pernah melebihi 0,3 poin persentase.

Berdasarkan hasil tersebut, kami merekomendasikan aturan proporsional risiko sebagai pembagian utama karena sederhana, mudah dijelaskan kepada daerah, dan sedikit lebih tahan terhadap salah prediksi. Mesin KKT tetap diperlukan untuk hal yang tidak dapat dilakukan aturan proporsional sederhana, yaitu menghitung harga bayangan, memeriksa kelayakan lantai dan batas atas, serta menyusun transisi. Pada pagu dasar, harga bayangan model adalah {{lambda}} siswa tertahan per tambahan Rp1 miliar. Angka ini merupakan turunan model yang bergantung pada asumsi kecepatan manfaat, bukan estimasi pengembalian anggaran riil.

## 3.4 Ketahanan dan Transisi yang Berkelanjutan
Kesimpulan yang baik harus tetap berlaku ketika asumsi keliru. Gambar 6 merangkum tiga jenis uji. Jenis pertama mengganti bentuk kurva manfaat yang sebenarnya. Jenis kedua membuat kebutuhan siswa rentan salah ukur. Jenis ketiga membandingkan transisi dengan perlindungan yang sama.

[FIG fig06_ketahanan|Median keunggulan KKT dan proporsional atas pembagian merata ketika kurva manfaat, ukuran kebutuhan, atau transisi diubah]

Berdasarkan Gambar 6, median kedua aturan tetap di atas pembagian merata pada semua uji, dan jarak keduanya tetap sempit. Ketika optimasi memakai tiga nilai kecepatan manfaat dan dinilai pada enam bentuk kurva, 17 dari 18 median keunggulan tetap positif. Uji yang paling berat adalah salah ukur kebutuhan. Jika kebutuhan di wilayah terpencil ternyata 25% lebih rendah daripada proksi, keunggulan KKT turun dari {{gain_mc}}% menjadi {{V_low_kkt}}% (proporsional {{V_low_prop}}%). Akurasi data kebutuhan siswa rentan ternyata lebih menentukan daripada pilihan aturan. Keunggulan KKT juga bergantung pada besar pagu, yaitu {{pagu30}}% pada pagu 30% dan {{pagu80}}% pada pagu 80%, karena anggaran yang sempit membuat cara membagi menjadi jauh lebih penting.

[FIG fig07_transisi|Lintasan cakupan kuota dua wilayah dengan transisi bertahap dan tanpa transisi]

Perubahan kuota juga perlu dilakukan secara bertahap. Tanpa perlindungan, cakupan Kota Surabaya akan langsung turun dari 55% ke 20% pada tahun pertama (Gambar 7). EduShield membatasi penurunan kuota setiap daerah paling banyak 10% per tahun, sehingga cakupannya turun perlahan hingga {{sby_y5}}% pada tahun kelima. Harga perlindungan itu kecil. Keunggulan tahun pertama menjadi {{hh1}}%, hanya {{hhgap}} poin persentase di bawah pembagian langsung. Batas penurunan ini terjamin pada pagu tetap. Jika pagu dipotong antartahun, lantai perlindungan dapat menjadi tidak layak dan harus dirundingkan oleh pejabat berwenang, bukan disembunyikan oleh perhitungan.

## 3.5 EduShield sebagai Ruang Keputusan
Hasil analisis diwujudkan dalam prototype aplikasi web yang berjalan tanpa server dan mencakup {{n_kab}} wilayah dalam 18 layar. Gambar 8 menampilkan empat layar utama. Radar risiko memetakan seluruh wilayah dan menandai Zona Merah. Simulator kuota menghitung ulang pembagian ketika pagu, lantai, atau batas atas diubah. Profil wilayah menjelaskan faktor yang mendorong risiko dan posisi wilayah pada kurva manfaat. Peta jalan transisi menampilkan lintasan kuota lima tahun.

[FIG fig08_aplikasi|Tampilan prototype EduShield: (a) radar risiko, (b) simulator kuota, (c) profil wilayah, (d) peta jalan transisi]

Mesin optimasi di peramban diuji terhadap perhitungan Python pada tiga tingkat pagu. Selisih relatif maksimumnya {{solver_error}} dengan waktu hitung sekitar {{solve_ms}} milidetik, dan kedelapan belas layar berjalan tanpa galat. Setiap ekspor memuat label simulasi, parameter, versi, dan kode *hash* agar dapat diaudit. Kuota yang dihasilkan masih berupa usulan kontinu yang harus dibulatkan dan diverifikasi. Pergantian ruang kerja antara analis pusat dan dinas juga belum merupakan sistem autentikasi.

## 3.6 Rencana Implementasi dan Tata Kelola
EduShield dirancang untuk diterapkan secara bertahap agar setiap klaim diuji sebelum diperluas. Rencana tersebut dirangkum pada Tabel 3.

[TABLE roadmap|Rencana implementasi EduShield]

Pada tahap pilot, kami mengusulkan Nusa Tenggara Timur dan Papua Pegunungan karena keduanya memiliki APS usia 16–18 tahun di bawah rata-rata nasional [[bpsaps]]. Target awal berupa MAE paling besar 0,7 poin persentase pada semester berikutnya belum merupakan capaian. Dari sisi tata kelola, EduShield hanya mengolah data agregat. Pasal 20 UU PDP memuat dasar pemrosesan untuk pelaksanaan kewenangan, sedangkan Pasal 25 mewajibkan perlindungan khusus jika kelak data pribadi anak diproses [[pdp]]. Sel agregat yang terlalu kecil tetap perlu diperiksa agar tidak memungkinkan identifikasi ulang. Keputusan akhir selalu berada pada pejabat berwenang, dan setiap perubahan usulan dicatat bersama alasannya.

# BAB IV|PENUTUP
## 4.1 Kesimpulan
Pertama, dalam simulasi pada {{n_kab}} kabupaten/kota, GLM sederhana mampu mengenali Zona Merah pada provinsi yang belum pernah dilihat dengan AUC {{auc}} dan MAE {{mae}} poin persentase, meskipun masih meremehkan wilayah berisiko ekstrem. Kedua, pilihan aturan pembagian menentukan hasil. Aturan yang memperhitungkan imbal hasil menurun menutup sekitar tiga perempat celah menuju pembagian terbaik, sedangkan aturan berbasis urutan hanya sekitar seperempat. KKT dan proporsional berasal dari keluarga yang sama dan selisih mediannya tidak melebihi 0,3 poin persentase. Karena proporsional sedikit lebih tahan terhadap salah prediksi, aturan itu kami rekomendasikan sebagai pembagian utama, sedangkan KKT menyediakan harga bayangan, batas perlindungan, dan transisi. Ketiga, EduShield telah berwujud prototype yang dapat diaudit, dengan transisi yang membatasi penurunan kuota 10% per tahun dan keputusan akhir tetap berada pada manusia.

## 4.2 Saran
Sebelum digunakan untuk kebijakan, EduShield perlu diuji pada data riil melalui pilot yang memadankan Dapodik, DTSEN, dan BPS serta menguji prediksi pada semester berikutnya. Audit kebutuhan siswa rentan perlu menjadi prioritas karena uji ketahanan menunjukkan bahwa salah ukur kebutuhan paling banyak mengurangi manfaat. Kecepatan manfaat bantuan juga perlu diukur secara lokal melalui desain bertahap atau kuasi-eksperimen sebelum harga bayangan dipakai dalam perencanaan anggaran.
