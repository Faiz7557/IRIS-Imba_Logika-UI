"""Cek cepat: python test_kkt.py  (tanpa framework)."""
import numpy as np
import edushield as e

rng = np.random.default_rng(7)
n = 60
V = rng.integers(50, 3000, n).astype(float)
rho = rng.uniform(0.003, 0.15, n)
c = rng.uniform(1.6, 2.2, n)
lo, hi = 0.2 * V, 0.95 * V
B = 0.55 * np.sum(c * V)

x, lam = e.kkt(V, rho, c, B, lo, hi)
assert abs(np.sum(c * x) - B) / B < 1e-9, "pagu tidak terpakai tepat"
assert np.all(x >= lo - 1e-9) and np.all(x <= hi + 1e-9), "batas dilanggar"

# optimalitas: tidak ada pemindahan kecil antar-wilayah yang menaikkan manfaat
best = e.benefit(x, V, rho)
for _ in range(2000):
    i, j = rng.choice(n, 2, replace=False)
    d = rng.uniform(0, 0.05) * V[i]
    y = x.copy(); y[i] += d; y[j] -= d * c[i] / c[j]
    if np.all(y >= lo) and np.all(y <= hi):
        assert e.benefit(y, V, rho) <= best + 1e-9, "KKT bukan optimum"

# syarat KKT: manfaat marjinal per rupiah = lambda di wilayah interior
inner = (x > lo + 1e-6) & (x < hi - 1e-6)
marg = rho * e.KAPPA * np.exp(-e.KAPPA * x / V) / c
assert np.allclose(marg[inner], lam, rtol=1e-6), "manfaat marjinal tidak setara"

df = e.load_data()
assert len(df) == 514 and not df.isna().any().any()
# ---- pembulatan kuota (TRD 4.1) pada skenario bawaan app_data.json
import json
D = json.load(open(e.ROOT / "app" / "app_data.json", encoding="utf8"))
Vd = np.array([d["V"] for d in D["kab"]], float); rd = np.array([d["r_hat"] for d in D["kab"]])
for share in (0.35, 0.55, 0.80):
    cd = np.full(len(Vd), e.C0); Bd = share * np.sum(cd * Vd); lod, hid = e.ALPHA * Vd, e.BETA * Vd
    xd, _ = e.kkt(Vd, rd, cd, Bd, lod, hid)
    q = e.round_quota(xd, Vd, rd, cd, Bd, lod, hid); z = q["z"]
    assert q["layak"] and not q["bentrok"] and not q["turun"]
    assert np.sum(cd * z) <= Bd + 1e-9 and abs(Bd - np.sum(cd * z) - q["sisa"]) < 1e-6
    assert np.all(z >= np.ceil(lod - 1e-9)) and np.all(z <= np.floor(hid + 1e-9))
    free = np.setdiff1d(np.arange(len(z)), q["turun"])
    # |z-x| < 1 hanya pasti bila tak ada wilayah terhambat batas atas (sisa pagu dari wilayah itu
    # dialihkan serakah ke wilayah lain, yang bisa naik >1 unit); pada kasus terhambat dilaporkan maksimumnya.
    dev = np.abs(z[free] - xd[free]).max()
    if share < 0.8:
        assert dev < 1, "|z-x| >= 1"
    else:
        assert dev < 5, dev; print(f"  (ada wilayah di batas atas; max|z-x|={dev:.3f})")
    # kondisi sisa yang benar: tidak ada wilayah yang masih bisa ditambah satu unit
    assert not np.any((z + 1 <= np.floor(hid + 1e-9)) & (cd <= q["sisa"] + 1e-9))
    if np.all(z + 1 <= np.floor(hid)):  # sisa < max c hanya pasti bila tidak ada wilayah terhambat batas atas
        assert q["sisa"] < cd.max()
    assert 0 <= q["loss_pct"] < 0.1, q["loss_pct"]
    print(f"round share={share}: sisa={q['sisa']:.3f} loss={q['loss']:.4f} ({q['loss_pct']:.5f}%)")

# uji tangan: 4 wilayah identik, x=2.5, B=10 -> z awal 2,2,2,2 sisa 2; seri -> indeks terkecil (0 lalu 1)
V4, r4, c4 = np.full(4, 10.0), np.full(4, 0.5), np.ones(4)
lo4, hi4, x4 = np.zeros(4), np.full(4, 10.0), np.full(4, 2.5)
q = e.round_quota(x4, V4, r4, c4, 10.0, lo4, hi4, 1.0)
assert list(q["z"]) == [3, 3, 2, 2] and abs(q["sisa"]) < 1e-12
# langkah 2: lo[0]=2.6 -> z0=3, jumlah 9 > B=8.5; kurangi wilayah seri terkecil di atas lantai (indeks 1); sisa 0,5 < c
lo4b = np.array([2.6, 0, 0, 0])
q = e.round_quota(x4, V4, r4, c4, 8.5, lo4b, hi4, 1.0)
assert list(q["z"]) == [3, 1, 2, 2] and q["turun"] == [1] and abs(q["sisa"] - 0.5) < 1e-12
# bentrok: ceil(lo)=3 > floor(hi)=2 -> batas atas menang, dilaporkan
q = e.round_quota(np.array([2.5]), np.array([10.0]), np.array([0.5]), np.ones(1), 5.0, np.array([2.2]), np.array([2.8]), 1.0)
assert list(q["z"]) == [2] and q["bentrok"] == [0]

# ---- nilai audit data (TRD 4.3)
from scipy.optimize import brentq
# nol bila delta = 0 (juga pada data acak di atas)
r0 = e.audit_value(V, rho, c, B, e.ALPHA, e.BETA, e.KAPPA, deltas=(0,), idx=np.arange(8))
assert np.all(np.abs(r0["A"]) < 1e-9), r0["A"]
# uji tangan 3 wilayah, solusi interior; xS dicari independen (brentq pada lambda), bukan lewat e.kkt
Vh, rh, ch, kh = np.array([100., 200., 300.]), np.array([.10, .12, .09]), np.ones(3), 1.0
Bh = 200.0; alh, beh = 0.01, 0.99
def solve_h(Vv):
    xf = lambda lam: Vv / kh * np.log(kh * rh / (lam * ch))
    lam = brentq(lambda l: np.sum(ch * xf(l)) - Bh, 1e-9, 1.0, xtol=1e-14)
    return xf(lam)
assert np.all(solve_h(Vh) > alh * Vh) and np.all(solve_h(Vh) < beh * Vh)
rh_ = e.audit_value(Vh, rh, ch, Bh, alh, beh, kh, deltas=(-0.25, 0.25))
xPh = solve_h(Vh)
for i in range(3):
    for j, d in enumerate((-0.25, 0.25)):
        V2 = Vh.copy(); V2[i] *= 1 + d
        want = e.benefit(solve_h(V2), V2, rh, kh) - e.benefit(np.minimum(xPh, beh * V2), V2, rh, kh)
        assert abs(rh_["L"][i, j] - want) < 1e-9, (i, d, rh_["L"][i, j], want)
assert np.all(rh_["A"] > 0) and np.allclose(rh_["A"], rh_["L"].mean(axis=1))
# skenario bawaan, tiga pagu: L(delta) >= -1e-9 untuk setiap i dan delta (lantai alpha*min(V,V') -> x~P layak)
for share in (0.35, 0.55, 0.80):
    cd = np.full(len(Vd), e.C0); Bd = share * np.sum(cd * Vd)
    ra = e.audit_value(Vd, rd, cd, Bd, e.ALPHA, e.BETA, e.KAPPA)
    assert ra["L"].min() >= -1e-9 and ra["A"].min() >= -1e-9 and len(ra["A"]) == 514, (share, ra["L"].min())
    print(f"audit share={share}: min L={ra['L'].min():.6f}, min A={ra['A'].min():.4f}, sum A={ra['A'].sum():.2f}")
cd = np.full(len(Vd), e.C0); Bd = e.SHARE * np.sum(cd * Vd)
ra = e.audit_value(Vd, rd, cd, Bd, e.ALPHA, e.BETA, e.KAPPA)
fx = json.load(open(e.ROOT / "app" / "audit_fixtures.json"))[0]
assert np.allclose(fx["A"], ra["A"], atol=1e-9)  # fixture sinkron dengan fungsi

# ---- interval konformal (TRD 4.2): skor i.i.d. -> cakupan ~ 0,90 pada data uji baru
rc = np.random.default_rng(11)
def _sim(n):
    rt = rc.uniform(0.005, 0.15, n)
    return rt, e._expit(e._logit(rt) + rc.normal(0, 0.5, n))  # prediksi = benar + galat logit N(0, 0.5)
covs = []
for _ in range(40):
    rt, rp = _sim(2000); ci = e.conformal_interval(rt, rp, a=0.10)
    rt2, rp2 = _sim(2000); lo2, hi2 = e.apply_interval(rp2, ci["q"])
    covs.append(np.mean((rt2 >= lo2) & (rt2 <= hi2)))
assert abs(np.mean(covs) - 0.90) < 0.01 and np.mean(covs) >= 0.895, np.mean(covs)  # >= 1-a secara rata-rata (galat MC kecil)
assert all(0.85 < c < 0.95 for c in covs)  # sd binomial ~ 0,007 + galat q; batas lebar wajar
# sifat
rt, rp = _sim(500)
c10, c05 = e.conformal_interval(rt, rp, a=0.10), e.conformal_interval(rt, rp, a=0.05)
assert np.all(c10["lo"] <= rp) and np.all(rp <= c10["hi"]) and np.all(c10["lo"] > 0) and np.all(c10["hi"] < 1)
assert c05["q"] > c10["q"] and np.all(c05["hi"] - c05["lo"] > c10["hi"] - c10["lo"])
# indeks kuantil eksplisit: n=9, a=0.1 -> k=ceil(10*0.9)=9 (maks); n=8 -> k=ceil(8.1)=9>8 -> inf
assert e._qhat(np.arange(1., 10.), 0.1) == 9.0 and np.isinf(e._qhat(np.arange(1., 9.), 0.1))
cg = e.conformal_interval(rt, rp, groups=np.arange(500) % 2, per_group=True)
assert set(cg["q_gugus"]) == {0, 1} and np.all(cg["lo"] <= rp)

# ---- M4: kalibrasi DGP + replay tingkat data 3
assert e.TARGET_DO == 0.0086
Vf = df.V.to_numpy()
R1, R2 = e.replay(df, 3), e.replay(df, 3)
assert R1 == R2, "replay tidak deterministik"
assert R1["label"] == "simulasi" and R1["n_wilayah"] == 514 and "bukan efek kausal" in R1["catatan"]
assert set(R1["skema"]) == {"merata", "kemiskinan", "greedy", "proporsional", "edushield"}
assert abs(R1["rata_laju_t1"] - e.TARGET_DO) < 1e-6
rg = np.random.default_rng(5)
r_t, _, r_t1 = e.dgp_pair(df, rg)
assert abs(np.average(r_t, weights=Vf) - e.TARGET_DO) < 1e-6 and abs(np.average(r_t1, weights=Vf) - e.TARGET_DO) < 1e-6
rho_ = np.corrcoef(r_t, r_t1)[0, 1]
assert 0 < rho_ < 1, rho_
r_d, _, _ = e.dgp(df, np.random.default_rng(5))
assert abs(np.average(r_d, weights=Vf) - e.TARGET_DO) < 1e-6   # default dgp kini 0,86%

# ---- M5: skema aktual (angka tangan; sama dengan test_app.cjs)
import pandas as pd
dfa = pd.DataFrame(dict(V=[100., 50., 10., 40.], pip_sma=[30., 20., 20., 0.], pip_smk=[10., 10., 0., 0.]))
ca = np.array([1., 1., 2., 1.]); Ba = 80.0
xa, sisa = e.scheme_actual(dfa, ca, Ba)
# w=[40,30,20,0]; skala=80/(40+30+40)=0.7272..; x=[29.09,21.82,14.55,0]; dipotong ke V -> x2=10 (V=10)
assert np.allclose(xa, [80 * 40 / 110, 80 * 30 / 110, 10., 0.]) and abs(sisa - (80 - (80 * 70 / 110 + 20))) < 1e-9
xb, sb = e.scheme_actual(dfa, np.ones(4), 100.0)   # kasus yang sama di test_app.cjs
assert np.allclose(xb, [400 / 9, 100 / 3, 10, 0]) and abs(sb - 110 / 9) < 1e-12
assert e.scheme_actual(dfa.drop(columns="pip_smk"), ca, Ba) is None
assert e.scheme_actual(dfa.assign(pip_sma=[1, np.nan, 1, 1]), ca, Ba) is None
if "pip_sma" in df:
    ca2 = np.full(len(df), e.C0); xa2, sisa2 = e.scheme_actual(df, ca2, e.SHARE * np.sum(ca2 * Vf))
    assert np.all(xa2 >= 0) and np.all(xa2 <= Vf + 1e-9) and sisa2 >= -1e-6
    assert "aktual" in e.replay(df, 3, aktual=True)["skema"] and "aktual" not in R1["skema"]

# M6/F10: kind="extreme" menambah z2 dan z_remote; pilihan lama tak berubah
if "remote" in df:
    Xf, Xx = e.features(df), e.features(df, kind="extreme")
    assert list(Xx.columns) == list(Xf.columns) + ["z2", "z_remote"]
    assert np.allclose(Xx[Xf.columns].to_numpy(), Xf.to_numpy())
    assert np.allclose(Xx.z2, Xx.z ** 2) and np.allclose(Xx.z_remote, Xx.z * df.remote.astype(float))
    assert list(e.features(df, kind="poverty").columns) == ["const", "z"]
    assert list(e.features(df, np.full(len(df), 0.01)).columns)[-1] == "lag"

print("ok")
