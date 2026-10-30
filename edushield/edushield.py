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
    return df


# ---------------------------------------------------------------- DGP (simulasi)
def dgp(df, rng, target=0.025):
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
    if kind == "full":
        X["zy"] = (df.youth - df.youth.mean()) / df.youth.std()
        X["kota"] = df.kota.astype(float)
        for g in ["Jawa-Bali", "Nusa Tenggara", "Kalimantan", "Sulawesi", "Maluku-Papua"]:
            X[g] = (df.region == g).astype(float)
        if lag is not None:
            X["lag"] = np.log((lag + 0.005) / (1 - lag + 0.005))
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


def hold_harmless(df, rho, c, B, x0, years=5, cut=0.10):
    V = df.V.to_numpy()
    x, path = x0.copy(), []
    for _ in range(years):
        lo = np.maximum(ALPHA * V, (1 - cut) * x)
        x = kkt(V, rho, c, B, lo, BETA * V)[0]
        path.append(x.copy())
    return path


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
