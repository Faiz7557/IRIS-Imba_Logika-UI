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
print("ok")