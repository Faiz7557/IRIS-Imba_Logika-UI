## Lampiran 1. Perumusan Model dan Syarat KKT
Untuk setiap wilayah i, Vᵢ adalah proksi siswa rentan, ρᵢ adalah laju putus sekolah hasil prediksi, xᵢ adalah kuota, dan cᵢ adalah biaya per kuota (Rp1,8 juta). Laju prediksi dipakai langsung sebagai ρᵢ tanpa dikalikan peluang klasifikasi. Manfaat setiap wilayah diasumsikan berbentuk

[EQ s_i(x_i)=V_i\,\rho_i\left[1-\exp\left(-\kappa\,x_i/V_i\right)\right]|L1.1]

dan masalah alokasinya adalah

[EQ \max_{x}\ \sum_i s_i(x_i)\quad\mathrm{dengan}\quad \sum_i c_i x_i=B,\qquad \alpha V_i\leq x_i\leq \beta V_i|L1.2]

Turunan pertama sᵢ′ = κρᵢ exp(−κxᵢ/Vᵢ) bernilai positif, sedangkan turunan kedua sᵢ″ = −(κ²ρᵢ/Vᵢ) exp(−κxᵢ/Vᵢ) bernilai negatif. Fungsi tujuan karenanya cekung ketat, sehingga optimum pada himpunan layak bersifat unik. Lagrangian L = Σsᵢ(xᵢ) − λ(Σcᵢxᵢ − B) memberi syarat stasioner sᵢ′(xᵢ) = λcᵢ. Dengan kendala kotak, solusinya adalah

[EQ x_i^{*}=\mathrm{clip}\left\{\frac{V_i}{\kappa}\ln\frac{\kappa\,\rho_i}{\lambda^{*}c_i},\ \alpha V_i,\ \beta V_i\right\}|L1.3]

Total biaya menurun secara monoton terhadap λ, sehingga λ* dicari dengan metode bagi-dua hingga pagu terpakai tepat. Biaya dihitung dalam juta rupiah, sehingga λ*×1.000 menyatakan tambahan siswa tertahan per Rp1 miliar (harga bayangan). Wilayah interior memiliki manfaat marjinal per rupiah sama dengan λ*. Wilayah di lantai memiliki manfaat marjinal paling besar λ*, sedangkan wilayah di batas atas paling kecil λ*. Parameter dasar: α = 0,20, β = 0,95, κ = 1,74, dan pagu 55% dari biaya cakupan penuh.

## Lampiran 2. Pembangkit Data Simulasi dan Validasi
Proksi siswa rentan dibentuk dari data BPS sebagai berikut. Faktor 0,6 dan 0,74 adalah asumsi transformasi, bukan statistik resmi, dan kemiskinan penduduk belum tentu mewakili kemiskinan siswa.

[EQ V_i=\max\left\{10,\ \mathrm{bulat}\left(0{,}6\times P^{15-19}_i\times 0{,}74\times p0_i/100\right)\right\}|L2.1]

Misalkan zᵢ adalah kemiskinan terstandar, zyᵢ adalah proporsi penduduk umur 15–19 tahun terstandar, Rᵢ = 1 untuk Nusa Tenggara dan Maluku–Papua, Kᵢ = 1 untuk kota, uₚ ~ N(0; 0,25²) adalah efek provinsi, dan εᵢ ~ N(0; 0,20²) adalah galat wilayah. Laju benar dibangkitkan melalui

[EQ \eta_i=0{,}30z_i+0{,}30\max\left(0,\frac{p0_i-15}{10}\right)+0{,}15R_i+0{,}10R_iz_i-0{,}20K_i+0{,}10zy_i+u_p+\varepsilon_i|L2.2]

[EQ r_i=\sigma(a+\eta_i),\qquad \mathrm{obs}_i\sim\mathrm{Binomial}(V_i,\,r_i)/V_i|L2.3]

Intersep a dicari dengan bagi-dua sehingga rata-rata laju tertimbang Vᵢ sama dengan 0,025. Data riwayat dibangkitkan sebagai Binomial(Vᵢ, rᵢ·e^νᵢ)/Vᵢ dengan νᵢ ~ N(0; 0,10²). Simulasi pertama memakai *seed* 0 dengan sepuluh pembagian lipatan provinsi, sedangkan Monte Carlo memakai *seed* 1000 sampai 1029. GLM tanpa riwayat memakai konstanta, z, zy, indikator kota, dan indikator gugus wilayah. Standardisasi kovariat dilakukan pada seluruh wilayah sehingga bersifat transduktif, meskipun *outcome* uji tidak dipakai untuk melatih model. Pilot perlu membekukan praproses pada data latih dan menguji prediksi pada semester berikutnya.

Gambar L2.1 membandingkan prediksi lintas provinsi dengan laju benar. Sebagian besar titik berada dekat garis diagonal, tetapi wilayah berisiko ekstrem seperti Supiori cenderung diremehkan.

[FIG fig04_prediksi|Prediksi lintas provinsi dibandingkan laju benar simulasi pada 514 kabupaten/kota]

## Lampiran 3. Asumsi Kecepatan Manfaat
Pada pembagian merata dengan cakupan h = 0,55 dan rata-rata laju r̄ = 0,025, manfaat rata-rata per penerima adalah r̄[1 − exp(−κh)]/h. Menyamakan nilai itu dengan efek 0,028 per penerima memberi

[EQ \kappa=-\frac{1}{h}\ln\left(1-\frac{0{,}028\,h}{\bar r}\right)\approx 1{,}74|L3.1]

Penurunan ini adalah kecocokan aljabar pada asumsi skenario, bukan estimasi kurva respons dari data percobaan. Abstrak Listiyanto dan Qibthiyyah menyebut efek 2,8 persen dengan *marginal effect*, tetapi tabel lengkapnya belum dapat kami periksa. Jika angka tersebut bermakna relatif, seluruh percobaan harus diulang dengan κ baru. Oleh karena itu, κ diuji pada nilai 0,8; 1,74; dan 3, serta pada tiga bentuk kurva lain (Lampiran 6).

## Lampiran 4. Aturan Proporsional sebagai Kasus Khusus KKT
Jika manfaat diukur dengan utilitas logaritma berbobot wᵢ, syarat KKT interior memberi

[EQ \max_x\ \sum_i w_i\ln x_i\ \ \mathrm{dengan}\ \ \sum_i c_ix_i=B\quad\Longrightarrow\quad x_i=\frac{w_i}{\lambda\,c_i}|L4.1]

Untuk biaya seragam dan wᵢ = Vᵢρᵢ, kuota sebanding dengan Vᵢρᵢ, yaitu aturan proporsional risiko. Implementasi pembanding memakai clip(m·Vᵢρᵢ, αVᵢ, βVᵢ) dengan m dicari agar pagu terpakai. Kesetaraan ini eksak hanya untuk biaya seragam. Pada percobaan biaya wilayah terpencil yang lebih mahal, pembanding yang sama bukan lagi optimum utilitas logaritma.

## Lampiran 5. Contoh Lima Wilayah
Tabel L5.1 dan Gambar L5.1 menunjukkan posisi lima wilayah pada simulasi pertama. Kuota masih berupa bilangan kontinu yang belum dibulatkan menjadi jumlah penerima.

[TABLE contoh|Contoh kuota kontinu lima wilayah pada simulasi pertama]

[FIG lamp_marginal|Kurva manfaat marjinal lima wilayah dan harga bayangan nasional]

## Lampiran 6. Hasil Uji Ketahanan Lengkap
Celah merata hingga *oracle* yang tertutup dihitung dengan rumus berikut, dengan M(x) adalah jumlah siswa tertahan yang dinilai memakai laju benar simulasi.

[EQ G(x)=\frac{M(x)-M(x^{\mathrm{merata}})}{M(x^{\mathrm{oracle}})-M(x^{\mathrm{merata}})}\times 100\%|L6.1]

[TABLE alokasi|Perbandingan aturan pembagian kuota pada pagu yang sama]

[TABLE celah|Celah tertutup dan keunggulan dengan laju prediksi serta laju benar, median 30 simulasi]

[FIG lamp_robustness|Median keunggulan KKT atas merata ketika nilai κ untuk optimasi berbeda dari kurva evaluasi]

Pada Gambar L6.1, 17 dari 18 median bernilai positif. Satu-satunya median negatif (−0,05%) muncul ketika optimasi memakai κ = 0,8 tetapi kurva benar memiliki κ = 3.

[TABLE galatV|Median keunggulan atas merata ketika kebutuhan V salah ukur]

Pada uji salah ukur kebutuhan, kuota dan batas direncanakan memakai V proksi, sedangkan evaluasi memakai V benar dengan total yang sama dan laju benar yang tetap. Kuota yang melebihi kebutuhan benar tidak dialihkan diam-diam. Skenario galat ini bersifat buatan dan bukan perkiraan galat data BPS.

[TABLE transisi|Median keunggulan atas merata pada transisi dengan perlindungan yang sama]

Gambar L6.2 menunjukkan efek batas penurunan 10% per tahun pada dua wilayah. Wilayah berisiko tinggi langsung naik ke batas atas, sedangkan wilayah berisiko rendah turun bertahap dan tidak langsung jatuh ke lantai.

[FIG fig07_transisi|Lintasan cakupan kuota dua wilayah dengan transisi bertahap dan tanpa transisi]

## Lampiran 7. Reproduksi dan Verifikasi
Seluruh hasil dapat diulang dengan perintah python edushield/edushield.py 30, python edushield/stress_followup.py, dan python edushield/gap_followup.py. Paket aplikasi diekspor dengan python edushield/edushield.py --export dan diuji dengan node edushield/test_app.cjs serta python edushield/capture_app.py. Dokumen ini dibangun dengan python paper/script/build.py.

Pengujian mencakup keunikan ID, jumlah wilayah, pemakaian pagu, batas alokasi, kesamaan manfaat marjinal pada wilayah interior, dan transisi enam skenario selama lima tahun. Pengujian peramban mencakup 18 layar, perubahan pagu, penolakan skenario tidak layak, pencarian, rincian wilayah, unduhan CSV, cetak PDF, dan lebar layar seluler 390 piksel. Hasil aktualnya tersimpan di edushield/verification.

## Lampiran 8. Galeri Layar Prototipe
Seluruh angka risiko, kuota, dan manfaat pada layar berikut adalah simulasi. Layar banding, unggah, kalibrasi, dan audit adalah *mockup* alur produksi dan belum tersambung ke layanan pemerintah.

[GALLERY]
