"""EduShield v2: studi semi-sintetis prediksi laju putus sekolah + alokasi kuota PIP (KKT water-filling).

Kovariat NYATA (BPS): persentase penduduk miskin 2025, penduduk total & usia 15-19 tahun 2026.
Outcome (putus sekolah) DISIMULASIKAN dengan DGP pada dgp(); bentuknya sengaja berbeda dari model prediksi.

Jalankan: python edushield.py [n_seeds]  -> results/summary.json, results/kabkota.csv
"""
import json, re, sys
from pathlib import Path
import numpy as np, pandas as pd
import statsmodels.api as sm
from scipy.stats import spearmanr
from sklearn.metrics import roc_auc_score

ROOT = Path(__file__).parent
RAW, OUT = ROOT / "data" / "raw", ROOT / "results"
C0 = 1.8            # biaya per kuota, juta rupiah
SHARE = 0.55        # pagu = 55% dari siswa rentan
ALPHA, BETA = 0.20, 0.95
# Target kalibrasi DGP: BPS, Statistik Pendidikan 2025, Tabel 5.1 (Susenas Maret 2025), angka putus sekolah
# SMA/SMK sederajat 0,86% (hlm PDF 178; definisi hlm 163). Tingkat data 3: outcome tetap simulasi.
TARGET_DO = 0.0086
KAPPA = 1.74       # dikalibrasi: efek rata-rata per penerima PIP SMA = 2,8 pp (Listiyanto & Qibthiyyah, 2022)
REGION = {
    "Sumatera": ["ACEH", "SUMATERA UTARA", "SUMATERA BARAT", "RIAU", "JAMBI", "SUMATERA SELATAN",
                 "BENGKULU", "LAMPUNG", "KEP. BANGKA BELITUNG", "KEPULAUAN RIAU"],
    "Jawa-Bali": ["DKI JAKARTA", "JAWA BARAT", "JAWA TENGAH", "D I YOGYAKARTA", "JAWA TIMUR", "BANTEN", "BALI"],
    "Nusa Tenggara": ["NUSA TENGGARA BARAT", "NUSA TENGGARA TIMUR"],
    "Kalimantan": ["KALIMANTAN BARAT", "KALIMANTAN TENGAH", "KALIMANTAN SELATAN", "KALIMANTAN TIMUR", "KALIMANTAN UTARA"],
    "Sulawesi": ["SULAWESI UTARA", "SULAWESI TENGAH", "SULAWESI SELATAN", "SULAWESI TENGGARA", "GORONTALO", "SULAWESI BARAT"],
    "Maluku-Papua": ["MALUKU", "MALUKU UTARA", "PAPUA BARAT", "PAPUA BARAT DAYA", "PAPUA", "PAPUA SELATAN",
                     "PAPUA TENGAH", "PAPUA PEGUNUNGAN"],
}
PROV2REG = {p: r for r, ps in REGION.items() for p in ps}


# ---------------------------------------------------------------- data nyata
def _rows(path):
    line = [l for l in path.read_text(encoding="utf8").splitlines() if l and not l.startswith("#")][0]
    prov = None
    for item in line.split(";"):
        name, *vals = item.split("|")
        if name.isupper():
            prov = name
            continue
        yield prov, name, vals


def _norm(name):
    n = name.split(" / ")[0].lower().replace("kep. ", "kepulauan ").replace("makasar", "makassar")
    return re.sub(r"\s+", "", n)


def load_data():
    pop = {(p, _norm(n)): (int(v[0]), int(v[1])) for p, n, v in _rows(RAW / "population_2026.txt")}
    rec = []
    for p, n, v in _rows(RAW / "poverty_p0_2025.txt"):
        tot, y = pop[(p, _norm(n))]          # KeyError = nama tak cocok, sengaja dibiarkan gagal
        rec.append(dict(prov=p, name=n, region=PROV2REG[p], kota=n.startswith("Kota "),
                        p0=float(v[0].replace(",", ".")), pop=tot, pop1519=y))
    df = pd.DataFrame(rec)
    df["youth"] = df.pop1519 / df["pop"]
    # siswa rentan inti V: usia 16-18 (3/5 dari 15-19) x APS 16-18 nasional 74% x porsi miskin
    df["V"] = (0.6 * df.pop1519 * 0.74 * df.p0 / 100).round().clip(lower=10)
    df["remote"] = df.region.isin(["Nusa Tenggara", "Maluku-Papua"])
    return _add_kode_pip(df)


def _add_kode_pip(df):
    """M0: tambah kode_bps (crosswalk_kab.csv) dan pip_sma/pip_smk (siswa disalurkan 2025, pip_kab_2025.csv).
    Wilayah tanpa data -> NaN (bukan 0). Kolom lain tidak berubah."""
    cw = ROOT / "data" / "crosswalk_kab.csv"
    if not cw.exists():
        return df
    c = pd.read_csv(cw, dtype={"kode_bps": str})
    kode = dict(zip(zip(c.provinsi_aplikasi, c.nama_aplikasi), c.kode_bps))
    df["kode_bps"] = [kode.get(k) for k in zip(df.prov, df.name)]
    pf = ROOT / "data" / "pip_kab_2025.csv"
    if pf.exists():
        p = pd.read_csv(pf, dtype={"kode_bps": str}).set_index("kode_bps")
        df["pip_sma"] = df.kode_bps.map(p.sma_siswa).astype(float)
        df["pip_smk"] = df.kode_bps.map(p.smk_siswa).astype(float)
    return df


# ---------------------------------------------------------------- DGP (simulasi)
def dgp(df, rng, target=TARGET_DO):
    """Laju putus sekolah benar r_i. Komponen yang TIDAK dilihat model: ambang kemiskinan 15%,
    interaksi terpencil x kemiskinan, efek acak provinsi, dan galat wilayah."""
    z = (df.p0 - df.p0.mean()) / df.p0.std()
    zy = (df.youth - df.youth.mean()) / df.youth.std()
    u = df.prov.map({p: rng.normal(0, 0.25) for p in df.prov.unique()})
    eta = (0.30 * z + 0.30 * np.maximum(0, (df.p0 - 15) / 10) + 0.15 * df.remote
           + 0.10 * df.remote * z - 0.20 * df.kota + 0.10 * zy + u + rng.normal(0, 0.20, len(df)))
    lo, hi = -10.0, 5.0
    for _ in range(100):                      # kalibrasi intersep: rerata tertimbang V = target
        mu = (lo + hi) / 2
        r = 1 / (1 + np.exp(-(mu + eta)))
        lo, hi = (mu, hi) if np.average(r, weights=df.V) < target else (lo, mu)
    r = r.to_numpy()
    V = df.V.to_numpy().astype(int)
    lag = rng.binomial(V, np.clip(r * np.exp(rng.normal(0, 0.10, len(r))), 0, 1)) / V
    obs = rng.binomial(V, r) / V
    return r, obs, lag


# ---------------------------------------------------------------- prediksi laju (out-of-province)
def features(df, lag=None, kind="full"):
    X = pd.DataFrame({"z": (df.p0 - df.p0.mean()) / df.p0.std()})
    if kind in ("full", "extreme"):
        X["zy"] = (df.youth - df.youth.mean()) / df.youth.std()
        X["kota"] = df.kota.astype(float)
        for g in ["Jawa-Bali", "Nusa Tenggara", "Kalimantan", "Sulawesi", "Maluku-Papua"]:
            X[g] = (df.region == g).astype(float)
        if lag is not None:
            X["lag"] = np.log((lag + 0.005) / (1 - lag + 0.005))
    if kind == "extreme":   # F10 percobaan 1: suku umum (kuadrat kemiskinan, kemiskinan x terpencil), tanpa kode DGP
        X["z2"] = X.z ** 2
        X["z_remote"] = X.z * df.remote.astype(float)
    return sm.add_constant(X)


def province_folds(df, rng, k=5):
    provs = rng.permutation(df.prov.unique())
    fold = {p: i % k for i, p in enumerate(provs)}
    return df.prov.map(fold).to_numpy()


def oof_glm(df, obs, X, folds):
    """GLM binomial (logit) pada proporsi teramati, bobot V; prediksi provinsi yang disembunyikan."""
    pred = np.empty(len(df))
    for f in np.unique(folds):
        tr, te = folds != f, folds == f
        m = sm.GLM(obs[tr], X[tr], family=sm.families.Binomial(), var_weights=df.V[tr]).fit()
        pred[te] = m.predict(X[te])
    return pred


def oof_lgbm(df, obs, X, folds, seed=0):
    import lightgbm as lgb
    pred = np.empty(len(df))
    for f in np.unique(folds):
        tr, te = folds != f, folds == f
        m = lgb.LGBMRegressor(objective="cross_entropy", n_estimators=300, learning_rate=0.03,
                              num_leaves=8, min_child_samples=15, random_state=seed, verbose=-1)
        m.fit(X[tr], obs[tr], sample_weight=df.V[tr])
        pred[te] = m.predict(X[te])
    return pred


def oof_redprob(df, X, folds, red):
    """Peluang Zona Merah (klasifikasi) -- hanya untuk mereplikasi rumus lama rho = r_hat * p_hat."""
    from sklearn.linear_model import LogisticRegression
    pred = np.empty(len(df))
    for f in np.unique(folds):
        tr, te = folds != f, folds == f
        m = LogisticRegression(C=10, max_iter=2000).fit(X[tr], red[tr])
        pred[te] = m.predict_proba(X[te])[:, 1]
    return pred


def pred_metrics(r, pred, V, red):
    lr, lp = np.log(r / (1 - r)), np.log(pred / (1 - pred))
    return dict(mae_pp=float(np.average(np.abs(pred - r), weights=V) * 100),
                spearman=float(spearmanr(pred, r).correlation),
                calib_slope=float(np.polyfit(lp, lr, 1)[0]), auc_red=float(roc_auc_score(red, pred)))


# ---------------------------------------------------------------- manfaat & alokasi
def benefit(x, V, r, kappa=KAPPA, shape="exp"):
    t = x / V
    if shape == "exp":
        return float(np.sum(V * r * (1 - np.exp(-kappa * t))))
    if shape == "power":                       # cekung, tanpa jenuh eksponensial
        return float(np.sum(V * r * (1 - np.exp(-KAPPA)) * t ** 0.5))
    if shape == "log":
        return float(np.sum(V * r * (1 - np.exp(-KAPPA)) * np.log1p(kappa * t) / np.log1p(kappa)))
    raise ValueError(shape)


def kkt(V, rho, c, B, lo, hi, kappa=KAPPA):
    """Water-filling: x_i = clip((V_i/k) ln(k rho_i / (lam c_i)), lo_i, hi_i), lam lewat bagi-dua (Persamaan L3)."""
    kappa = np.broadcast_to(kappa, V.shape)
    rho = np.maximum(rho, 1e-12)

    def x_of(lam):
        return np.clip(V / kappa * np.log(kappa * rho / (lam * c)), lo, hi)

    a, b = np.log(1e-12), np.log(np.max(kappa * rho / c))
    for _ in range(200):
        m = (a + b) / 2
        a, b = (m, b) if np.sum(c * x_of(np.exp(m))) > B else (a, m)
    lam = np.exp(b)
    return x_of(lam), lam


def fill_by_order(order, V, c, B, lo, hi):
    """Isi kuota sampai batas atas mengikuti urutan prioritas (greedy / peringkat kemiskinan)."""
    x = lo.copy()
    left = B - np.sum(c * x)
    for i in order:
        add = min(hi[i] - x[i], left / c[i])
        x[i] += add
        left -= add * c[i]
        if left <= 1e-9:
            break
    return x


def proportional(w, c, B, lo, hi):
    a, b = 0.0, 1e6
    for _ in range(200):
        m = (a + b) / 2
        a, b = (m, b) if np.sum(c * np.clip(m * w, lo, hi)) < B else (a, m)
    return np.clip(b * w, lo, hi)


def schemes(df, rho, c, B, kappa_opt=KAPPA):
    V = df.V.to_numpy()
    lo, hi = ALPHA * V, BETA * V
    return {
        "Merata": B / np.sum(c * V) * V,
        "Peringkat kemiskinan": fill_by_order(np.argsort(-df.p0.to_numpy()), V, c, B, lo, hi),
        "Greedy (risiko tertinggi)": fill_by_order(np.argsort(-rho), V, c, B, lo, hi),
        "Proporsional risiko": proportional(V * rho, c, B, lo, hi),
        "EduShield (KKT)": kkt(V, rho, c, B, lo, hi, kappa_opt)[0],
    }


def round_quota(x, V, rho, c, B, lo, hi, kappa=KAPPA):
    """Pembulatan kuota kontinu x ke bilangan bulat (TRD 4.1). Ditulis ulang di app/kkt.js (roundQuota).

    1. z = max(ceil(lo), floor(x)), dibatasi floor(hi). Bila ceil(lo) > floor(hi) batas atas menang
       (z = floor(hi)) dan wilayah dicatat di 'bentrok'.
    2. Bila sisa < 0: kurangi satu unit dari wilayah z > zlo dengan manfaat marjinal per rupiah
       (unit terakhir) terendah, sampai sisa >= 0.
    3. Selama ada wilayah z+1 <= floor(hi) dan c <= sisa: tambah satu unit ke wilayah dengan
       [b(z+1)-b(z)]/c terbesar (alokasi marjinal serakah; Federgruen & Groenevelt 1986).
    Seri (nilai persis sama): indeks terkecil menang, sama di JS dan Python.
    Akibatnya sisa < c_i hanya dijamin untuk wilayah yang belum menyentuh floor(hi)
    (sisa < max c tidak pasti bila ada wilayah terhambat batas atas).
    """
    EPS = 1e-9
    x, V, rho, c, lo, hi = (np.asarray(a, float) for a in (x, V, rho, c, lo, hi))
    zhi = np.floor(hi + EPS)
    zlo0 = np.ceil(lo - EPS)
    zlo = np.minimum(zlo0, zhi)
    bentrok = np.flatnonzero(zlo0 > zhi)
    z = np.minimum(np.maximum(zlo, np.floor(x + EPS)), zhi)

    def gain(i, k):  # manfaat unit ke-k wilayah i, per rupiah
        return V[i] * rho[i] * (np.exp(-kappa * (k - 1) / V[i]) - np.exp(-kappa * k / V[i])) / c[i]

    sisa = B - float(np.sum(c * z))
    turun = set()
    while sisa < -EPS:
        cand = np.flatnonzero(z > zlo)
        if len(cand) == 0:
            break  # tidak layak: sum(c*zlo) > B
        i = min(cand, key=lambda j: (gain(j, z[j]), j))
        z[i] -= 1
        sisa += c[i]
        turun.add(int(i))
    layak = sisa >= -EPS
    sisa = max(sisa, 0.0) if layak else sisa
    g = np.array([gain(i, z[i] + 1) if z[i] + 1 <= zhi[i] else -1.0 for i in range(len(z))])
    while True:
        ok = (z + 1 <= zhi) & (c <= sisa + EPS)
        if not ok.any():
            break
        i = int(np.argmax(np.where(ok, g, -np.inf)))  # argmax: seri -> indeks terkecil
        z[i] += 1
        sisa -= c[i]
        g[i] = gain(i, z[i] + 1) if z[i] + 1 <= zhi[i] else -1.0
    if layak:
        sisa = max(sisa, 0.0)
    bx, bz = benefit(x, V, rho, kappa), benefit(z, V, rho, kappa)
    return dict(z=z.astype(int), sisa=float(sisa), loss=bx - bz, loss_pct=100 * (bx - bz) / bx,
                turun=sorted(turun), bentrok=[int(i) for i in bentrok], layak=bool(layak))


def write_round_fixtures():
    """Tulis app/round_fixtures.json saja (tidak menyentuh data.js, app_data.json, results/*)."""
    D = json.loads((ROOT / "app" / "app_data.json").read_text(encoding="utf8"))
    V = np.array([d["V"] for d in D["kab"]], float)
    rho = np.array([d["r_hat"] for d in D["kab"]])
    lo, hi = ALPHA * V, BETA * V
    out = []
    for share, remote in [(0.35, 0), (0.55, 0), (0.80, 0), (0.55, 0.15)]:
        c = np.array([C0 * (1 + remote if d["remote"] else 1) for d in D["kab"]])
        B = share * float(np.sum(c * V))
        x, _ = kkt(V, rho, c, B, lo, hi)
        r = round_quota(x, V, rho, c, B, lo, hi)
        out.append(dict(share=share, remote=remote, B=B, x=x.tolist(), z=r["z"].tolist(), sisa=r["sisa"],
                        loss=r["loss"], loss_pct=r["loss_pct"], turun=r["turun"], bentrok=r["bentrok"]))
    (ROOT / "app" / "round_fixtures.json").write_text(json.dumps(out), encoding="utf8")


def audit_value(V, rho, c, B, alpha, beta, kappa, deltas=(-0.25, 0.25), idx=None):
    """Nilai audit data (TRD 4.3). Ditulis ulang di app/kkt.js (auditValue/auditAll).

    Untuk tiap wilayah i dan galat delta: V' = V dengan V'_i = V_i(1+delta); xP = kkt(V) (sekali saja),
    xS = kkt(V') dengan lantai lo' = alpha min(V, V') dan atap beta V', xt = min(xP, beta V'); L_i(delta) = b(xS; V') - b(xt; V'); A_i = rata-rata L_i atas deltas.
    rho = laju yang diyakini perencana. Lantai alpha min(V, V') membuat xt selalu layak bagi xS, jadi L >= 0
    (optimalitas); lantai alpha V' membuat L negatif (artefak kendala). Keluaran: dict(A, L[len(idx), len(deltas)], idx, xP).
    """
    V, rho, c = (np.asarray(a, float) for a in (V, rho, c))
    idx = np.arange(len(V)) if idx is None else np.asarray(idx, int)
    xP, _ = kkt(V, rho, c, B, alpha * V, beta * V, kappa)
    L = np.zeros((len(idx), len(deltas)))
    for a, i in enumerate(idx):
        for b, d in enumerate(deltas):
            V2 = V.copy(); V2[i] *= 1 + d
            xS, _ = kkt(V2, rho, c, B, alpha * np.minimum(V, V2), beta * V2, kappa)
            L[a, b] = benefit(xS, V2, rho, kappa) - benefit(np.minimum(xP, beta * V2), V2, rho, kappa)
    return dict(A=L.mean(axis=1), L=L, idx=idx, xP=xP)


def write_audit_fixtures():
    """Tulis app/audit_fixtures.json saja: A (514 wilayah) pada skenario bawaan; 30 wilayah pertama pada share 0,35 dan 0,80."""
    D = json.loads((ROOT / "app" / "app_data.json").read_text(encoding="utf8"))
    V = np.array([d["V"] for d in D["kab"]], float)
    rho = np.array([d["r_hat"] for d in D["kab"]])
    c = np.full(len(V), C0)
    out = []
    for share, n in [(0.55, len(V)), (0.35, 30), (0.80, 30)]:
        B = share * float(np.sum(c * V))
        r = audit_value(V, rho, c, B, ALPHA, BETA, KAPPA, idx=np.arange(n))
        out.append(dict(share=share, B=B, n=n, A=r["A"].tolist(), L=r["L"].tolist()))
    (ROOT / "app" / "audit_fixtures.json").write_text(json.dumps(out), encoding="utf8")


def _logit(p):
    p = np.clip(np.asarray(p, float), 1e-12, 1 - 1e-12)
    return np.log(p / (1 - p))


def _expit(z):
    return 1 / (1 + np.exp(-z))


def _qhat(s, a):
    """Kuantil konformal: statistik urutan ke-k, k = ceil((n+1)(1-a)); k > n -> inf (interval tak terbatas)."""
    n = len(s)
    k = int(np.ceil(round((n + 1) * (1 - a), 9)))
    return np.inf if k > n else float(np.sort(s)[k - 1])


def apply_interval(r_pred, q, groups=None):
    """Interval expit(logit(r_pred) +- q); q skalar, atau dict {gugus: q} bersama groups."""
    qv = np.array([q[g] for g in groups]) if isinstance(q, dict) else q
    z = _logit(r_pred)
    return _expit(z - qv), _expit(z + qv)


def conformal_interval(r_true, r_pred, groups=None, a=0.10, per_group=False):
    """Interval prediksi konformal (TRD 4.2) pada skala logit.

    r_true: laju yang dicakup. Pada tingkat data 3 = laju BENAR simulasi r dari dgp (bukan obs: obs bisa 0,
    logit tak terhingga, dan obs adalah laju + galat binomial, bukan sasaran prediksi). Bila ada laju teramati
    (tingkat 1-2), panggil dengan laju teramati. r_pred: prediksi out-of-fold (lipatan provinsi).
    Skor s_i = |logit r_i - logit rhat_i|; q = statistik urutan ke-ceil((n+1)(1-a)) (bukan interpolasi);
    bila indeks > n, q = inf dan dicatat di 'catatan'. per_group=True: q dihitung per gugus; jaminan per gugus
    hanya bila n gugus cukup besar (n < 1/a - 1 memberi q = inf), selain itu hanya rata-rata.
    Keluaran: dict(q, q_gugus, lo, hi, cakupan_empiris, per_gugus {gugus: cakupan}, n, catatan).
    Cakupan di sini in-sample (pada titik kalibrasi); cakupan jujur: lihat write_interval_summary."""
    r_true, r_pred = np.asarray(r_true, float), np.asarray(r_pred, float)
    s = np.abs(_logit(r_true) - _logit(r_pred))
    g = None if groups is None else np.asarray(groups)
    catatan = []
    q_g = None
    if per_group:
        assert g is not None, "per_group butuh groups"
        q_g = {k: _qhat(s[g == k], a) for k in np.unique(g)}
        q = q_g
        catatan += [f"q=inf untuk gugus {k} (n={int((g == k).sum())} terlalu kecil)" for k, v in q_g.items() if np.isinf(v)]
    else:
        q = _qhat(s, a)
        if np.isinf(q):
            catatan.append("q=inf: ceil((n+1)(1-a)) > n")
    lo, hi = apply_interval(r_pred, q, g)
    ok = (r_true >= lo) & (r_true <= hi)
    per = {} if g is None else {str(k): float(ok[g == k].mean()) for k in np.unique(g)}
    return dict(q=q if not per_group else None, q_gugus=q_g, lo=lo, hi=hi, cakupan_empiris=float(ok.mean()),
                per_gugus=per, n=len(s), catatan=catatan)


def write_interval_summary(n_seeds=30, a=0.10):
    """Uji cakupan jujur dan tulis results/conformal_summary.json (tidak menjalankan run()).

    Untuk seed s: kalibrasi q pada realisasi DGP seed s (prediksi OOF GLM tanpa riwayat terhadap r seed s).
    Uji: realisasi BARU seed 1000+s (efek acak provinsi dan galat wilayah baru, obs baru); model di-refit pada
    obs baru dengan lipatan provinsi (OOF), lalu interval dari q kalibrasi diterapkan pada prediksi baru dan
    dicek terhadap r baru. Refit dipilih karena itulah yang dilakukan pada data baru; menjaga prediksi lama
    akan menguji realisasi yang tidak bisa terjadi (prediksi tak terkait obs)."""
    df = load_data()
    X = features(df)
    g = df.region.to_numpy()
    gugus = sorted(set(g))
    cov, cov_pg, cov_q = [], [], []
    qs, q_gs = [], []
    for sd in range(n_seeds):
        folds = province_folds(df, np.random.default_rng(100 + sd))
        r0, o0, _ = dgp(df, np.random.default_rng(sd))
        r1, o1, _ = dgp(df, np.random.default_rng(1000 + sd))
        p0, p1 = oof_glm(df, o0, X, folds), oof_glm(df, o1, X, folds)
        cal = conformal_interval(r0, p0, g, a)
        calg = conformal_interval(r0, p0, g, a, per_group=True)
        lo, hi = apply_interval(p1, cal["q"])
        ok = (r1 >= lo) & (r1 <= hi)
        lo2, hi2 = apply_interval(p1, calg["q_gugus"], g)
        ok2 = (r1 >= lo2) & (r1 <= hi2)
        cov.append(ok.mean()); cov_q.append(ok2.mean())
        cov_pg.append([ok[g == k].mean() for k in gugus] + [ok2[g == k].mean() for k in gugus])
        qs.append(cal["q"]); q_gs.append([calg["q_gugus"][k] for k in gugus])
    cov_pg, q_gs = np.array(cov_pg), np.array(q_gs)
    st = lambda v: dict(mean=float(np.mean(v)), median=float(np.median(v)), p5=float(np.percentile(v, 5)), p95=float(np.percentile(v, 95)))
    nG = len(gugus)
    S = dict(metode="split-conformal-LOPO", nominal=1 - a, n_seed=n_seeds, n_wilayah=len(df),
             uji="kalibrasi pada realisasi DGP seed s; uji pada realisasi baru seed 1000+s (refit OOF pada obs baru)",
             q_global=st(qs), cakupan_global=st(cov), cakupan_q_per_gugus_global=st(cov_q),
             cakupan_per_gugus={k: st(cov_pg[:, i]) for i, k in enumerate(gugus)},
             cakupan_per_gugus_dengan_q_per_gugus={k: st(cov_pg[:, nG + i]) for i, k in enumerate(gugus)},
             q_per_gugus={k: st(q_gs[:, i]) for i, k in enumerate(gugus)},
             n_per_gugus={k: int((g == k).sum()) for k in gugus},
             catatan_batas=["Jaminan cakupan bersifat rata-rata (marginal), bukan per wilayah, dan bergantung pada pertukaran antarprovinsi.",
                            "Pada tingkat data 3 yang dicakup adalah laju simulasi, bukan laju nyata.",
                            "Skor berasal dari prediksi OOF lipatan provinsi (mendekati cross-conformal, bukan split murni): satu q dari skor yang tidak independen sepenuhnya; jaminan formal 1-2a untuk jackknife+/CV+ belum diverifikasi dari sumber.",
                            "Cakupan per gugus tidak dijamin; hanya cakupan rata-rata."])
    (OUT / "conformal_summary.json").write_text(json.dumps(S, indent=1, ensure_ascii=False), encoding="utf8")
    return S


def hold_harmless(df, rho, c, B, x0, years=5, cut=0.10):
    V = df.V.to_numpy()
    x, path = x0.copy(), []
    for _ in range(years):
        lo = np.maximum(ALPHA * V, (1 - cut) * x)
        x = kkt(V, rho, c, B, lo, BETA * V)[0]
        path.append(x.copy())
    return path


# ---------------------------------------------------------------- replay tingkat data 3 (M4)
PERSIST_SD, ANNUAL_SD = 0.15, float(np.sqrt(0.20**2 - 0.15**2))   # galat wilayah 0,20 dipecah: persisten 0,15 + tahunan ~0,132


def _calib_r(eta, V, target):
    """Intersep logit agar rerata tertimbang V = target (sama dengan dgp)."""
    lo, hi = -10.0, 5.0
    for _ in range(100):
        mu = (lo + hi) / 2
        r = 1 / (1 + np.exp(-(mu + eta)))
        lo, hi = (mu, hi) if np.average(r, weights=V) < target else (lo, mu)
    return np.asarray(r)


def dgp_pair(df, rng, target=TARGET_DO, persist_sd=PERSIST_SD, annual_sd=ANNUAL_SD):
    """Dua realisasi DGP berurutan (tahun t dan t+1), SIMULASI. Bentuk eta sama dengan dgp().
    Persisten (dipakai kedua tahun): efek acak provinsi u (sd 0,25) dan galat wilayah persisten (sd persist_sd=0,15).
    Baru tiap tahun: galat wilayah tahunan (sd annual_sd ~ 0,132; persist^2+annual^2 = 0,20^2 seperti dgp).
    Intersep dikalibrasi ulang per tahun ke target. Kembalikan (r_t, obs_t, r_t1)."""
    z = (df.p0 - df.p0.mean()) / df.p0.std()
    zy = (df.youth - df.youth.mean()) / df.youth.std()
    u = df.prov.map({p: rng.normal(0, 0.25) for p in df.prov.unique()})
    w = rng.normal(0, persist_sd, len(df))
    base = (0.30 * z + 0.30 * np.maximum(0, (df.p0 - 15) / 10) + 0.15 * df.remote
            + 0.10 * df.remote * z - 0.20 * df.kota + 0.10 * zy + u + w)
    V = df.V.to_numpy()
    r_t = _calib_r(base + rng.normal(0, annual_sd, len(df)), df.V, target)
    r_t1 = _calib_r(base + rng.normal(0, annual_sd, len(df)), df.V, target)
    obs_t = rng.binomial(V.astype(int), r_t) / V
    return r_t, obs_t, r_t1


REPLAY_CATATAN = ("Replay menguji ketahanan peringkat dan kebutuhan terhadap data baru, bukan efek kausal bantuan. "
                  "Pada tingkat data 3 kedua tahun adalah realisasi simulasi dari DGP yang dikalibrasi ke angka nasional "
                  "BPS 0,86%; manfaat dihitung dengan kurva asumsi κ = 1,74.")


def replay(df, seed, target=TARGET_DO, aktual=False, tahun_rencana=2025, tahun_hasil=2026):
    """Replay tingkat 3 (TRD 4.4): latih GLM OOF (lipatan provinsi) pada obs tahun t, bagi kuota tahun t untuk semua skema,
    nilai dengan laju benar t+1 (kurva kappa sama). aktual=True menambah skema 'aktual' bila data PIP lengkap (M5)."""
    rng = np.random.default_rng(seed)
    r_t, obs_t, r_t1 = dgp_pair(df, rng, target)
    V = df.V.to_numpy()
    rho = oof_glm(df, obs_t, features(df), province_folds(df, rng))
    c = np.full(len(df), C0)
    B = SHARE * np.sum(c * V)
    X = schemes(df, rho, c, B)
    sisa_aktual = None
    if aktual:
        a = scheme_actual(df, c, B)
        if a is not None:
            X["Aktual (PIP 2025)"], sisa_aktual = a
    keys = dict(zip(["Merata", "Peringkat kemiskinan", "Greedy (risiko tertinggi)", "Proporsional risiko",
                     "EduShield (KKT)", "Aktual (PIP 2025)"],
                    ["merata", "kemiskinan", "greedy", "proporsional", "edushield", "aktual"]))
    ben = {keys[k]: benefit(x, V, r_t1) for k, x in X.items()}
    return dict(tahun_rencana=tahun_rencana, tahun_hasil=tahun_hasil, n_wilayah=len(df), skema=ben,
                gain_vs_merata_pct={k: 100 * (v / ben["merata"] - 1) for k, v in ben.items()},
                label="simulasi", tingkat_data=3, catatan=REPLAY_CATATAN,
                corr_laju=float(np.corrcoef(r_t, r_t1)[0, 1]), rata_laju_t1=float(np.average(r_t1, weights=V)),
                sisa_pagu_aktual=sisa_aktual)


# ---------------------------------------------------------------- skema "aktual" (M5)
SUMBER_AKTUAL = "Penyaluran PIP SMA/SMK 2025, SIPINTAR (data penyaluran, bukan kebutuhan)"


def scheme_actual(df, c, B):
    """TRD 4.5: x_i ~ penerima PIP SMA+SMK 2025, diskalakan agar sum(c x)=B, lalu dipotong ke [0, V_i].
    Sisa pagu setelah pemotongan TIDAK diredistribusi. Kembalikan (x, sisa_pagu) atau None bila data PIP tak lengkap."""
    if "pip_sma" not in df or "pip_smk" not in df:
        return None
    w = (df.pip_sma + df.pip_smk).to_numpy(float)
    if np.isnan(w).any() or w.sum() <= 0:
        return None
    x = np.clip(w * B / np.sum(c * w), 0, df.V.to_numpy(float))
    return x, float(B - np.sum(c * x))


# ---------------------------------------------------------------- eksperimen
def gain(x, base, V, r, **kw):
    return 100 * (benefit(x, V, r, **kw) / benefit(base, V, r, **kw) - 1)


def run(n_seeds=30):
    df = load_data()
    V = df.V.to_numpy()
    c = np.full(len(df), C0)
    B = SHARE * np.sum(c * V)
    S = {"n_kabkota": len(df), "V_total": int(V.sum()), "B_miliar": B / 1000,
         "region_counts": df.region.value_counts().to_dict()}

    # --- seed 0: prediksi detail (10 ulangan lipatan provinsi)
    rng = np.random.default_rng(0)
    r, obs, lag = dgp(df, rng)
    red = (r > np.average(r, weights=V)).astype(int)
    specs = {"GLM laju (tanpa riwayat)": features(df), "GLM laju (+ riwayat)": features(df, lag),
             "Hanya kemiskinan": features(df, kind="poverty")}
    P = {k: [] for k in list(specs) + ["LightGBM (tanpa riwayat)"]}
    for rep in range(10):
        folds = province_folds(df, np.random.default_rng(100 + rep))
        for k, X in specs.items():
            P[k].append(oof_glm(df, obs, X, folds))
        P["LightGBM (tanpa riwayat)"].append(oof_lgbm(df, obs, features(df).drop(columns="const"), folds, rep))
    S["prediksi"] = {k: {m: float(np.mean([pred_metrics(r, p, V, red)[m] for p in ps]))
                         for m in ["mae_pp", "spearman", "calib_slope", "auc_red"]} for k, ps in P.items()}
    S["red_count"], S["r_true_mean_pct"] = int(red.sum()), float(np.average(r, weights=V) * 100)
    rho = np.mean(P["GLM laju (tanpa riwayat)"], axis=0)
    rho_lgb = np.mean(P["LightGBM (tanpa riwayat)"], axis=0)

    # --- alokasi utama (seed 0), dinilai dengan laju BENAR
    X = schemes(df, rho, c, B)
    base = X["Merata"]
    oracle, _ = kkt(V, r, c, B, ALPHA * V, BETA * V)
    S["alokasi"] = {k: {"tercegah": benefit(x, V, r), "gain_vs_merata_pct": gain(x, base, V, r),
                        "cakupan_merah_pct": float(100 * x[red == 1].sum() / V[red == 1].sum())}
                    for k, x in X.items()}
    S["oracle"] = {"tercegah": benefit(oracle, V, r), "gain_vs_merata_pct": gain(oracle, base, V, r)}
    S["edushield_pct_of_oracle"] = 100 * benefit(X["EduShield (KKT)"], V, r) / benefit(oracle, V, r)
    S["lgbm_rho_gain_pct"] = gain(kkt(V, rho_lgb, c, B, ALPHA * V, BETA * V)[0], base, V, r)

    # rumus lama rho = r_hat * p_hat
    folds = province_folds(df, np.random.default_rng(100))
    phat = oof_redprob(df, features(df).drop(columns="const"), folds, (obs > np.average(obs, weights=V)).astype(int))
    x_old = kkt(V, rho * phat, c, B, ALPHA * V, BETA * V)[0]
    S["rumus_lama_gain_pct"] = gain(x_old, base, V, r)

    # harga bayangan sebagai fungsi kappa
    S["harga_bayangan_per_miliar"] = {str(k): 1000 * kkt(V, rho, c, B, ALPHA * V, BETA * V, k)[1]
                                      for k in [0.8, KAPPA, 3.0]}

    # pergeseran cakupan per gugus
    xe = X["EduShield (KKT)"]
    S["cakupan_gugus_pct"] = {g: float(100 * xe[(df.region == g).to_numpy()].sum() / V[(df.region == g).to_numpy()].sum())
                              for g in REGION}

    # biaya terpencil +15%
    c2 = np.where(df.remote, 1.15 * C0, C0)
    X2 = schemes(df, rho, c2, B)
    S["biaya_terpencil_gain_pct"] = gain(X2["EduShield (KKT)"], X2["Merata"], V, r)

    # --- Monte Carlo: DGP baru tiap seed; regret matrix & hold-harmless
    kopt = ktrue = [0.8, KAPPA, 3.0]
    mc = {"schemes": {k: [] for k in X}, "regret": {}, "hh": [], "oracle_share": []}
    for s in range(n_seeds):
        rng = np.random.default_rng(1000 + s)
        r_s, obs_s, _ = dgp(df, rng)
        rho_s = oof_glm(df, obs_s, features(df), province_folds(df, rng))
        Xs = schemes(df, rho_s, c, B)
        for k, x in Xs.items():
            mc["schemes"][k].append(gain(x, Xs["Merata"], V, r_s))
        orc = kkt(V, r_s, c, B, ALPHA * V, BETA * V)[0]
        mc["oracle_share"].append(100 * benefit(Xs["EduShield (KKT)"], V, r_s) / benefit(orc, V, r_s))
        kap_i = np.exp(rng.normal(np.log(KAPPA), 0.5, len(V)))   # kappa benar heterogen per wilayah
        truths = {f"exp k={kt}": dict(kappa=kt) for kt in ktrue}
        truths["pangkat (gamma=0,5)"] = dict(shape="power")
        truths["logaritmik"] = dict(shape="log")
        het = lambda x: np.sum(V * r_s * (1 - np.exp(-kap_i * x / V)))
        cand = {f"KKT k_opt={ko}": kkt(V, rho_s, c, B, ALPHA * V, BETA * V, ko)[0] for ko in kopt}
        cand["Proporsional risiko"] = Xs["Proporsional risiko"]
        for cname, xk in cand.items():
            for tname, kw in truths.items():
                mc["regret"].setdefault(f"{cname}|{tname}", []).append(gain(xk, Xs["Merata"], V, r_s, **kw))
            mc["regret"].setdefault(f"{cname}|exp kappa_i heterogen", []).append(100 * (het(xk) / het(Xs["Merata"]) - 1))
        mc["hh"].append([gain(x, Xs["Merata"], V, r_s) for x in hold_harmless(df, rho_s, c, B, Xs["Merata"])])
        mc.setdefault("hh_oracle", []).append([gain(x, Xs["Merata"], V, r_s)
                                               for x in hold_harmless(df, r_s, c, B, Xs["Merata"])])
        for share in [0.30, 0.55, 0.80]:                                   # tingkat pagu
            Bs = share * np.sum(c * V)
            Xb = schemes(df, rho_s, c, Bs)
            for k in ["Greedy (risiko tertinggi)", "Proporsional risiko", "EduShield (KKT)"]:
                mc.setdefault("pagu", {}).setdefault(f"{share}|{k}", []).append(gain(Xb[k], Xb["Merata"], V, r_s))
        Xc = schemes(df, rho_s, c2, B)                                     # biaya terpencil +15%
        for k in ["Proporsional risiko", "EduShield (KKT)"]:
            mc.setdefault("biaya", {}).setdefault(k, []).append(gain(Xc[k], Xc["Merata"], V, r_s))

    q = lambda a: {"median": float(np.median(a)), "p5": float(np.percentile(a, 5)), "p95": float(np.percentile(a, 95))}
    S["mc_n"] = n_seeds
    S["mc_schemes"] = {k: q(v) for k, v in mc["schemes"].items()}
    S["mc_oracle_share"] = q(mc["oracle_share"])
    S["mc_regret"] = {k: q(v) for k, v in mc["regret"].items()}
    S["mc_pagu"] = {k: q(v) for k, v in mc["pagu"].items()}
    S["mc_biaya_terpencil"] = {k: q(v) for k, v in mc["biaya"].items()}
    S["mc_hold_harmless_oracle"] = [q(np.array(mc["hh_oracle"])[:, t]) for t in range(5)]
    S["mc_hold_harmless"] = [q(np.array(mc["hh"])[:, t]) for t in range(5)]

    # contoh wilayah (Lampiran 2 baru)
    names = df.name.to_numpy()
    S["contoh"] = []
    for n in ["Sumba Tengah", "Nduga", "Kota Yogyakarta", "Kota Surabaya", "Supiori"]:
        i = int(np.flatnonzero(names == n)[0])
        S["contoh"].append(dict(name=n, V=int(V[i]), p0=float(df.p0[i]), r_true=float(r[i]), r_hat=float(rho[i]),
                                x_merata=float(base[i]), x_edushield=float(xe[i]), x_rumus_lama=float(x_old[i])))

    OUT.mkdir(exist_ok=True)
    df.assign(r_true=r, r_hat=rho, x_merata=base, x_edushield=xe).to_csv(OUT / "kabkota.csv", index=False)
    (OUT / "summary.json").write_text(json.dumps(S, indent=1, ensure_ascii=False), encoding="utf8")
    return S


if __name__ == "__main__":
    if '--export' in sys.argv:
        from export_app import export
        export()
        sys.exit(0)
    S = run(int(sys.argv[1]) if len(sys.argv) > 1 else 30)
    print(json.dumps(S, indent=1, ensure_ascii=False))
