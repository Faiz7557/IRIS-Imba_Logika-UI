"""Bangun app/geo.js (EDU_GEO) + data/crosswalk_kab.csv dari GeoJSON 514 kab/kota. Gagal (exit 1) bila padanan tak sempurna."""
import csv, json, re, sys
from pathlib import Path
from shapely.geometry import shape, Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).parent
GEOJ = ROOT / "data/raw/geo/mapIndonesia514-opt.geojson"
SUMBER = ROOT / "data/raw/geo/mapIndonesia514-opt.geojson.sumber.txt"
TOL = 0.01
MIN_AREA = 0.005     # derajat^2 (~120 km2); pulau lebih kecil dibuang kecuali satu-satunya poligon
LON0, LON1, LAT0, LAT1 = 94.3, 141.8, -11.7, 6.8   # batas data + margin kecil; skala seragam (sx=sy), dipusatkan di 1000x380

def norm(name):  # salinan edushield._norm
    n = name.split(" / ")[0].lower().replace("kep. ", "kepulauan ").replace("makasar", "makassar")
    return re.sub(r"\s+", "", n)

# provinsi GeoJSON (kunci = provinceID) -> himpunan provinsi aplikasi kandidat
PROV_MAP = {  # ponytail: ID dipakai, bukan label, karena label provinceID 34 keliru ("Jawa Timur" untuk DIY)
    11: ["ACEH"], 12: ["SUMATERA UTARA"], 13: ["SUMATERA BARAT"], 14: ["RIAU"], 15: ["JAMBI"],
    16: ["SUMATERA SELATAN"], 17: ["BENGKULU"], 18: ["LAMPUNG"], 19: ["KEP. BANGKA BELITUNG"],
    21: ["KEPULAUAN RIAU"], 31: ["DKI JAKARTA"], 32: ["JAWA BARAT"], 33: ["JAWA TENGAH"],
    34: ["D I YOGYAKARTA"], 35: ["JAWA TIMUR"], 36: ["BANTEN"], 51: ["BALI"], 52: ["NUSA TENGGARA BARAT"],
    53: ["NUSA TENGGARA TIMUR"], 61: ["KALIMANTAN BARAT"], 62: ["KALIMANTAN TENGAH"],
    63: ["KALIMANTAN SELATAN"], 64: ["KALIMANTAN TIMUR"], 65: ["KALIMANTAN UTARA"], 71: ["SULAWESI UTARA"],
    72: ["SULAWESI TENGAH"], 73: ["SULAWESI SELATAN"], 74: ["SULAWESI TENGGARA"], 75: ["GORONTALO"],
    76: ["SULAWESI BARAT"], 81: ["MALUKU"], 82: ["MALUKU UTARA"],
    91: ["PAPUA BARAT", "PAPUA BARAT DAYA"],                                   # Papua Barat lama dipecah
    94: ["PAPUA", "PAPUA SELATAN", "PAPUA TENGAH", "PAPUA PEGUNUNGAN"],      # Papua lama dipecah
}
MULTI = {91, 94}
# alias nama GeoJSON (ternormalkan) -> nama aplikasi (ternormalkan), kunci (provinceID, nama)
ALIAS = {  # (provinceID, nama GeoJSON ternormalkan) -> nama aplikasi
    (61, "pontianak"): "Mempawah",        # Kab. Pontianak berganti nama Kab. Mempawah (2014); Kota Pontianak terpisah
    (64, "mahakamhulu"): "Mahakam Ulu",   # ejaan "Hulu" vs "Ulu"
    (72, "tolitoli"): "Toli-Toli",        # tanda hubung
    (72, "tojounauna"): "Tojo Una-Una",   # tanda hubung
    (94, "nduga*"): "Nduga",              # tanda bintang di GeoJSON
}

def main():
    app = json.load(open(ROOT / "app/app_data.json", encoding="utf-8"))["kab"]
    feats = json.load(open(GEOJ, encoding="utf-8"))["features"]
    idx = {}
    for a in app:
        idx.setdefault((a["prov"], norm(a["nama"])), []).append(a)
    match, err = {}, []   # id -> (feature, aturan)
    for f in feats:
        p = f["properties"]; pid = p["provinceID"]; nm = norm(ALIAS.get((pid, norm(p["district"])), p["district"]))
        hits = [a for pv in PROV_MAP[pid] for a in idx.get((pv, nm), [])]
        if len(hits) != 1:
            err.append(f"{p['district']} | {p['province']} {pid}: {len(hits)} padanan"); continue
        a = hits[0]
        if a["id"] in match:
            err.append(f"ganda: {a['nama']} {a['prov']}"); continue
        rule = "alias" if (pid, norm(p["district"])) in ALIAS else ("provinsi dipetakan" if pid in MULTI or p["province"] != a["prov"].title() and pid == 34 else "nama persis")
        match[a["id"]] = (f, a, rule)
    err += [f"tanpa geometri: {a['nama']} {a['prov']}" for a in app if a["id"] not in match]
    if err:
        print("\n".join(err)); sys.exit(1)

    W, H = 1000, 380
    k = min(W / (LON1 - LON0), H / (LAT1 - LAT0)); ox = (W - k * (LON1 - LON0)) / 2
    proj = lambda x, y: (ox + (x - LON0) * k, (LAT1 - y) * k)
    paths, bps = {}, {}
    for i, (f, a, _) in match.items():
        g = shape(f["geometry"]); parts = list(g.geoms) if g.geom_type == "MultiPolygon" else [g]
        big = [q for q in parts if q.area >= MIN_AREA] or [max(parts, key=lambda q: q.area)]
        d = []
        for q in big:
            q = q.simplify(min(TOL, q.area ** 0.5 / 4), preserve_topology=True)  # poligon kecil tidak runtuh
            for r in ([q] if q.geom_type == "Polygon" else list(q.geoms)):
                if r.is_empty: continue
                pts = [proj(*c) for c in r.exterior.coords[:-1]]
                if len(pts) >= 3:
                    d.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")
        paths[i] = "".join(d); bps[i] = str(f["properties"]["districtID"])
    src = SUMBER.read_text(encoding="utf-8").strip()
    out = dict(viewBox=f"0 0 {W} {H}", sumber=src, lisensi="MIT menurut README repositori quarcs-lab/indonesia514; tidak ada berkas LICENSE; sumber data dan tahun batas wilayah tidak disebut oleh repositori.",
               tanggal_akses="2026-11-16", batas=dict(bujur=[LON0, LON1], lintang=[LAT0, LAT1]), toleransi_dp_derajat=TOL,
               paths=paths, kode_bps=bps, tidak_cocok=[])
    (ROOT / "app/geo.js").write_text("window.EDU_GEO = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    with open(ROOT / "data/crosswalk_kab.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh); w.writerow(["id", "nama_aplikasi", "provinsi_aplikasi", "kode_bps", "nama_geojson", "provinsi_geojson", "aturan"])
        for i, (f, a, rule) in match.items():
            p = f["properties"]; w.writerow([i, a["nama"], a["prov"], bps[i], p["district"], p["province"], rule])
    print("ok", len(paths), (ROOT / "app/geo.js").stat().st_size)

main()
