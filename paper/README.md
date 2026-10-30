# EduShield: esai UEC LOGIKA UI 2026 yang dapat diregenerasi

## Aturan utama

Semua perubahan dilakukan di `script/`, lalu jalankan `python paper/script/build.py` dari folder induk proyek (atau dari mana saja). Berkas di `output/` adalah hasil generate dan tidak boleh diedit manual. PDF selalu dikonversi dari DOCX yang sama, sehingga isi keduanya identik.

## Cara regenerasi

```powershell
python edushield/gap_followup.py      # hanya jika hasil simulasi berubah
python paper/script/build.py
```

Dependensi: python-docx, matplotlib, pillow, pymupdf, pywin32 (semuanya sudah terpasang di mesin ini). Konversi PDF memakai aplikasi kompatibel Word yang terdaftar di Windows (`Word.Application`, yang di mesin ini menunjuk ke WPS). Jika memakai Microsoft Word atau aplikasi lain, jumlah halaman bisa bergeser: jalankan build lagi dan baca `output/qa_report.json`.

Build gagal secara sengaja jika:
- badan esai lebih dari 10 halaman, atau cover lebih dari 1 halaman;
- ada em dash di konten;
- ada angka `{{...}}` yang tidak terdaftar;
- ada pustaka yang tidak disitasi;
- ada Gambar/Tabel yang tidak dirujuk di teks;
- caption diakhiri titik;
- label di dalam grafik saling menimpa.

## Peta berkas

| Berkas | Isi |
|---|---|
| `script/content.md` | Badan esai BAB I–IV. Sintaks: `# BAB I\|JUDUL`, `## subbab`, `*miring*`, `{{angka}}`, `[[kunci_pustaka]]`, `[FIG nama\|caption]`, `[TABLE kunci\|caption]` |
| `script/lampiran.md` | Lampiran 1–8. Tambahan sintaks: `[EQ latex\|label]` dan `[GALLERY]` |
| `script/build.py` | Registri angka `NUM` (semua dari JSON hasil eksperimen dan CSV BPS), identitas tim `IDENT`, cover di atas template, tabel, persamaan, galeri, lembar orisinalitas, konversi PDF, QA |
| `script/figures.py` | Satu fungsi per gambar (`fig01_urgensi` … `fig08_aplikasi`, `lamp_*`), termasuk cek tumpang tindih label |
| `script/checks.py` | Cek sumber konten (em dash, angka terdaftar, rujukan silang) |
| `script/references.py` | 19 pustaka IEEE, berurut sesuai kemunculan pertama |
| `script/source_audit.md` | Status verifikasi setiap sumber |
| `script/archive/` | Draf v2 dan `build_v2.py` lama, hanya untuk riwayat |
| `../edushield/data/raw/bps_*.csv` | Tabel BPS yang dibaca langsung dari bps.go.id (APS provinsi 2025, ATS per kuintil 2023) |
| `../edushield/results/gap_followup.json` | Celah merata–oracle yang tertutup dan perbandingan dengan laju benar |

## Keputusan yang sudah diambil

- **Format:** Bahasa Indonesia formal akademik, mengikuti PUEBI. Template resmi `Template UEC.docx` (root proyek) dipakai sebagai dasar cover, dengan logo diganti oleh `LOGO LOGIKA UI.png` yang diperkecil ke 6,2 cm.
- **Tata letak (aturan guidebook):** A4, margin 4/3/3/3 cm, Times New Roman 12, spasi 1,5, judul bab 14 tebal di halaman baru.
- **Aturan template:** antarparagraf satu jarak 12 pt, tanpa indentasi. Caption "Tabel n." di atas tabel dan "Gambar n." di bawah gambar, tanpa titik di akhir. Pustaka IEEE dengan spasi 1.
- **Gaya penulisan:** mengikuti `Contoh Finalist/SEC Mas Michael.pdf`, yaitu naratif dengan pola "Berdasarkan Gambar/Tabel n, …", istilah asing dimiringkan, dan tabel tiga garis. Humanize sudah dijalankan dengan skill `ai-paraphrase`, dan tidak ada em dash.
- **Badan tanpa persamaan** (permintaan pengguna): matematika dijelaskan lewat narasi dan visual (analogi bejana, kurva marjinal), sedangkan rumus lengkap ada di Lampiran 1–4 dan 6.
- **Tesis pasca-audit court v2:**
  - Aturan yang memperhitungkan imbal hasil menurun menutup sekitar 76% celah merata–oracle, sedangkan aturan peringkat hanya sekitar 24%.
  - KKT dan proporsional satu keluarga; selisih mediannya ≤ 0,3 pp.
  - Proporsional direkomendasikan sebagai aturan utama. KKT dipakai untuk harga bayangan, batas perlindungan, dan transisi.
  - Metrik "97,82% oracle" sengaja tidak dipakai sebagai ukuran utama.

## Catatan teknis

- **Badan tepat 10 halaman, marginnya tipis.** Kelebihan sekitar 2 baris di BAB III dapat mendorong gambar atau tabel ke halaman berikutnya dan membuat build gagal. Jika menambah teks, pangkas di bab yang sama. WPS tidak memecah gambar, sehingga gambar yang tidak muat menyisakan ruang kosong. Ukur dengan pola di `check_pdf` atau lihat `preview_*.png`.
- **Tabel:** lebar kolom harus diset lewat grid (`t.columns[i].width`) dan `tblLayout fixed`, karena WPS mengabaikan lebar per sel. Jarak setelah tabel memakai `space_before` paragraf berikutnya, bukan paragraf kosong, karena paragraf kosong bisa tumpah ke halaman baru.
- **Cover** diisi langsung di atas paragraf template (indeks 2, 4, 8–11, 13). Paragraf 12 dihapus, dan cover dijadikan section sendiri sehingga nomor halaman badan mulai dari 1. Jika template berubah, `base()` akan berhenti di assert.
- **Gambar aplikasi** (`fig08_aplikasi`, galeri Lampiran 8) dibaca langsung dari `edushield/lampiran/*.png` saat build. Desain aplikasi sedang diubah oleh sesi lain ("Onda / 8B visual adaptation"). Setelah desain final, jalankan `python edushield/capture_app.py` lalu build ulang. Pemotongan gambar sengaja selebar penuh agar tidak bergantung pada tata letak.
- **Penanda miring** `*...*` tidak aktif untuk `λ*` karena regex mensyaratkan batas kata.

## Checklist sebelum submit

- [ ] Isi nama ketua tim, kota, dan tanggal di lembar orisinalitas, lalu tanda tangan dan meterai. Berkas di `output/` sengaja diberi nama `BELUM_DITANDATANGANI`.
- [ ] Jalankan Turnitin (batas 20%).
- [ ] Pastikan tangkapan layar memakai desain aplikasi final, lalu build ulang dan cek `qa_report.json` (`body_pages` ≤ 10).
- [ ] Nama berkas submisi: `UEC0032_IRIS Imba_Esai.pdf` dan `UEC0032_IRIS Imba_LembarOrisinalitas.pdf`.
- [ ] Baca cepat semua `preview_*.png`.
