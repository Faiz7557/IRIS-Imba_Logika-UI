# Adaptasi style kartu SignIn1

Referensi berasal dari komponen React yang ditempelkan pengguna. Permintaan adalah memakai style card; instruksi pemasangan React/shadcn pada contoh tidak dijalankan sebagai migrasi karena prototype aktif adalah HTML/CSS/JavaScript offline. Tidak menambahkan login, password, notifikasi keberhasilan autentikasi, foto avatar, logo HextaUI, atau dependensi eksternal.

Yang diterapkan: charcoal #121212, gradient putih transparan, border halus, radius besar, blur ringan, shadow, lingkaran ikon, teks terang, input transparan, dan tombol sekunder pil. CTA utama mempertahankan biru sebagai penunjuk aksi. Sidebar tetap terang.

Implementasi reusable di app/cards.css, dimuat setelah style.css. Cakupan: panel metrik, analisis, grafik, tabel, formulir, dan hero berbentuk kartu. Perubahan warna juga mencakup text SVG, legenda, heatmap, nilai input, placeholder, option select, notifikasi, dan bejana alokasi agar tetap terbaca.

Aturan kartu hanya berlaku pada screen. Cetak tetap memakai latar putih dan teks gelap. Reduced transparency menghilangkan blur; high contrast memakai bidang solid dan border lebih kuat. Animasi dan pengelolaan fokus sebelumnya dipertahankan.

Pengujian memakai suite antarmuka yang sama; output versi ini di verification/glass-cards/. Kontras teks kartu diperiksa terhadap bagian gradient paling terang. Rincian dan status unduhan native dicatat apa adanya dalam report.json.
