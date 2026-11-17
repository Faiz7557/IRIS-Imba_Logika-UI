"""S1 (syarat court V8): adu langsung proporsional vs KKT dengan batas yang sama.

Pertanyaan: adakah batas (α/β, pagu, kuota bulat, transisi turun maks. 10%/tahun) yang dilanggar proporsional
tetapi dipenuhi KKT? Dan di mana keputusan per wilayah keduanya berbeda?
Seed dan prediksi sama persis dengan Monte Carlo di edushield.run() (rng 1000+s), jadi angka dasar dapat dicocokkan
dengan summary.json. Semua hasil simulasi. Keluaran: results/s1_adu.json.
"""
import json
import numpy as np
import edushield as e

N_SEEDS, YEARS, CUT = 30, 5, 0.10


def round_lr(x, c, B, lo, hi):
    """Pembulatan sisa terbesar (tanpa fungsi manfaat): aturan bulat yang wajar untuk skema proporsional."""
    zlo, zhi = np.ceil(lo - 1e-9), np.floor(hi + 1e-9)
    z = np.clip(np.floor(x + 1e-9), zlo, zhi)
    left = B - np.sum(c * z)
    for i in np.argsort(-(x - z)):          # sisa pecahan terbesar dulu
        if left >= c[i] - 1e-9 and z[i] + 1 <= zhi[i]:
            z[i] += 1
            left -= c[i]
    return z


def check(x, c, B, lo, hi, prev=None):
    """Jumlah pelanggaran batas. prev: kuota tahun lalu (batas turun maks. CUT)."""
    tol = 1e-6
    out = dict(lantai=int(np.sum(x < lo - tol)), atap=int(np.sum(x > hi + tol)), pagu=int(np.sum(c * x) > B + 1e-6))
    if prev is not None:
        out["turun_lebih_10pct"] = int(np.sum(x < (1 - CUT) * prev - tol))
    return out


def transition(rho, V, c, B, x0, rule):
    """Lima tahun dengan lantai max(αV, 0,9·x tahun lalu); rule = 'kkt' atau 'prop'."""
    x, path, viol = x0.copy(), [], 0
    for _ in range(YEARS):
        lo, hi = np.maximum(e.ALPHA * V, (1 - CUT) * x), e.BETA * V
        nx = e.kkt(V, rho, c, B, lo, hi)[0] if rule == "kkt" else e.proportional(V * rho, c, B, lo, hi)
        viol += check(nx, c, B, lo, hi, prev=x)["turun_lebih_10pct"]
        x = nx
        path.append(x.copy())
    return path, viol


def main():
    df = e.load_data()
    V = df.V.to_numpy()
    c = np.full(len(df), e.C0)
    c2 = np.where(df.remote, 1.15 * e.C0, e.C0)
    lo, hi = e.ALPHA * V, e.BETA * V
    sup = int(np.flatnonzero(df.name.to_numpy() == "Supiori")[0])
    R = {}
    add = lambda k, v: R.setdefault(k, []).append(v)
    for s in range(N_SEEDS):
        rng = np.random.default_rng(1000 + s)
        r, obs, _ = e.dgp(df, rng)
        rho = e.oof_glm(df, obs, e.features(df), e.province_folds(df, rng))
        for share, tag in [(e.SHARE, "base"), (0.30, "pagu30"), (0.80, "pagu80")]:
            B = share * np.sum(c * V)
            mer = B / np.sum(c * V) * V
            xk, xp = e.kkt(V, rho, c, B, lo, hi)[0], e.proportional(V * rho, c, B, lo, hi)
            add(f"{tag}_kkt", e.gain(xk, mer, V, r))
            add(f"{tag}_prop", e.gain(xp, mer, V, r))
            if tag != "base":
                continue
            # 1. batas pada kuota kontinu dan bulat
            zk = e.round_quota(xk, V, rho, c, B, lo, hi)["z"].astype(float)
            zp = round_lr(xp, c, B, lo, hi)
            add("viol", {n: check(x, c, B, lo, hi) for n, x in
                         [("kkt", xk), ("prop", xp), ("kkt_bulat", zk), ("prop_bulat", zp)]})
            add("bulat_kkt", e.gain(zk, mer, V, r))
            add("bulat_prop", e.gain(zp, mer, V, r))
            # 2. lompatan langsung dari merata (tanpa batas transisi): berapa wilayah turun > 10%
            add("lompat_kkt", int(np.sum(xk < (1 - CUT) * mer)))
            add("lompat_prop", int(np.sum(xp < (1 - CUT) * mer)))
            # 3. transisi lima tahun dengan batas turun 10%/tahun, mulai dari merata
            for rule in ["kkt", "prop"]:
                path, v = transition(rho, V, c, B, mer, rule)
                add(f"hh_{rule}", [e.gain(x, mer, V, r) for x in path])
                add(f"hh_viol_{rule}", v)
            # 4. keputusan per wilayah dibanding acuan ideal (oracle: KKT dengan laju benar)
            orc = e.kkt(V, r, c, B, lo, hi)[0]
            dk, dp = np.abs(xk - orc), np.abs(xp - orc)
            diff = np.abs(dk - dp) > 1e-6
            add("dekat_oracle_kkt_pct", float(100 * np.mean(dk[diff] < dp[diff])))
            add("l1_oracle_kkt", float(dk.sum()))
            add("l1_oracle_prop", float(dp.sum()))
            add("geser_pct", float(100 * np.sum(c * np.abs(xk - xp)) / 2 / B))
            top = r >= np.quantile(r, 0.9)                     # 10% wilayah berlaju benar tertinggi
            for n, x in [("kkt", xk), ("prop", xp), ("oracle", orc)]:
                add(f"top_{n}", float(100 * x[top].sum() / V[top].sum()))
                add(f"sup_{n}", float(100 * x[sup] / V[sup]))
            add("sup_rho", float(100 * rho[sup]))
            add("sup_r", float(100 * r[sup]))
        # 5. biaya terpencil +15%
        B = e.SHARE * np.sum(c * V)
        mer2 = B / np.sum(c2 * V) * V
        add("biaya_kkt", e.gain(e.kkt(V, rho, c2, B, lo, hi)[0], mer2, V, r))
        add("biaya_prop", e.gain(e.proportional(V * rho, c2, B, lo, hi), mer2, V, r))
        print(f"seed {s}: base kkt {R['base_kkt'][-1]:.2f} prop {R['base_prop'][-1]:.2f}", flush=True)

    q = lambda a: dict(median=float(np.median(a)), p5=float(np.percentile(a, 5)), p95=float(np.percentile(a, 95)))
    wins = lambda k: int(np.sum(np.array(R[f"{k}_kkt"]) > np.array(R[f"{k}_prop"])))
    nviol = {n: {b: int(sum(v[n][b] for v in R["viol"])) for b in ["lantai", "atap", "pagu"]}
             for n in ["kkt", "prop", "kkt_bulat", "prop_bulat"]}
    out = dict(
        catatan="Simulasi, 30 seed (rng 1000+s, sama dengan summary.json mc_*). Keunggulan = % di atas merata, "
                "dinilai dengan laju benar simulasi, kurva eksponensial κ=1,74.",
        pelanggaran_batas_total_30_seed=nviol,
        transisi_pelanggaran_turun_10pct=dict(kkt=int(sum(R["hh_viol_kkt"])), prop=int(sum(R["hh_viol_prop"]))),
        lompat_tanpa_transisi_wilayah_turun_lebih_10pct=dict(kkt=q(R["lompat_kkt"]), prop=q(R["lompat_prop"])),
        skenario={k: dict(kkt=q(R[f"{k}_kkt"]), prop=q(R[f"{k}_prop"]), kkt_menang_dari_30=wins(k))
                  for k in ["base", "bulat", "pagu30", "pagu80", "biaya"]},
        transisi_5_tahun={rule: [q([p[y] for p in R[f"hh_{rule}"]]) for y in range(YEARS)] for rule in ["kkt", "prop"]},
        transisi_kkt_menang_per_tahun=[int(sum(a[y] > b[y] for a, b in zip(R["hh_kkt"], R["hh_prop"])))
                                       for y in range(YEARS)],
        per_wilayah=dict(
            pct_wilayah_berbeda_yang_lebih_dekat_oracle_kkt=q(R["dekat_oracle_kkt_pct"]),
            jarak_L1_ke_oracle_kuota=dict(kkt=q(R["l1_oracle_kkt"]), prop=q(R["l1_oracle_prop"])),
            pagu_yang_berpindah_pct=q(R["geser_pct"]),
            cakupan_10pct_laju_tertinggi_pct=dict(kkt=q(R["top_kkt"]), prop=q(R["top_prop"]), oracle=q(R["top_oracle"])),
            supiori_cakupan_pct=dict(kkt=q(R["sup_kkt"]), prop=q(R["sup_prop"]), oracle=q(R["sup_oracle"]),
                                     laju_prediksi=q(R["sup_rho"]), laju_benar=q(R["sup_r"]))))
    (e.OUT / "s1_adu.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf8")
    print(json.dumps(out, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
