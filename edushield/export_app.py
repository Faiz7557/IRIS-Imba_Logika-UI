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
    # M8: interval konformal global (M2). q dikalibrasi pada seed 0: |logit r - logit rho|, nominal 0,90.
    cal = e.conformal_interval(r, rho, df.region.to_numpy(), a=0.10)
    low, high = e.apply_interval(rho, cal['q'])
    conf = json.loads((e.OUT / 'conformal_summary.json').read_text(encoding='utf8'))
    t = np.mean(terms, axis=0)
    schemes = e.schemes(df, rho, c, B)
    keys = ['merata', 'kemiskinan', 'greedy', 'proporsional', 'edushield']
    allocations = dict(zip(keys, schemes.values()))
    allocations['oracle'] = e.kkt(V, r, c, B, e.ALPHA*V, e.BETA*V)[0]
    hh = e.hold_harmless(df, rho, c, B, allocations['merata'])
    summary = json.loads((e.OUT / 'summary.json').read_text(encoding='utf8'))
    pip = (df.pip_sma + df.pip_smk).to_numpy(float) if 'pip_sma' in df else np.full(len(df), np.nan)
    aud = e.audit_value(V, rho, c, B, e.ALPHA, e.BETA, e.KAPPA)   # nilai audit bawaan, skenario bawaan (pagu 55%)
    nn = lambda v: None if not np.isfinite(v) else float(v)
    rep = [e.replay(df, sd, aktual=True) for sd in range(30)]
    qq = lambda a: dict(median=float(np.median(a)), p5=float(np.percentile(a, 5)), p95=float(np.percentile(a, 95)))
    sk = list(rep[0]['skema'])
    replay = dict(tahun_rencana=2025, tahun_hasil=2026, n_wilayah=len(df), n_seed=30, label='simulasi', tingkat_data=3,
        skema={k: float(np.median([x['skema'][k] for x in rep])) for k in sk},
        skema_seed0=rep[0]['skema'],
        gain_vs_merata_pct={k: qq([x['gain_vs_merata_pct'][k] for x in rep]) for k in sk if k != 'merata'},
        corr_laju=qq([x['corr_laju'] for x in rep]), rata_laju_t1=qq([x['rata_laju_t1'] for x in rep]),
        sisa_pagu_aktual=qq([x['sisa_pagu_aktual'] for x in rep]) if rep[0]['sisa_pagu_aktual'] is not None else None,
        satuan='siswa tercegah (manfaat terevaluasi pada laju simulasi tahun hasil; median 30 seed)',
        catatan=rep[0]['catatan'])
    assert np.allclose(rho, __import__('pandas').read_csv(e.OUT / 'kabkota.csv').r_hat, rtol=1e-10)
    kab = []
    for i, row in df.iterrows():
        kab.append(dict(id='es-'+hashlib.sha256((row.prov+'|'+row['name']).encode()).hexdigest()[:10],
            nama=row['name'], prov=row.prov, gugus=row.region, kota=bool(row.kota), p0=row.p0,
            pop1519=int(row.pop1519), V=int(row.V), remote=bool(row.remote),
            r_hat=float(rho[i]), kode_bps=(None if row.get('kode_bps') is None or row.get('kode_bps') != row.get('kode_bps') else str(row.kode_bps)),
            r_lo=float(low[i]), r_hi=float(high[i]), r_obs=None, r_sim=float(r[i]),
            pip_aktual=nn(pip[i]), audit=dict(A=float(aud['A'][i]), L=[float(aud['L'][i,0]), float(aud['L'][i,1])]),
            kontribusi=dict(intersep=float(t[i,0]), kemiskinan=float(t[i,1]), pemuda=float(t[i,2]),
                kota=float(t[i,3]), gugus=float(t[i,4:].sum())),
            x={k:float(a[i]) for k,a in allocations.items()}, hh=[float(a[i]) for a in hh]))
    fixtures = []
    for share in [.30,.55,.80]:
        budget = share*np.sum(c*V)
        x, lam = e.kkt(V, rho, c, budget, e.ALPHA*V, e.BETA*V)
        fixtures.append(dict(share=share, B=float(budget), x=x.tolist(), lam=float(lam)))
    meta = dict(versi_model='v3-glm-oof-10-konformal', versi_data='bps-local-20261030+pip2025+dgp0086', tanggal='2026-11-16',
        label='DATA SIMULASI', seed=0, params=dict(C0=e.C0,share=e.SHARE,alpha=e.ALPHA,beta=e.BETA,kappa=e.KAPPA),
        sumber=[p.read_text(encoding='utf8').splitlines()[:3] for p in sorted(e.RAW.glob('*.txt'))],
        tingkat_data=3, outcome='simulasi',
        interval=dict(metode='split-conformal-LOPO', nominal=0.90, cakupan_empiris=conf['cakupan_global']['mean'],
            cakupan_empiris_uji=('rata-rata 30 seed pada realisasi DGP baru (refit OOF); median %.1f%%, p5 %.1f%%' % (100*conf['cakupan_global']['median'], 100*conf['cakupan_global']['p5'])).replace('.', ','),
            cakupan_in_sample_seed0=cal['cakupan_empiris'], q_logit=cal['q'], q_logit_median_30_seed=conf['q_global']['median'],
            per_gugus={k: v['mean'] for k, v in conf['cakupan_per_gugus'].items()},
            catatan=' '.join(conf['catatan_batas'])),
        interval_teks='Interval prediksi konformal 90% (r_lo–r_hi), skala logit, satu q global. Cakupan rata-rata, bukan per wilayah; laju yang dicakup adalah laju simulasi.',
        kappa=dict(nilai=e.KAPPA, status='asumsi bentuk kurva, bukan hasil kalibrasi', sensitivitas=[0.8, 1.74, 3]),
        target_kalibrasi=dict(nilai=e.TARGET_DO, sumber='BPS, Statistik Pendidikan 2025, Tabel 5.1 (Susenas Maret 2025), SMA/SMK sederajat'),
        sumber_pip=dict(nama='PIP SMA+SMK 2025 per kabupaten/kota, SIPINTAR', catatan='Data penyaluran, bukan kebutuhan; skema aktual = penerima PIP 2025 diskalakan ke pagu, tanpa redistribusi sisa.',
            baris_ada=int(np.isfinite(pip).sum())),
        kontribusi='Rata-rata suku logit model OOF. Intersep + empat faktor = rata-rata logit; sigmoid rata-rata logit dapat berbeda dari rata-rata probabilitas r_hat.',
        wilayah='ID internal; kode BPS di kolom kode_bps. Pengelompokan provinsi mengikuti berkas sumber lokal; tidak diklaim sebagai batas administratif 38 provinsi terkini.',
        kappa_teks='Asumsi bentuk kurva 1,74, bukan hasil kalibrasi; sensitivitas 0,8 / 1,74 / 3 wajib dibaca.',
        V='Proksi: bulat(0,6 × penduduk 15–19 × 0,74 × p0/100), minimum 10; bukan jumlah penerima terdaftar.',
        kuota='Kuota kontinu untuk perencanaan. Pembulatan dan kelayakan penerima memerlukan tahap penetapan tersendiri.')
    data = dict(meta=meta,kab=kab,nasional=summary,replay=replay,geo=dict(type='tile-grid',matched=len(kab),total=len(kab),geographic=False))
    raw = json.dumps(data, ensure_ascii=False, separators=(',',':'), allow_nan=False)   # gagal bila ada NaN
    assert not any(d['kode_bps'] is None for d in kab), 'kode_bps kosong'
    (APP/'app_data.json').write_text(raw,encoding='utf8')
    digest = hashlib.sha256(raw.encode()).hexdigest()
    (APP/'app_data.sha256').write_text(digest+'  app_data.json\n',encoding='utf8')
    # Classic script bundle also works when opening index.html directly, fully offline.
    (APP/'data.js').write_text('window.EDUSHIELD_DATA='+raw+';\nwindow.DATA_HASH='+json.dumps(digest)+';',encoding='utf8')
    (APP/'solver_fixtures.json').write_text(json.dumps(fixtures),encoding='utf8')
    e.write_round_fixtures(); e.write_audit_fixtures()
    print(f'Exported {len(kab)} districts; {df.prov.nunique()} source provinces; sha256 {digest}')

if __name__ == '__main__':
    export()
