"""Self-check app/geo.js: python edushield/test_geo.py"""
import json
from pathlib import Path
R = Path(__file__).parent
s = (R / "app/geo.js").read_text(encoding="utf-8")
g = json.loads(s.split("=", 1)[1].strip().rstrip(";"))
ids = {a["id"] for a in json.load(open(R / "app/app_data.json", encoding="utf-8"))["kab"]}
assert set(g["paths"]) == ids and len(ids) == 514
assert g["tidak_cocok"] == []
assert all(p.startswith("M") and "Z" in p for p in g["paths"].values())
assert len(s.encode()) < 600_000, len(s)
k = g["kode_bps"]
assert set(k) == ids and all(len(v) == 4 and v.isdigit() for v in k.values()) and len(set(k.values())) == 514
assert g["sumber"] and g["lisensi"] and g["viewBox"] == "0 0 1000 380"
print("geo ok", len(s), "bytes")
