"""M0: gabungkan PIP SIPINTAR (2025, 2026) per kab/kota ke 514 wilayah aplikasi.
Keluar != 0 bila ada padanan ganda, atau wilayah/baris tak tergabung. Kode provinsi SIPINTAR TIDAK dipakai
sebagai kode BPS; penggabungan lewat nama (dinormalkan) + provinsi. Laporan sisa: data/pip_gabung_laporan.txt."""
import csv, re, sys, glob, json
from pathlib import Path
import openpyxl

ROOT = Path(__file__).parent
RAW, DATA = ROOT / "data" / "raw", ROOT / "data"
LEVELS = ["SD", "SMP", "SMA", "SMK"]
# alias manual (nama SIPINTAR dinormalkan -> nama aplikasi dinormalkan); kosong bila tak perlu
ALIAS = {
    "toba": "tobasamosir",                                  # Kab. Toba = Toba Samosir (ganti nama 2020)
    "humbanghasudutan": "humbanghasundutan",                # ejaan SIPINTAR
    "limapuluhkoto": "limapuluhkota",                       # ejaan Koto/Kota
    "kepulauansiautagulandangbiaro": "siautagulandangbiaro",  # awalan Kepulauan
    "pangkajenekepulauan": "pangkajenedankepulauan",        # tanpa 'dan'
    "pasangkayu": "mamujuutara",                            # Mamuju Utara berganti nama Pasangkayu (2013)
    "kepulauantanimbar": "malukutenggarabarat",             # Maluku Tenggara Barat berganti nama Kep. Tanimbar (2019)
    "kepulauanmorotai": "pulaumorotai",                     # urutan kata
    "memberamoraya": "mamberamoraya",                       # ejaan
}


def norm(s):
    s = re.sub(r"\(pemekaran \d+\)", "", s.lower())
    s = re.sub(r"^(prov|kab)\.\s*", "", s.strip())
    s = s.replace("kep.", "kepulauan").replace("makasar", "makassar")
    return re.sub(r"[^a-z0-9]", "", s)


def nkey(prov, name):
    """kunci wilayah: (provinsi, jenis, nama dasar) agar Kab. X dan Kota X tidak bentrok."""
    kota = name.strip().lower().startswith("kota ") and name.strip().lower() != "kota baru"  # Kota Baru = Kab. Kotabaru (Kalsel)
    base = re.sub(r"^(kota)\s+", "", name.strip(), flags=re.I) if kota else name.replace("Kota Baru", "Kotabaru")
    base = ALIAS.get(norm(base), norm(base))
    return norm(prov), kota, base


def read_xlsx(f):
    ws = openpyxl.load_workbook(f, data_only=True).active
    rs = list(ws.iter_rows(values_only=True))
    return rs


def load_year(year):
    d = RAW / f"pip_{year}"
    out, prov_tot = {}, {}
    for f in sorted(d.glob("kab_*_download.xlsx")):
        rs = read_xlsx(f)
        prov = rs[0][1]
        for r in rs[3:]:
            if not r[0] or r[1] not in LEVELS:
                continue
            k = nkey(prov, r[0])
            if (k, r[1]) in out:
                sys.exit(f"padanan ganda {year}: {k} {r[1]} di {f.name}")
            out[(k, r[1])] = dict(siswa=r[2], rp=r[6], nama=r[0], prov=prov, f=f.name)
    for r in read_xlsx(d / "nasional_download.xlsx")[3:]:
        if r[0] and r[1] is None:
            cur = norm(r[0])
        elif r[1] in LEVELS:
            prov_tot[(cur, r[1])] = (r[2], r[6])
    return out, prov_tot


def main():
    app = list(csv.DictReader(open(DATA / "crosswalk_kab.csv", encoding="utf8")))
    keys = {}
    for a in app:
        k = nkey(a["provinsi_aplikasi"], a["nama_aplikasi"])
        if k in keys:
            sys.exit(f"padanan ganda di wilayah aplikasi: {k}")
        keys[k] = a
    lap, bad = [], False
    for year in (2025, 2026):
        sip, ptot = load_year(year)
        sipk = {k for k, _ in sip}
        lap.append(f"== {year}: {len(sipk)} wilayah SIPINTAR, {len(keys)} wilayah aplikasi")
        miss_app = [a["nama_aplikasi"] + " / " + a["provinsi_aplikasi"] for k, a in keys.items() if k not in sipk]
        miss_sip = [sip[(k, "SMA")]["nama"] + " / " + sip[(k, "SMA")]["prov"] for k in sorted(sipk) if k not in keys]
        lap += [f"wilayah aplikasi tanpa baris SIPINTAR: {m}" for m in miss_app]
        lap += [f"baris SIPINTAR tanpa wilayah aplikasi: {m}" for m in miss_sip]
        bad |= bool(miss_app or miss_sip)
        with open(DATA / f"pip_kab_{year}.csv", "w", newline="", encoding="utf8") as fh:
            w = csv.writer(fh)
            w.writerow(["id", "kode_bps", "nama", "prov", "sma_siswa", "smk_siswa", "sma_rp", "smk_rp",
                        "sd_siswa", "smp_siswa", "sumber"])
            for k, a in keys.items():
                if k not in sipk:
                    continue
                g = lambda L, c: sip[(k, L)][c]
                w.writerow([a["id"], a["kode_bps"], a["nama_aplikasi"], a["provinsi_aplikasi"],
                            g("SMA", "siswa"), g("SMK", "siswa"), g("SMA", "rp"), g("SMK", "rp"),
                            g("SD", "siswa"), g("SMP", "siswa"),
                            f"SIPINTAR penyaluran/kabupaten ?tahun={year} (Disalurkan) {sip[(k, 'SMA')]['f']}"])
        # konsistensi: jumlah kab/kota per provinsi vs total provinsi (nasional_download)
        sums = {}
        for (k, L), v in sip.items():
            s = sums.setdefault((k[0], L), [0, 0])
            s[0] += v["siswa"] or 0
            s[1] += v["rp"] or 0
        lap.append(f"konsistensi provinsi {year} (selisih = jumlah kab/kota - total provinsi):")
        nd = 0
        for pk, L in sorted(set(sums) | set(ptot)):
            a, b = sums.get((pk, L), [0, 0]), ptot.get((pk, L), (None, None))
            ds, dr = a[0] - (b[0] or 0), a[1] - (b[1] or 0)
            if ds or dr or b[0] is None:
                nd += 1
                lap.append(f"  {pk} {L}: siswa {a[0]} vs {b[0]} ({ds:+}); Rp {a[1]} vs {b[1]} ({dr:+})")
        lap.append(f"  pasangan (provinsi,jenjang) tak sama: {nd} dari {len(set(sums) | set(ptot))}")
    (DATA / "pip_gabung_laporan.txt").write_text("\n".join(lap) + "\n", encoding="utf8")
    print("\n".join(lap))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
