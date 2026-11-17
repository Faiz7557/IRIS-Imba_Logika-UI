# EduShield UI refresh: pola SpareKit, tetap biru, hero 3D di Beranda

Tanggal: 2026-11-17 · Status: draf, menunggu persetujuan

## Intent

Tampilan prototype EduShield (`edushield/app`) terasa kaku dan kurang rapi. Prototype SpareKit (`caliber-final/app`) terasa lebih bersih. Kita mengadopsi **pola** desain SpareKit (hierarki, ritme, komponen) tanpa menyalin kodenya, dengan palet tetap **dominan biru**. Visualisasi 3D dipakai di tempat yang cocok: hero Beranda.

Penonton: juri UEC yang membuka prototype (desktop dan HP) dan pembaca esai yang melihat tangkapan layarnya.

## Goals

1. Semua 8 rute terasa satu sistem: latar, panel, tipografi, chip, dan jarak yang konsisten.
2. Hierarki ala SpareKit: judul = pertanyaan, subjudul = jawaban satu kalimat dengan angka penting ditebalkan.
3. Sidebar lebih rapi: langkah 1–6 dikelompokkan per pertanyaan, bisa diciutkan, kartu ringkasan skenario di kaki sidebar.
4. Beranda punya hero 3D: peta 514 kab/kota yang ditinggikan, bisa diputar dan diklik.
5. Mode terang dan gelap tetap jalan.

## Non-goals

- Tidak migrasi ke React, Tailwind, atau build step.
- Tidak mengubah angka, solver, data, atau logika layar.
- Tidak menambah pencarian Ctrl K, login, atau asisten AI.
- Halaman Peta risiko tetap SVG 2D (akurat untuk dibaca per wilayah).

## Anti-goals (gagal walau "jalan")

- Ada request jaringan eksternal (aplikasi harus jalan offline via `file://`; `test_apple.cjs` mencatat request `http(s)`).
- 3D menutupi informasi: angka dan pesan Beranda harus tetap terbaca tanpa 3D.
- Warna jadi satu-satunya pembeda status (chip selalu ikon + kata).
- Beranda lambat atau patah di HP.

## Constraints

- HTML/CSS/JS vanilla, skrip klasik (`<script defer>`). `file://` memblokir ES module, jadi three.js harus build UMD klasik yang disalin ke repo.
- Test UI yang harus tetap lulus: `test_apple.cjs` (8 rute × 6 lebar, satu `h1`, `.simulation` terlihat, satu `.sidebar [aria-current=page]`, tanpa overflow, tanpa request eksternal, 514 `path[data-i]` di peta), `test_modes.cjs`, `test_state_icons.cjs`, `test_app.cjs` (solver, tidak tersentuh).
- Cetak (`@media print`) tetap putih dan hemat tinta.
- `prefers-reduced-motion`, `prefers-contrast`, fokus keyboard tetap dihormati.

## Approaches

| | Isi | Trade-off |
|---|---|---|
| A | Rapikan visual saja, tanpa 3D | Risiko terkecil, tanpa "wow" |
| **B (dipilih)** | A + hero 3D three.js di Beranda; Peta risiko tetap SVG | Kesan pertama kuat, analisis tetap jujur. Biaya: aset three.js ~165 KB gzip, fallback, uji HP |
| C | Rombak semua layout ala SpareKit + 3D di banyak layar | Paling mirip SpareKit, tapi besar dan berisiko memecahkan test serta lampiran |

Dipilih user: **B**.

## Desain

### 1. Token warna (ganti `:root` di `style.css`, dark di `themes.css`)

Pola SpareKit: latar netral, kontrol berwarna tinta, satu aksen, warna lain hanya status. Di EduShield aksennya biru.

| Token | Terang | Gelap | Pakai |
|---|---|---|---|
| `--ground` | `#f3f5f8` (netral sejuk) | `#0f1217` | latar halaman |
| `--panel` / `--panel-2` | `#fff` / `#f8fafc` | `#171b22` / `#1c212a` | panel, input |
| `--line` / `--line-2` | `rgb(16 24 40 / .08)` / `.15` | `#ffffff14` / `#ffffff26` | garis rambut |
| `--ink` … `--ink-4` | `#111827` `#3f4654` `#6b7280` `#a1a7b3` | `#f3f5f8` … | teks bertingkat |
| `--accent` / `--accent-soft` | `#0066cc` / `#e6f0fb` | `#8fc0ff` / `#1b3150` | aksen tunggal, tombol utama, nav aktif |
| status `act/plan/ready/idle` | merah / amber / hijau / abu, masing-masing `-soft`, `-ink`, solid | versi gelap | chip status saja |

Skala kelas risiko peta (`--pk0..3`) tetap skala biru yang ada.

### 2. Komponen (CSS baru, markup layar disesuaikan seperlunya)

- **Panel**: radius 20px, garis 1px `--line`, bayangan kontak `0 1px 2px`. Tidak bersarang. Menggantikan gaya glass 24px di `cards.css`.
- **Page head**: `page-context` kecil, `h1` 28px semibold tracking −0.02em (lebih kecil dari sekarang `clamp(28–40px)`), `p.sub` satu–dua kalimat. Angka penting di `p.sub` pakai `<b class="em">`.
- **Chip**: tinggi 22px, radius 7px, ikon + kata di atas tint `-soft`.
- **Tombol**: tombol utama biru solid; sekunder garis rambut putih; radius 10px (bukan pil 999px).
- **Figure/KPI**: angka 26px tabular, label 12.5px abu; dipakai hemat (Beranda saja).
- Tipografi tetap stack sistem (`-apple-system, Segoe UI`), `font-variant-numeric: tabular-nums` global.

### 3. Sidebar (`ui.js` + `style.css`)

```
[logo] EduShield                 «
───────────────────────────────
  Beranda
Di mana risikonya?
  1  Peta risiko
Bagaimana membaginya?
  2  Simulator kuota
  3  Audit data
Bisakah dipercaya?
  4  Replay
Siapa memutuskan?
  5  Usulan & koreksi
  6  Lembar final
───────────────────────────────
  Metode & batas data
  Mulai tur
┌─────────────────────────────┐
│ Skenario aktif              │
│ Rp xx,x miliar              │
│ ▓▓▓▓▓▓░░░  porsi 60%        │
└─────────────────────────────┘
```

- Judul grup diambil dari pertanyaan yang sudah ada di `LANGKAH` Beranda. Pengelompokan di atas adalah usulan saya.
- Tombol « menciutkan ke 68px (ikon/nomor saja, tooltip `title`). Disimpan di `localStorage` dengan try/catch.
- Kartu skenario di kaki membaca `result.B` dan `params.share`; disembunyikan bila nilai tidak finite.
- Di < 768px perilaku drawer yang ada dipertahankan.

### 4. Hero 3D Beranda (`viz/peta3d.js` baru)

```
┌──────────────────────────────────────────────────────────┐
│ Beranda · Perencanaan kuota PIP SMA/SMK                  │
│ Sebelum kuota PIP dibagi, data wilayah mana ... dulu?    │
│ Aturan wajar memberi kuota hampir sama; yang mengubah    │
│ hasil adalah mutu data. 20 wilayah memuat **xx%** ...    │
│ [Mulai tur] [Langsung ke audit data]                     │
├──────────────────────────────────────────────────────────┤
│          ▂▅█▃   ▁▂▇▃▁        ▃▆▂     ▁▂                  │
│   (peta Indonesia 3D, berputar pelan, tinggi = nilai     │
│    audit, warna = kelas risiko)        [legenda] [2D]    │
├─────────────┬─────────────┬─────────────┬────────────────┤
│ Wilayah 514 │ Pagu Rp..   │ Top-20 xx%  │ Selisih x pp   │
├─────────────┴─────────────┴─────────────┴────────────────┤
│ Enam langkah (kartu bernomor, 3 kolom)                   │
└──────────────────────────────────────────────────────────┘
```

- **Data**: bentuk dari `EDU_GEO.paths` (string path SVG dalam viewBox 1000×380) diubah jadi `THREE.Shape`, lalu `ExtrudeGeometry`. Tinggi = `D.kab[i].audit.A` (skala akar, dinormalkan), warna = kelas risiko yang sama dengan peta 2D (`--pk0..3`). Ini usulan saya: tinggi menyorot pesan Beranda ("data mana diperiksa dulu"), warna menyambung ke Peta risiko.
- **Interaksi**: seret untuk memutar (orbit sederhana buatan sendiri, ±25° tilt, tanpa OrbitControls), hover menyorot wilayah + tooltip nama dan nilai audit, klik membuka `#peta` dengan wilayah itu terpilih.
- **Gerak**: putar pelan otomatis; berhenti saat interaksi, saat tab tersembunyi, dan bila `prefers-reduced-motion` (tampil statis).
- **Kinerja**: geometri digabung per kelas (4 mesh) untuk render; picking lewat raycast ke mesh per wilayah yang tak terlihat. `devicePixelRatio` dibatasi 2. Render hanya saat ada perubahan bila tidak berputar.
- **Fallback**: tanpa WebGL, atau error saat membangun, tampil peta SVG 2D (`EduPeta.html`) di slot yang sama. Tombol [2D] juga bisa memaksa versi 2D.
- **Aksesibilitas**: kanvas `role="img"` dengan `aria-label` ringkasan (mis. "Peta 3D, 20 wilayah teratas memuat xx% nilai audit"); semua angka tetap ada di kartu teks.
- **Tema**: warna dibaca dari CSS variable saat render, dibangun ulang saat tema berganti.
- **Aset**: `app/vendor/three.min.js` dari `three@0.159.0` (rilis terakhir dengan build UMD `build/three.min.js`), lisensi MIT dicatat di `TEMPLATE_CREDITS.md`. Dimuat `defer`; Beranda menunggu `window.THREE`.

### 5. Layar lain

Hanya terkena token, panel, page head, chip, dan tombol baru. Struktur dan logika tidak berubah.

## Verifikasi

- Jalankan `test_apple.cjs`, `test_modes.cjs`, `test_state_icons.cjs`, `test_app.cjs`; semua lulus.
- Tambah satu cek di `test_apple.cjs`: Beranda punya `canvas` hero atau fallback SVG, dan tidak ada request eksternal.
- Tangkapan layar 1440 dan 390, terang dan gelap, untuk dibandingkan sebelum/sesudah.
- Regenerasi gambar esai/lampiran (`B1_mobile.png`, `paper/output/preview_*.png`) jadi langkah terpisah setelah UI disetujui.

## Keputusan dari builder check (keputusan saya, bisa dikoreksi)

1. **Klik 3D ke Peta risiko**: `selected` sudah variabel global bersama (`app.js` baris 5, dibaca `screens/peta.js`). Klik 3D cukup `selected=i; location.hash='#peta'`. Tidak ada format hash baru, jadi routing dan daftar rute test tidak berubah.
2. **Parsing path**: parser kecil untuk `M/L/Z` dari `EDU_GEO.paths`. Tiap subpath `M…Z` jadi satu `Shape`. Lubang (enklave) diabaikan; kota enklave diekstrusi di atasnya sendiri. Resolusi viewBox 1000×380 dianggap cukup untuk hero.
3. **Sidebar**: judul grup berupa teks biasa (tidak fokus, tidak `aria-current`). Kartu skenario bukan tautan nav. Mode ciut 68px hanya di ≥ 768px; di bawahnya tetap drawer dengan `inert` dan focus trap yang ada. Saat ciut, Metode dan Mulai tur tetap bisa dijangkau keyboard.
4. **Test**: cek Beranda menerima salah satu, `canvas` 3D atau fallback SVG, dan mencatat jalur mana yang tampil. Satu run tambahan dengan `--use-angle=swiftshader` memaksa jalur 3D.
5. **Kartu KPI Beranda**: empat kartu `kartu()` yang sudah ada, hanya ganti gaya.
6. **Aset three.js**: diunduh sekali dari registri npm (`three@0.159.0`, `build/three.min.js`) lalu di-commit di `app/vendor/`. Saat runtime tidak ada request jaringan. Perlu izin user untuk unduhan ini.

## Diserahkan ke builder

- Nilai hex persis untuk status dan dark mode, asal kontras teks ≥ 4.5:1.
- Detail kamera, pencahayaan, dan skala tinggi 3D.
- Cara picking (raycast atau ID buffer).
