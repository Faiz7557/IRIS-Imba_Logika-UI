"""Additional stress tests requested by the v2 court; fixed planning constraints."""
import json
import numpy as np
import edushield as e

def run():
 df=e.load_data();V=df.V.to_numpy();c=np.full(len(V),e.C0);B=e.SHARE*np.sum(c*V)
 rows={};transition={'KKT':[],'Proporsional':[]};unused={};shifts={}
 for seed in range(30):
  rng=np.random.default_rng(1000+seed);r,obs,_=e.dgp(df,rng)
  rho=e.oof_glm(df,obs,e.features(df),e.province_folds(df,rng));xs=e.schemes(df,rho,c,B)
  # True vulnerable counts vary across districts; total held fixed.
  noises=np.random.default_rng(8000+seed).normal(0,.25,len(V))
  masks={'galat lognormal sigma=0,25':np.exp(noises),
         'kebutuhan terpencil 25% lebih tinggi':np.where(df.remote,1.25,1),
         'kebutuhan terpencil 25% lebih rendah':np.where(df.remote,.75,1),
         'galat berbeda gugus dan wilayah':np.exp(noises)*np.where(df.remote,1.25,.9)}
  for name,mult in masks.items():
   trueV=V*mult;trueV*=V.sum()/trueV.sum()
   corrected=e.schemes(df.assign(V=trueV),rho,c,B)
   benefit=lambda x:e.benefit(np.minimum(x,trueV),trueV,r)
   base=benefit(xs['Merata'])
   for key in ['EduShield (KKT)','Proporsional risiko','Greedy (risiko tertinggi)']:
    rows.setdefault(name,{}).setdefault(key,[]).append(100*(benefit(xs[key])/base-1))
    unused.setdefault(name,{}).setdefault(key,[]).append(float(np.maximum(xs[key]-trueV,0).sum()/xs[key].sum()*100))
    shifts.setdefault(name,{}).setdefault(key,[]).append(float(.5*np.abs(corrected[key]-xs[key]).sum()/xs[key].sum()*100))
  paths={'KKT':e.hold_harmless(df,rho,c,B,xs['Merata'])}
  prev=xs['Merata'].copy();paths['Proporsional']=[]
  for _ in range(5):
   low=np.maximum(e.ALPHA*V,.9*prev)
   prev=e.proportional(V*rho,c,B,low,e.BETA*V);paths['Proporsional'].append(prev.copy())
  for key,path in paths.items():
   prev=xs['Merata']
   for x in path:
    assert np.all(x>=.9*prev-1e-7) and np.all(x<=e.BETA*V+1e-7)
    assert abs(np.sum(c*x)-B)/B<1e-9
    prev=x
   transition[key].append([e.gain(x,xs['Merata'],V,r) for x in path])
 q=lambda x:dict(median=float(np.median(x)),p5=float(np.percentile(x,5)),p95=float(np.percentile(x,95)))
 out=dict(label='DATA SIMULASI',n=30,definition='Planning quotas and bounds use V_proxy; evaluation uses perturbed V_true of same total, fixed r_true, and benefit(min(x,V_true),V_true,r_true). No refit; isolates need-proxy error. Excess planned quota is counted separately, not silently reallocated.',
  sensitivity_V={k:{scheme:q(v) for scheme,v in data.items()} for k,data in rows.items()},
  excess_capacity_pct={k:{scheme:q(v) for scheme,v in data.items()} for k,data in unused.items()},
  corrected_need_quota_reallocation_pct={k:{scheme:q(v) for scheme,v in data.items()} for k,data in shifts.items()},
  equal_protection_transition={key:[q(np.array(a)[:,t]) for t in range(5)] for key,a in transition.items()})
 (e.OUT/'stress_followup.json').write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding='utf8')
 lines=['# Audit tambahan setelah court v2','', 'Seluruh hasil simulasi 30 ulangan. '+out['definition'],'', '| Galat kebutuhan | KKT gain median | Proporsional gain median |','|---|---:|---:|']
 for k,data in out['sensitivity_V'].items():lines.append(f"| {k} | {data['EduShield (KKT)']['median']:.3f}% | {data['Proporsional risiko']['median']:.3f}% |")
 lines+=['','| Koreksi kebutuhan | Perpindahan kuota KKT | Perpindahan kuota proporsional |','|---|---:|---:|']
 for k,data in out['corrected_need_quota_reallocation_pct'].items():lines.append(f"| {k} | {data['EduShield (KKT)']['median']:.3f}% | {data['Proporsional risiko']['median']:.3f}% |")
 lines+=['','Perpindahan kuota = setengah jumlah selisih absolut kuota / total kuota, jika V evaluasi diketahui lalu solver dijalankan ulang dengan rho tetap. Ini sensitivitas keputusan terhadap koreksi kebutuhan, bukan pelatihan ulang prediksi.','','| Tahun transisi | KKT median gain | Proporsional median gain |','|---|---:|---:|']
 for t in range(5):lines.append(f"| {t+1} | {out['equal_protection_transition']['KKT'][t]['median']:.3f}% | {out['equal_protection_transition']['Proporsional'][t]['median']:.3f}% |")
 lines+=['','Kedua skema memakai α=0,20, β=0,95 dan batas turun 10% dari tahun sebelumnya, mulai dari merata, dengan pagu/biaya yang sama. Semua batas dan pagu diuji.','', 'Interpretasi: sensitivitas ini memisahkan kesalahan ukuran kebutuhan dari prediksi laju. Ia tidak mengubah data BPS, tidak membuktikan galat proksi sebenarnya, tidak melatih ulang model dan tidak menggantikan validasi pilot. Keunggulan KKT tetap tidak diklaim universal. Lihat excess_capacity_pct untuk kuota yang melampaui kapasitas evaluasi dalam skenario salah ukur.']
 (e.OUT/'STRESS_FOLLOWUP.md').write_text('\n'.join(lines),encoding='utf8')
 print(json.dumps(out,indent=1,ensure_ascii=False))
if __name__=='__main__':run()
