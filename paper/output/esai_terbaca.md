# BAB I|PENDAHULUAN
## 1.1 Latar Belakang
Pada usia sekolah dasar, hampir semua anak Indonesia bersekolah. Angka Partisipasi Sekolah (APS) umur 7–12 tahun pada 2025 mencapai 99,23%, tetapi APS umur 16–18 tahun hanya 77,86%. Artinya, lebih dari satu dari lima remaja usia SMA tidak lagi bersekolah [1]. Penurunan ini juga timpang. Di Papua Tengah APS usia 16–18 tahun hanya 44,61%, sedangkan di DI Yogyakarta mencapai 93,03% (Gambar 1b).

[FIG fig01_urgensi|Partisipasi sekolah usia SMA: (a) APS nasional 2025, (b) APS umur 16–18 tahun per provinsi [1], (c) anak tidak sekolah usia SMA menurut kuintil pengeluaran 2023 [2]]

Berdasarkan Gambar 1c, angka anak tidak sekolah usia SMA pada kuintil pengeluaran terbawah mencapai 30,66%, atau 2,1 kali lipat kuintil teratas (14,67%) [2]. Negara sudah memiliki Program Indonesia Pintar (PIP) yang pada 2025 menjangkau sekitar 19 juta peserta didik dari keluarga miskin dan rentan miskin [3], dengan bantuan Rp1,8 juta per tahun bagi siswa SMA/SMK [4]. Perpres 3/2026 juga menjadikan pencegahan anak tidak sekolah agenda lintas sektor [5].

Persoalannya terletak pada cara bantuan dibagi. BPK mencatat sedikitnya 5.364.986 siswa senilai Rp2,86 triliun menerima PIP yang tidak tepat sasaran pada TA 2018 hingga Semester I 2020 [6], dan hingga akhir 2025 masih ada 2.510.032 penerima yang belum mengaktifkan rekeningnya [7]. Di balik itu ada pertanyaan matematis yang jarang dibahas: dengan anggaran tetap, berapa kuota yang sebaiknya diterima setiap kabupaten/kota? Kuota pertama di wilayah tertinggal dapat menahan banyak siswa, sedangkan tambahan kuota di wilayah yang sudah terlayani memberi manfaat yang makin kecil. Gejala imbal hasil menurun ini belum menjadi dasar pembagian kuota.

Esai ini mengajukan EduShield, sistem pendukung keputusan yang memprediksi risiko putus sekolah di 514 kabupaten/kota lalu membagi kuota PIP dengan optimasi yang memperhitungkan imbal hasil menurun. Dalam 30 simulasi, yang paling menentukan jumlah siswa yang tertahan ternyata adalah pilihan aturan pembagian dan mutu data kebutuhan, sedangkan kerumitan algoritma hampir tidak berpengaruh.

## 1.2 Rumusan Masalah
Pertama, seberapa baik risiko putus sekolah kabupaten/kota dapat diprediksi pada provinsi yang tidak dipakai saat pelatihan? Kedua, aturan pembagian kuota apa yang paling banyak menahan siswa pada pagu yang sama, dan seberapa tahan aturan itu terhadap asumsi yang keliru? Ketiga, bagaimana hasilnya diwujudkan menjadi alat yang dapat dipakai pemerintah secara bertahap?

## 1.3 Tujuan
Esai ini bertujuan merancang alur prediksi hingga alokasi yang cerdas karena berbasis risiko, adaptif karena dapat dihitung ulang setiap kali data dan pagu berubah, serta berkelanjutan karena melindungi daerah dari pemotongan kuota mendadak. Seluruh *outcome*, kuota, dan manfaat dalam evaluasi adalah hasil simulasi, sehingga esai ini mendemonstrasikan metode dan belum mengukur dampak di lapangan.

# BAB II|LANDASAN TEORI
## 2.1 Bantuan Tunai dan Keputusan Bersekolah
Bukti dari Indonesia menunjukkan bahwa bantuan tunai pendidikan dapat menahan anak dari keluarga miskin tetap bersekolah, terutama pada masa sulit ekonomi [8], [9]. Listiyanto dan Qibthiyyah melaporkan bahwa PIP berkaitan dengan penurunan peluang putus sekolah jenjang SMA sekitar 2,8 persen [10]. Temuan ini kami pakai untuk menetapkan kecepatan manfaat dalam simulasi, tetapi tetap sebagai asumsi skenario karena tabel lengkap studi tersebut belum dapat kami periksa. BPS juga membedakan angka putus sekolah, anak tidak sekolah, dan partisipasi sekolah karena penyebutnya berbeda [11].

## 2.2 Dari Prediksi ke Keputusan
Elmachtoub dan Grigas menunjukkan bahwa ketika prediksi dipakai untuk mengambil keputusan, yang lebih penting daripada ketepatan angka adalah kerugian keputusan, yaitu seberapa buruk keputusan akibat salah prediksi [12]. Pendekatan *predict-then-optimize* ini menjadi kerangka EduShield. Laju putus sekolah wilayah berupa proporsi, sehingga pemodelannya mengikuti kerangka respons fraksional [13] melalui regresi binomial (GLM), dengan LightGBM [14] sebagai pembanding.

## 2.3 Imbal Hasil Menurun dan Prinsip Mengisi Bejana
Imbal hasil menurun berarti kuota pertama menjangkau siswa yang paling rentan, sedangkan kuota berikutnya menjangkau siswa yang lebih aman. Jika manfaat dimodelkan sebagai kurva yang naik lalu melandai, pembagian kuota menjadi optimasi cekung yang memiliki satu jawaban terbaik dan dapat dicirikan dengan syarat Karush-Kuhn-Tucker (KKT) [15]. Rumus lengkapnya kami sajikan pada Lampiran 1.

[FIG fig02_bejana|Prinsip pembagian kuota KKT: (a) analogi bejana, (b) manfaat marjinal empat wilayah dan harga bayangan nasional]

Berdasarkan Gambar 2a, jawaban KKT dapat dibayangkan sebagai mengisi air ke deretan bejana. Wilayah berisiko tinggi adalah bejana yang lebih dalam. Air dituang hingga permukaannya sama tinggi, yaitu ketika satu tambahan kuota memberi manfaat yang sama di semua wilayah yang sedang diisi. Tinggi permukaan ini disebut harga bayangan, yakni jumlah siswa tambahan yang tertahan jika anggaran naik sedikit. Wilayah yang dangkal tetap mendapat lantai perlindungan 20%, sedangkan wilayah yang sangat dalam dibatasi 95% dari kebutuhannya. Pada Gambar 2b, Garut dan Brebes berada tepat di titik potong harga bayangan, Supiori tertahan di batas atas, dan Kota Surabaya berada di lantai.

Aturan yang lebih sederhana termasuk dalam keluarga yang sama. Jika manfaat diukur dengan fungsi logaritma, syarat KKT menghasilkan kuota yang sebanding dengan banyaknya siswa berisiko di setiap wilayah, yang dikenal sebagai *proportional fairness* [16]. Aturan proporsional risiko dengan demikian adalah kasus khusus KKT, sehingga keduanya dapat dibandingkan dalam satu kerangka.

# BAB III|PEMBAHASAN
## 3.1 Rancangan dan Data EduShield
EduShield terdiri atas lima tahap (Gambar 3). Tahap pertama memakai data agregat nyata, yaitu persentase penduduk miskin 2025 [17] dan penduduk umur 15–19 tahun 2026 [18] untuk 514 kabupaten/kota di 38 provinsi. Dari data itu kami membentuk proksi siswa rentan dengan total 853.330 siswa, dan pagu simulasi Rp844,80 miliar cukup untuk menjangkau 55% di antaranya. Karena data laju putus sekolah per kabupaten/kota belum terbuka, laju benar dibangkitkan melalui simulasi (rata-rata 2,5%) yang bergantung pada kemiskinan, keterpencilan, efek provinsi, dan galat wilayah, lalu diulang pada 30 data simulasi agar setiap aturan dapat dinilai secara adil.

[FIG fig03_alur|Alur kerja EduShield dari data agregat hingga keputusan, dengan kalibrasi semesteran]

## 3.2 Melihat Risiko Lebih Awal
[TABLE prediksi|Kinerja prediksi pada provinsi yang disembunyikan, sepuluh pengulangan]

Model dilatih pada sebagian provinsi lalu diuji pada provinsi yang disembunyikan. Berdasarkan Tabel 1, GLM tanpa data riwayat mencapai galat rata-rata (MAE) 0,670 poin persentase dan korelasi peringkat 0,769. Model mengenali Zona Merah, yaitu wilayah dengan laju di atas rata-rata, dengan AUC 0,907, jauh lebih baik daripada mengurutkan kemiskinan saja (AUC 0,863). Jika data riwayat tersedia, MAE turun menjadi 0,320. LightGBM tidak mengungguli GLM, sehingga kami memilih model yang lebih sederhana. Kelemahannya, prediksi meremehkan wilayah ekstrem: Supiori memiliki laju benar 38,05% tetapi diprediksi 23,36% (Lampiran 2), sehingga wilayah seperti ini perlu diperiksa khusus.

## 3.3 Membagi Kuota: Kecekungan Lebih Penting daripada Kerumitan
Lima aturan dibandingkan pada pagu yang sama. Aturan kemiskinan dan *greedy* mengisi wilayah menurut urutan prioritas, sedangkan proporsional dan KKT memperhitungkan imbal hasil menurun. Ukurannya adalah porsi celah antara pembagian merata dan *oracle* (pembagian terbaik jika laju benar diketahui) yang berhasil ditutup.

[FIG fig05_skema|Hasil pembagian kuota: (a) median celah merata hingga *oracle* yang tertutup dalam 30 simulasi, (b) cakupan Zona Merah dan keunggulan setiap aturan pada simulasi pertama]

Berdasarkan Gambar 4a, aturan yang memperhitungkan imbal hasil menurun menutup sekitar tiga perempat celah, yaitu 75,8% untuk KKT dan 76,8% untuk proporsional, sedangkan aturan berbasis urutan hanya 24,0% dan 23,5%. Gambar 4b menjelaskan alasannya. Aturan *greedy* menjangkau Zona Merah paling luas (89,65%), tetapi hanya menahan 5,28% siswa lebih banyak daripada pembagian merata. KKT menjangkau lebih sedikit Zona Merah (82,13%) namun menahan 8,76% lebih banyak. *Greedy* terus menumpuk kuota di wilayah paling berisiko meskipun manfaat tambahannya sudah kecil, padahal kuota yang sama akan menahan lebih banyak siswa di wilayah berisiko menengah. Rasio manfaat terhadap *oracle* tidak kami pakai karena pembagian merata saja sudah mencapai 91,0%.

Dalam 30 simulasi, median keunggulan KKT atas pembagian merata adalah 7,34% (P5–P95: 5,71–9,41%), sedangkan proporsional 7,54%, dan KKT hanya unggul pada 4 simulasi. Ketika perbandingan diulang dengan laju benar, hasilnya berbalik tipis: KKT 9,92% dan proporsional 9,84%. Selisih kecil itu bersumber dari galat prediksi. Aturan yang optimal ketika laju diketahui tidak otomatis menjadi yang terbaik ketika laju hanya diperkirakan, persis seperti yang diperingatkan teori *predict-then-optimize* [12]. Dalam seluruh uji, selisih median kedua aturan tidak pernah melebihi 0,3 poin persentase.

Karena itu, kami merekomendasikan aturan proporsional risiko sebagai pembagian utama karena sederhana, mudah dijelaskan kepada daerah, dan sedikit lebih tahan terhadap salah prediksi. Mesin KKT tetap diperlukan untuk menghitung harga bayangan, memeriksa kelayakan lantai dan batas atas, serta menyusun transisi. Pada pagu dasar, harga bayangan model adalah 6,77 siswa tertahan per tambahan Rp1 miliar. Angka ini bergantung pada asumsi kecepatan manfaat dan bukan estimasi pengembalian anggaran riil.

## 3.4 Ketahanan dan Transisi yang Berkelanjutan
Setiap asumsi diuji dengan mengganti bentuk kurva manfaat dan membuat kebutuhan salah ukur (Gambar 5).

[FIG fig06_ketahanan|Median keunggulan KKT dan proporsional atas merata ketika kurva manfaat atau ukuran kebutuhan diubah]

Berdasarkan Gambar 5, median kedua aturan tetap di atas pembagian merata pada semua uji dan jaraknya tetap sempit. Dari 18 kombinasi kecepatan manfaat dan bentuk kurva, 17 median keunggulan tetap positif (Lampiran 6). Uji terberat adalah salah ukur kebutuhan. Jika kebutuhan di wilayah terpencil ternyata 25% lebih rendah daripada proksi, keunggulan KKT turun dari 7,34% menjadi 1,84% (proporsional 1,91%). Akurasi data kebutuhan ternyata lebih menentukan daripada pilihan aturan. Keunggulan juga bergantung pada pagu, yaitu 20,16% pada pagu 30% dan 2,14% pada pagu 80%, karena anggaran yang sempit membuat cara membagi jauh lebih penting.

Tanpa perlindungan, cakupan Kota Surabaya akan langsung turun dari 55% ke 20% pada tahun pertama (Lampiran 6). EduShield membatasi penurunan kuota setiap daerah paling banyak 10% per tahun, sehingga cakupannya turun perlahan hingga 32,5% pada tahun kelima. Harga perlindungan ini kecil: keunggulan tahun pertama menjadi 6,96%, hanya 0,39 poin persentase di bawah pembagian langsung, dan dengan perlindungan yang sama aturan proporsional tetap setara (Lampiran 6). Batas ini terjamin pada pagu tetap; jika pagu dipotong antartahun, lantai yang tidak lagi layak harus dirundingkan terbuka oleh pejabat berwenang.

## 3.5 EduShield sebagai Ruang Keputusan
Hasil analisis diwujudkan dalam prototipe aplikasi web yang berjalan tanpa server dan mencakup 514 wilayah dalam 18 layar (Gambar 6). Radar memetakan risiko seluruh wilayah, simulator menghitung ulang kuota saat pagu atau batas diubah, profil menjelaskan faktor risiko, dan layar transisi menampilkan lintasan kuota lima tahun.

Mesin optimasi di peramban cocok dengan perhitungan Python pada tiga tingkat pagu (selisih relatif maksimum 3 × 10⁻¹⁵, waktu hitung sekitar 4 milidetik), dan setiap ekspor memuat label simulasi, parameter, versi, serta kode *hash* untuk audit. Kuota masih berupa usulan kontinu yang harus dibulatkan, dan pergantian ruang kerja belum merupakan autentikasi.

[FIG fig08_aplikasi|Tampilan prototipe EduShield: (a) radar risiko, (b) simulator kuota, (c) profil wilayah, (d) transisi kuota]

## 3.6 Rencana Implementasi dan Tata Kelola
EduShield diterapkan bertahap agar setiap klaim diuji sebelum diperluas (Tabel 2). Wilayah pilot yang kami usulkan adalah Nusa Tenggara Timur dan Papua Pegunungan, yang APS usia 16–18 tahunnya di bawah rata-rata nasional [1].

EduShield hanya mengolah data agregat. Pasal 20 UU PDP memuat dasar pemrosesan untuk pelaksanaan kewenangan, Pasal 25 mewajibkan perlindungan khusus jika kelak data pribadi anak diproses [19], dan sel agregat yang terlalu kecil tetap diperiksa agar tidak memungkinkan identifikasi ulang. Keputusan akhir berada pada pejabat berwenang, dan setiap perubahan usulan dicatat bersama alasannya.

[TABLE roadmap|Rencana implementasi EduShield]

# BAB IV|PENUTUP
## 4.1 Kesimpulan
Pertama, dalam simulasi pada 514 kabupaten/kota, GLM sederhana mengenali Zona Merah pada provinsi yang belum pernah dilihat dengan AUC 0,907 dan MAE 0,670 poin persentase, meskipun masih meremehkan wilayah berisiko ekstrem. Kedua, pilihan aturan pembagian menentukan hasil. Aturan yang memperhitungkan imbal hasil menurun menutup sekitar tiga perempat celah menuju pembagian terbaik, sedangkan aturan berbasis urutan hanya sekitar seperempat. KKT dan proporsional berasal dari keluarga yang sama dan selisih mediannya tidak melebihi 0,3 poin persentase. Proporsional kami rekomendasikan sebagai pembagian utama karena sedikit lebih tahan terhadap salah prediksi, sedangkan KKT menyediakan harga bayangan, batas perlindungan, dan transisi. Ketiga, EduShield telah berwujud prototipe yang dapat diaudit, dengan transisi yang membatasi penurunan kuota 10% per tahun dan keputusan akhir tetap berada pada manusia.

## 4.2 Saran
EduShield perlu diuji pada data riil melalui pilot yang memadankan Dapodik, DTSEN, dan BPS serta menguji prediksi pada semester berikutnya. Audit kebutuhan siswa rentan perlu didahulukan karena salah ukur kebutuhan paling banyak mengurangi manfaat. Kecepatan manfaat bantuan juga perlu diukur secara lokal melalui desain bertahap atau kuasi-eksperimen sebelum harga bayangan dipakai dalam perencanaan anggaran.


# DAFTAR PUSTAKA
[1] Badan Pusat Statistik, “Angka Partisipasi Sekolah (APS) Menurut Provinsi dan Kelompok Umur,” tabel statistik, data 2025, diperbarui 28 Agustus 2026. https://www.bps.go.id/id/statistics-table/2/MjIxMSMy/angka-partisipasi-sekolah--aps--menurut-provinsi-dan-kelompok-umur.html
[2] Badan Pusat Statistik, “Angka Anak Tidak Sekolah Menurut Jenjang Pendidikan dan Kuintil Pengeluaran,” tabel statistik Susenas, data 2023, diperbarui 8 April 2026. https://www.bps.go.id/id/statistics-table/2/MTk4OCMy/angka-anak-tidak-sekolah-menurut-jenjang-pendidikan-dan-kuintil-pengeluaran.html
[3] Puslapdik Kemendikdasmen, “Program Prioritas Nasional Tahun 2025 Terlampaui, Kinerja Anggaran Kemendikdasmen Dinilai Sangat Baik,” 22 Januari 2026. https://puslapdik.kemendikdasmen.go.id/program-prioritas-nasional-tahun-2025-terlampaui-kinerja-anggaran-kemendikdasmen-dinilai-sangat-baik/
[4] Puslapdik, “Klarifikasi Puslapdik: Nominal Dana PIP Jenjang SMA dan SMK Sebesar Rp1.800.000,” 7 Juli 2025. https://puslapdik.kemendikdasmen.go.id/klarifikasi-puslapdik-nominal-dana-pip-jenjang-sma-dan-smk-sebesar-rp1-800-000/
[5] Kementerian PPN/Bappenas, “Pemerintah Luncurkan Perpres Pencegahan dan Penanganan Anak Tidak Sekolah, Perkuat Hak Pendidikan Anak Indonesia,” 3 Juni 2026. https://www.bappenas.go.id/id/berita/pemerintah-luncurkan-perpres-pencegahan-dan-penanganan-anak-tidak-sekolah-perkuat-hak-pendidikan-anak-indonesia-ijzHs
[6] Badan Pemeriksa Keuangan, Ikhtisar Hasil Pemeriksaan Semester II Tahun 2020, Gambar 1.9, hlm. 140, 2021. https://foresight.bpk.go.id/wp-content/uploads/2021/09/IHPS-II-2020.pdf
[7] Puslapdik Kemendikdasmen, “Batas Waktu Perpanjangan Aktivasi Rekening PIP Diperpanjang hingga 28 Februari 2026,” 30 Januari 2026. https://puslapdik.kemendikdasmen.go.id/batas-waktu-perpanjangan-aktivasi-rekening-pip-diperpanjang-hingga-28-februari-2026/
[8] R. A. Sparrow, “Protecting education for the poor in times of crises: An evaluation of a scholarship programme in Indonesia,” Oxford Bull. Econ. Stat., vol. 69, hlm. 99–122, 2007, doi: 10.1111/j.1468-0084.2006.00438.x. https://research.vu.nl/en/publications/protecting-education-for-the-poor-in-times-of-crises-an-evaluatio/
[9] L. Cameron, “Can a public scholarship program successfully reduce school drop-outs in a time of economic crisis? Evidence from Indonesia,” Econ. Educ. Rev., vol. 28, no. 3, hlm. 308–317, 2009. https://research.monash.edu/en/publications/can-a-public-scholarship-program-successfully-reduce-school-drop-/
[10] H. A. Listiyanto dan R. M. Qibthiyyah, “The Impact of School Voucher Program on School Dropouts in Indonesia,” JPBM, vol. 8, no. 2, hlm. 113–127, 2022, doi: 10.17977/um003v8i22022p113. https://journal2.um.ac.id/index.php/jpbm/article/view/29249
[11] BPS, Statistik Pendidikan 2025, nomor publikasi 04200.25022, 21 November 2025, revisi 8 Mei 2026. https://www.bps.go.id/id/publication/2025/11/21/d048070f37740b0e04d99350/statistics-of-education-2025.html
[12] A. N. Elmachtoub dan P. Grigas, “Smart ‘Predict, then Optimize’,” Management Science, vol. 68, no. 1, hlm. 9–26, 2022. https://arxiv.org/abs/1710.08005
[13] L. E. Papke dan J. M. Wooldridge, “Econometric methods for fractional response variables with an application to 401(k) plan participation rates,” J. Appl. Econometrics, vol. 11, hlm. 619–632, 1996. https://www.nber.org/papers/t0147
[14] G. Ke dkk., “LightGBM: A Highly Efficient Gradient Boosting Decision Tree,” Advances in Neural Information Processing Systems 30, 2017. https://papers.nips.cc/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html
[15] S. Boyd dan L. Vandenberghe, Convex Optimization. Cambridge University Press, 2004, bab 5. https://web.stanford.edu/~boyd/cvxbook/
[16] F. P. Kelly, A. K. Maulloo, dan D. K. H. Tan, “Rate control in communication networks: shadow prices, proportional fairness and stability,” J. Oper. Res. Soc., vol. 49, hlm. 237–252, 1998. https://www.statslab.cam.ac.uk/~frank/rate.html
[17] BPS, “Persentase Penduduk Miskin (P0) Menurut Kabupaten/Kota,” data 2025, salinan lokal diarsipkan 30 Oktober 2026. https://www.bps.go.id/id/statistics-table/2/NjIxIzI=/persentase-penduduk-miskin--p0--menurut-kabupaten-kota--persen-.html
[18] BPS, “Jumlah Penduduk menurut Kabupaten/Kota dan Kelompok Umur,” data 2026, salinan lokal diarsipkan 30 Oktober 2026. https://www.bps.go.id/id/statistics-table/2/Mjc5MCMy/-jumlah-penduduk-menurut-kabupaten-kota-dan-kelompok-umur.html
[19] Republik Indonesia, Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, khususnya Pasal 20 dan 25. https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/