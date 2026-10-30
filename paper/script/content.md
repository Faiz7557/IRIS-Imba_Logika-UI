# BAB I|PENDAHULUAN
## 1.1 Latar Belakang
Pada usia sekolah dasar, hampir semua anak Indonesia bersekolah. Angka Partisipasi Sekolah (APS) umur 7–12 tahun pada 2025 mencapai {{aps_712}}%, tetapi APS umur 16–18 tahun hanya {{aps_nat}}%. Artinya, lebih dari satu dari lima remaja usia SMA tidak lagi bersekolah [[bpsaps]]. Penurunan ini juga timpang. Di Papua Tengah APS usia 16–18 tahun hanya {{aps_pt}}%, sedangkan di DI Yogyakarta mencapai {{aps_diy}}% (Gambar 1b).

[FIG fig01_urgensi|Partisipasi sekolah usia SMA: (a) APS nasional 2025, (b) APS umur 16–18 tahun per provinsi [[bpsaps]], (c) anak tidak sekolah usia SMA menurut kuintil pengeluaran 2023 [[bpsats]]]

Berdasarkan Gambar 1c, angka anak tidak sekolah usia SMA pada kuintil pengeluaran terbawah mencapai {{ats_q1}}%, atau {{ats_ratio}} kali lipat kuintil teratas ({{ats_q5}}%) [[bpsats]]. Negara sudah memiliki Program Indonesia Pintar (PIP) yang pada 2025 menjangkau sekitar 19 juta peserta didik dari keluarga miskin dan rentan miskin [[puslapdik]], dengan bantuan Rp1,8 juta per tahun bagi siswa SMA/SMK [[pip]]. Perpres 3/2026 juga menjadikan pencegahan anak tidak sekolah agenda lintas sektor [[perpres]].

Persoalannya terletak pada cara bantuan dibagi. BPK mencatat sedikitnya 5.364.986 siswa senilai Rp2,86 triliun menerima PIP yang tidak tepat sasaran pada TA 2018 hingga Semester I 2020 [[bpk]], dan hingga akhir 2025 masih ada 2.510.032 penerima yang belum mengaktifkan rekeningnya [[aktivasi]]. Di balik itu ada pertanyaan matematis yang jarang dibahas: dengan anggaran tetap, berapa kuota yang sebaiknya diterima setiap kabupaten/kota? Kuota pertama di wilayah tertinggal dapat menahan banyak siswa, sedangkan tambahan kuota di wilayah yang sudah terlayani memberi manfaat yang makin kecil. Gejala imbal hasil menurun ini belum menjadi dasar pembagian kuota.

Esai ini mengajukan EduShield, sistem pendukung keputusan yang memprediksi risiko putus sekolah di 514 kabupaten/kota lalu membagi kuota PIP dengan optimasi yang memperhitungkan imbal hasil menurun. Dalam 30 simulasi, yang paling menentukan jumlah siswa yang tertahan ternyata adalah pilihan aturan pembagian dan mutu data kebutuhan, sedangkan kerumitan algoritma hampir tidak berpengaruh.

## 1.2 Rumusan Masalah
Pertama, seberapa baik risiko putus sekolah kabupaten/kota dapat diprediksi pada provinsi yang tidak dipakai saat pelatihan? Kedua, aturan pembagian kuota apa yang paling banyak menahan siswa pada pagu yang sama, dan seberapa tahan aturan itu terhadap asumsi yang keliru? Ketiga, bagaimana hasilnya diwujudkan menjadi alat yang dapat dipakai pemerintah secara bertahap?

## 1.3 Tujuan
Esai ini bertujuan merancang alur prediksi hingga alokasi yang cerdas karena berbasis risiko, adaptif karena dapat dihitung ulang setiap kali data dan pagu berubah, serta berkelanjutan karena melindungi daerah dari pemotongan kuota mendadak. Seluruh *outcome*, kuota, dan manfaat dalam evaluasi adalah hasil simulasi, sehingga esai ini mendemonstrasikan metode dan belum mengukur dampak di lapangan.

# BAB II|LANDASAN TEORI
## 2.1 Bantuan Tunai dan Keputusan Bersekolah
Bukti dari Indonesia menunjukkan bahwa bantuan tunai pendidikan dapat menahan anak dari keluarga miskin tetap bersekolah, terutama pada masa sulit ekonomi [[sparrow]], [[cameron]]. Listiyanto dan Qibthiyyah melaporkan bahwa PIP berkaitan dengan penurunan peluang putus sekolah jenjang SMA sekitar 2,8 persen [[study]]. Temuan ini kami pakai untuk menetapkan kecepatan manfaat dalam simulasi, tetapi tetap sebagai asumsi skenario karena tabel lengkap studi tersebut belum dapat kami periksa. BPS juga membedakan angka putus sekolah, anak tidak sekolah, dan partisipasi sekolah karena penyebutnya berbeda [[bpsedu]].

## 2.2 Dari Prediksi ke Keputusan
Elmachtoub dan Grigas menunjukkan bahwa ketika prediksi dipakai untuk mengambil keputusan, yang lebih penting daripada ketepatan angka adalah kerugian keputusan, yaitu seberapa buruk keputusan akibat salah prediksi [[spo]]. Pendekatan *predict-then-optimize* ini menjadi kerangka EduShield. Laju putus sekolah wilayah berupa proporsi, sehingga pemodelannya mengikuti kerangka respons fraksional [[papke]] melalui regresi binomial (GLM), dengan LightGBM [[lgb]] sebagai pembanding.

## 2.3 Imbal Hasil Menurun dan Prinsip Mengisi Bejana
Imbal hasil menurun berarti kuota pertama menjangkau siswa yang paling rentan, sedangkan kuota berikutnya menjangkau siswa yang lebih aman. Jika manfaat dimodelkan sebagai kurva yang naik lalu melandai, pembagian kuota menjadi optimasi cekung yang memiliki satu jawaban terbaik dan dapat dicirikan dengan syarat Karush-Kuhn-Tucker (KKT) [[boyd]]. Rumus lengkapnya kami sajikan pada Lampiran 1.

[FIG fig02_bejana|Prinsip pembagian kuota KKT: (a) analogi bejana, (b) manfaat marjinal empat wilayah dan harga bayangan nasional]

Berdasarkan Gambar 2a, jawaban KKT dapat dibayangkan sebagai mengisi air ke deretan bejana. Wilayah berisiko tinggi adalah bejana yang lebih dalam. Air dituang hingga permukaannya sama tinggi, yaitu ketika satu tambahan kuota memberi manfaat yang sama di semua wilayah yang sedang diisi. Tinggi permukaan ini disebut harga bayangan, yakni jumlah siswa tambahan yang tertahan jika anggaran naik sedikit. Wilayah yang dangkal tetap mendapat lantai perlindungan 20%, sedangkan wilayah yang sangat dalam dibatasi 95% dari kebutuhannya. Pada Gambar 2b, Garut dan Brebes berada tepat di titik potong harga bayangan, Supiori tertahan di batas atas, dan Kota Surabaya berada di lantai.

Aturan yang lebih sederhana termasuk dalam keluarga yang sama. Jika manfaat diukur dengan fungsi logaritma, syarat KKT menghasilkan kuota yang sebanding dengan banyaknya siswa berisiko di setiap wilayah, yang dikenal sebagai *proportional fairness* [[kelly]]. Aturan proporsional risiko dengan demikian adalah kasus khusus KKT, sehingga keduanya dapat dibandingkan dalam satu kerangka.

# BAB III|PEMBAHASAN
## 3.1 Rancangan dan Data EduShield
EduShield terdiri atas lima tahap (Gambar 3). Tahap pertama memakai data agregat nyata, yaitu persentase penduduk miskin 2025 [[sma]] dan penduduk umur 15–19 tahun 2026 [[spp]] untuk {{n_kab}} kabupaten/kota di 38 provinsi. Dari data itu kami membentuk proksi siswa rentan dengan total {{V_total}} siswa, dan pagu simulasi Rp{{B_miliar}} miliar cukup untuk menjangkau 55% di antaranya. Karena data laju putus sekolah per kabupaten/kota belum terbuka, laju benar dibangkitkan melalui simulasi (rata-rata 2,5%) yang bergantung pada kemiskinan, keterpencilan, efek provinsi, dan galat wilayah, lalu diulang pada 30 data simulasi agar setiap aturan dapat dinilai secara adil.

[FIG fig03_alur|Alur kerja EduShield dari data agregat hingga keputusan, dengan kalibrasi semesteran]

## 3.2 Melihat Risiko Lebih Awal
[TABLE prediksi|Kinerja prediksi pada provinsi yang disembunyikan, sepuluh pengulangan]

Model dilatih pada sebagian provinsi lalu diuji pada provinsi yang disembunyikan. Berdasarkan Tabel 1, GLM tanpa data riwayat mencapai galat rata-rata (MAE) {{mae}} poin persentase dan korelasi peringkat {{spearman}}. Model mengenali Zona Merah, yaitu wilayah dengan laju di atas rata-rata, dengan AUC {{auc}}, jauh lebih baik daripada mengurutkan kemiskinan saja (AUC {{auc_pov}}). Jika data riwayat tersedia, MAE turun menjadi {{mae_hist}}. LightGBM tidak mengungguli GLM, sehingga kami memilih model yang lebih sederhana. Kelemahannya, prediksi meremehkan wilayah ekstrem: Supiori memiliki laju benar {{sup_true}}% tetapi diprediksi {{sup_hat}}% (Lampiran 2), sehingga wilayah seperti ini perlu diperiksa khusus.

## 3.3 Membagi Kuota: Kecekungan Lebih Penting daripada Kerumitan
Lima aturan dibandingkan pada pagu yang sama. Aturan kemiskinan dan *greedy* mengisi wilayah menurut urutan prioritas, sedangkan proporsional dan KKT memperhitungkan imbal hasil menurun. Ukurannya adalah porsi celah antara pembagian merata dan *oracle* (pembagian terbaik jika laju benar diketahui) yang berhasil ditutup.

[FIG fig05_skema|Hasil pembagian kuota: (a) median celah merata hingga *oracle* yang tertutup dalam 30 simulasi, (b) cakupan Zona Merah dan keunggulan setiap aturan pada simulasi pertama]

Berdasarkan Gambar 4a, aturan yang memperhitungkan imbal hasil menurun menutup sekitar tiga perempat celah, yaitu {{gap_kkt}}% untuk KKT dan {{gap_prop}}% untuk proporsional, sedangkan aturan berbasis urutan hanya {{gap_pov}}% dan {{gap_greedy}}%. Gambar 4b menjelaskan alasannya. Aturan *greedy* menjangkau Zona Merah paling luas ({{greedy_cover}}%), tetapi hanya menahan {{greedy_gain0}}% siswa lebih banyak daripada pembagian merata. KKT menjangkau lebih sedikit Zona Merah ({{kkt_cover}}%) namun menahan {{kkt_gain0}}% lebih banyak. *Greedy* terus menumpuk kuota di wilayah paling berisiko meskipun manfaat tambahannya sudah kecil, padahal kuota yang sama akan menahan lebih banyak siswa di wilayah berisiko menengah. Rasio manfaat terhadap *oracle* tidak kami pakai karena pembagian merata saja sudah mencapai {{merata_oracle}}%.

Dalam 30 simulasi, median keunggulan KKT atas pembagian merata adalah {{gain_mc}}% (P5–P95: {{gain_p5}}–{{gain_p95}}%), sedangkan proporsional {{prop_mc}}%, dan KKT hanya unggul pada {{kkt_wins}} simulasi. Ketika perbandingan diulang dengan laju benar, hasilnya berbalik tipis: KKT {{true_kkt}}% dan proporsional {{true_prop}}%. Selisih kecil itu bersumber dari galat prediksi. Aturan yang optimal ketika laju diketahui tidak otomatis menjadi yang terbaik ketika laju hanya diperkirakan, persis seperti yang diperingatkan teori *predict-then-optimize* [[spo]]. Dalam seluruh uji, selisih median kedua aturan tidak pernah melebihi 0,3 poin persentase.

Karena itu, kami merekomendasikan aturan proporsional risiko sebagai pembagian utama karena sederhana, mudah dijelaskan kepada daerah, dan sedikit lebih tahan terhadap salah prediksi. Mesin KKT tetap diperlukan untuk menghitung harga bayangan, memeriksa kelayakan lantai dan batas atas, serta menyusun transisi. Pada pagu dasar, harga bayangan model adalah {{lambda}} siswa tertahan per tambahan Rp1 miliar. Angka ini bergantung pada asumsi kecepatan manfaat dan bukan estimasi pengembalian anggaran riil.

## 3.4 Ketahanan dan Transisi yang Berkelanjutan
Setiap asumsi diuji dengan mengganti bentuk kurva manfaat dan membuat kebutuhan salah ukur (Gambar 5).

[FIG fig06_ketahanan|Median keunggulan KKT dan proporsional atas merata ketika kurva manfaat atau ukuran kebutuhan diubah]

Berdasarkan Gambar 5, median kedua aturan tetap di atas pembagian merata pada semua uji dan jaraknya tetap sempit. Dari 18 kombinasi kecepatan manfaat dan bentuk kurva, 17 median keunggulan tetap positif (Lampiran 6). Uji terberat adalah salah ukur kebutuhan. Jika kebutuhan di wilayah terpencil ternyata 25% lebih rendah daripada proksi, keunggulan KKT turun dari {{gain_mc}}% menjadi {{V_low_kkt}}% (proporsional {{V_low_prop}}%). Akurasi data kebutuhan ternyata lebih menentukan daripada pilihan aturan. Keunggulan juga bergantung pada pagu, yaitu {{pagu30}}% pada pagu 30% dan {{pagu80}}% pada pagu 80%, karena anggaran yang sempit membuat cara membagi jauh lebih penting.

Tanpa perlindungan, cakupan Kota Surabaya akan langsung turun dari 55% ke 20% pada tahun pertama (Lampiran 6). EduShield membatasi penurunan kuota setiap daerah paling banyak 10% per tahun, sehingga cakupannya turun perlahan hingga {{sby_y5}}% pada tahun kelima. Harga perlindungan ini kecil: keunggulan tahun pertama menjadi {{hh1}}%, hanya {{hhgap}} poin persentase di bawah pembagian langsung, dan dengan perlindungan yang sama aturan proporsional tetap setara (Lampiran 6). Batas ini terjamin pada pagu tetap; jika pagu dipotong antartahun, lantai yang tidak lagi layak harus dirundingkan terbuka oleh pejabat berwenang.

## 3.5 EduShield sebagai Ruang Keputusan
Hasil analisis diwujudkan dalam prototipe aplikasi web yang berjalan tanpa server dan mencakup {{n_kab}} wilayah dalam 18 layar (Gambar 6). Radar memetakan risiko seluruh wilayah, simulator menghitung ulang kuota saat pagu atau batas diubah, profil menjelaskan faktor risiko, dan layar transisi menampilkan lintasan kuota lima tahun.

Mesin optimasi di peramban cocok dengan perhitungan Python pada tiga tingkat pagu (selisih relatif maksimum {{solver_error}}, waktu hitung sekitar {{solve_ms}} milidetik), dan setiap ekspor memuat label simulasi, parameter, versi, serta kode *hash* untuk audit. Kuota masih berupa usulan kontinu yang harus dibulatkan, dan pergantian ruang kerja belum merupakan autentikasi.

[FIG fig08_aplikasi|Tampilan prototipe EduShield: (a) radar risiko, (b) simulator kuota, (c) profil wilayah, (d) transisi kuota]

## 3.6 Rencana Implementasi dan Tata Kelola
EduShield diterapkan bertahap agar setiap klaim diuji sebelum diperluas (Tabel 2). Wilayah pilot yang kami usulkan adalah Nusa Tenggara Timur dan Papua Pegunungan, yang APS usia 16–18 tahunnya di bawah rata-rata nasional [[bpsaps]].

EduShield hanya mengolah data agregat. Pasal 20 UU PDP memuat dasar pemrosesan untuk pelaksanaan kewenangan, Pasal 25 mewajibkan perlindungan khusus jika kelak data pribadi anak diproses [[pdp]], dan sel agregat yang terlalu kecil tetap diperiksa agar tidak memungkinkan identifikasi ulang. Keputusan akhir berada pada pejabat berwenang, dan setiap perubahan usulan dicatat bersama alasannya.

[TABLE roadmap|Rencana implementasi EduShield]

# BAB IV|PENUTUP
## 4.1 Kesimpulan
Pertama, dalam simulasi pada {{n_kab}} kabupaten/kota, GLM sederhana mengenali Zona Merah pada provinsi yang belum pernah dilihat dengan AUC {{auc}} dan MAE {{mae}} poin persentase, meskipun masih meremehkan wilayah berisiko ekstrem. Kedua, pilihan aturan pembagian menentukan hasil. Aturan yang memperhitungkan imbal hasil menurun menutup sekitar tiga perempat celah menuju pembagian terbaik, sedangkan aturan berbasis urutan hanya sekitar seperempat. KKT dan proporsional berasal dari keluarga yang sama dan selisih mediannya tidak melebihi 0,3 poin persentase. Proporsional kami rekomendasikan sebagai pembagian utama karena sedikit lebih tahan terhadap salah prediksi, sedangkan KKT menyediakan harga bayangan, batas perlindungan, dan transisi. Ketiga, EduShield telah berwujud prototipe yang dapat diaudit, dengan transisi yang membatasi penurunan kuota 10% per tahun dan keputusan akhir tetap berada pada manusia.

## 4.2 Saran
EduShield perlu diuji pada data riil melalui pilot yang memadankan Dapodik, DTSEN, dan BPS serta menguji prediksi pada semester berikutnya. Audit kebutuhan siswa rentan perlu didahulukan karena salah ukur kebutuhan paling banyak mengurangi manfaat. Kecepatan manfaat bantuan juga perlu diukur secara lokal melalui desain bertahap atau kuasi-eksperimen sebelum harga bayangan dipakai dalam perencanaan anggaran.
