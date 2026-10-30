"""Reproducible prototype bundle. Never overwrites the research summary."""
import hashlib
import json
from datetime import date
import numpy as np
import statsmodels.api as sm
import edushield as e

APP = e.ROOT / 'app'

def export():
    APP.mkdir(exist_ok=True)
    df = e.load_data()
    V = df.V.to_numpy()
    c = np.full(len(df), e.C0)
    B = e.SHARE * np.sum(c * V)
    r, obs, _ = e.dgp(df, np.random.default_rng(0))
    X = e.features(df)
    predictions, terms = [], []
    for rep in range(10):
        folds = e.province_folds(df, np.random.default_rng(100 + rep))
        pred, linear = np.empty(len(df)), np.empty(X.shape)
        for f in np.unique(folds):
            tr, te = folds != f, folds == f
            model = sm.GLM(obs[tr], X[tr], family=sm.families.Binomial(), var_weights=df.V[tr]).fit()
            pred[te] = model.predict(X[te])
            linear[te] = X[te].to_numpy() * model.params.to_numpy()
        predictions.append(pred)
        terms.append(linear)
    rho = np.mean(predictions, axis=0)
    low, high = np.percentile(predictions, [5, 95], axis=0)
    t = np.mean(terms, axis=0)
    schemes = e.schemes(df, rho, c, B)
    keys = ['merata', 'kemiskinan', 'greedy', 'proporsional', 'edushield']
    allocations = dict(zip(keys, schemes.values()))
    allocations['oracle'] = e.kkt(V, r, c, B, e.ALPHA*V, e.BETA*V)[0]
    hh = e.hold_harmless(df, rho, c, B, allocations['merata'])
    summary = json.loads((e.OUT / 'summary.json').read_text(encoding='utf8'))
    assert np.allclose(rho, __import__('pandas').read_csv(e.OUT / 'kabkota.csv').r_hat, rtol=1e-10)
    kab = []
    for i, row in df.iterrows():
        kab.append(dict(id='es-'+hashlib.sha256((row.prov+'|'+row['name']).encode()).hexdigest()[:10],
            nama=row['name'], prov=row.prov, gugus=row.region, kota=bool(row.kota), p0=row.p0,
            pop1519=int(row.pop1519), V=int(row.V), remote=bool(row.remote),
            r_hat=float(rho[i]), r_lo=float(low[i]), r_hi=float(high[i]), r_sim=float(r[i]),
            kontribusi=dict(intersep=float(t[i,0]), kemiskinan=float(t[i,1]), pemuda=float(t[i,2]),
                kota=float(t[i,3]), gugus=float(t[i,4:].sum())),
            x={k:float(a[i]) for k,a in allocations.items()}, hh=[float(a[i]) for a in hh]))
    fixtures = []
    for share in [.30,.55,.80]:
        budget = share*np.sum(c*V)
        x, lam = e.kkt(V, rho, c, budget, e.ALPHA*V, e.BETA*V)
        fixtures.append(dict(share=share, B=float(budget), x=x.tolist(), lam=float(lam)))
    meta = dict(versi_model='v2-glm-oof-10', versi_data='bps-local-20261030', tanggal='2026-10-30',
        label='DATA SIMULASI', seed=0, params=dict(C0=e.C0,share=e.SHARE,alpha=e.ALPHA,beta=e.BETA,kappa=e.KAPPA),
        sumber=[p.read_text(encoding='utf8').splitlines()[:3] for p in sorted(e.RAW.glob('*.txt'))],
        interval='Persentil 5–95 dari 10 pembagian lipatan provinsi pada outcome seed 0; rentang stabilitas model, bukan interval prediksi atau interval kepercayaan.',
        kontribusi='Rata-rata suku logit model OOF. Intersep + empat faktor = rata-rata logit; sigmoid rata-rata logit dapat berbeda dari rata-rata probabilitas r_hat.',
        wilayah='ID internal, bukan kode BPS. Pengelompokan provinsi mengikuti berkas sumber lokal; tidak diklaim sebagai batas administratif 38 provinsi terkini.',
        kappa='Asumsi kerja 1,74; penafsiran efek studi PIP 2,8 pp belum diverifikasi teks penuh. Sensitivitas wajib dibaca.',
        V='Proksi: bulat(0,6 × penduduk 15–19 × 0,74 × p0/100), minimum 10; bukan jumlah penerima terdaftar.',
        kuota='Kuota kontinu untuk perencanaan. Pembulatan dan kelayakan penerima memerlukan tahap penetapan tersendiri.')
    data = dict(meta=meta,kab=kab,nasional=summary,geo=dict(type='tile-grid',matched=len(kab),total=len(kab),geographic=False))
    raw = json.dumps(data, ensure_ascii=False, separators=(',',':'))
    (APP/'app_data.json').write_text(raw,encoding='utf8')
    digest = hashlib.sha256(raw.encode()).hexdigest()
    (APP/'app_data.sha256').write_text(digest+'  app_data.json\n',encoding='utf8')
    # Classic script bundle also works when opening index.html directly, fully offline.
    (APP/'data.js').write_text('window.EDUSHIELD_DATA='+raw+';\nwindow.DATA_HASH='+json.dumps(digest)+';',encoding='utf8')
    (APP/'solver_fixtures.json').write_text(json.dumps(fixtures),encoding='utf8')
    print(f'Exported {len(kab)} districts; {df.prov.nunique()} source provinces; sha256 {digest}')

if __name__ == '__main__':
    export()
