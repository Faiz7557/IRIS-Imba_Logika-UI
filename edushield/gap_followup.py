"""Audit court v2 follow-up: honest oracle metric and the source of the KKT-proportional gap.

gap_closed = (benefit(x) - benefit(merata)) / (benefit(oracle) - benefit(merata)), on the true simulated rate.
Second test: with the true rate known, does KKT beat proportional? If so, the loss under predicted rates
comes from prediction error (predict-then-optimize decision loss), not from the allocation rule itself.
"""
import json
import numpy as np
import edushield as e


def run(n=30):
    df = e.load_data(); V = df.V.to_numpy(); c = np.full(len(V), e.C0); B = e.SHARE * np.sum(c * V)
    lo, hi = e.ALPHA * V, e.BETA * V
    gap, level, true_rule, diff = {}, {}, {'KKT': [], 'Proporsional': []}, []
    for s in range(n):
        rng = np.random.default_rng(1000 + s)  # same seeds as run() Monte Carlo
        r, obs, _ = e.dgp(df, rng)
        rho = e.oof_glm(df, obs, e.features(df), e.province_folds(df, rng))
        xs = e.schemes(df, rho, c, B)
        orc = e.kkt(V, r, c, B, lo, hi)[0]
        b0, bo = e.benefit(xs['Merata'], V, r), e.benefit(orc, V, r)
        level.setdefault('Merata', []).append(100 * b0 / bo)
        for k, x in xs.items():
            if k == 'Merata':
                continue
            gap.setdefault(k, []).append(100 * (e.benefit(x, V, r) - b0) / (bo - b0))
            level.setdefault(k, []).append(100 * e.benefit(x, V, r) / bo)
        true_rule['KKT'].append(e.gain(orc, xs['Merata'], V, r))
        true_rule['Proporsional'].append(e.gain(e.proportional(V * r, c, B, lo, hi), xs['Merata'], V, r))
        diff.append(e.gain(xs['EduShield (KKT)'], xs['Merata'], V, r) - e.gain(xs['Proporsional risiko'], xs['Merata'], V, r))
    q = lambda a: dict(median=float(np.median(a)), p5=float(np.percentile(a, 5)), p95=float(np.percentile(a, 95)))
    out = dict(label='DATA SIMULASI', n=n,
               gap_closed_pct={k: q(v) for k, v in gap.items()},
               share_of_oracle_pct={k: q(v) for k, v in level.items()},
               true_rate_gain_pct={k: q(v) for k, v in true_rule.items()},
               kkt_minus_prop_pp=q(diff), kkt_wins_seeds=int(np.sum(np.array(diff) > 0)))
    (e.OUT / 'gap_followup.json').write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding='utf8')
    return out


if __name__ == '__main__':
    o = run()
    # Self-check: oracle is the optimum on the true rate, so no scheme may close more than 100% of the gap.
    assert all(v['p95'] <= 100 + 1e-6 for v in o['gap_closed_pct'].values())
    print(json.dumps(o, indent=1, ensure_ascii=False))
