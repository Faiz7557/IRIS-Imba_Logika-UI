const fs=require('fs'),assert=require('assert'),{performance}=require('perf_hooks');
const S=require('./app/kkt.js'),D=JSON.parse(fs.readFileSync(__dirname+'/app/app_data.json','utf8'));
const fixtures=JSON.parse(fs.readFileSync(__dirname+'/app/solver_fixtures.json','utf8'));
const p={...D.meta.params,remote:0},V=D.kab.map(d=>d.V),r=D.kab.map(d=>d.r_hat),c=V.map(()=>p.C0),lo=V.map(v=>p.alpha*v),hi=V.map(v=>p.beta*v),checks=[];
for(const f of fixtures){const t=performance.now(),res=S.kkt(V,r,c,f.B,lo,hi,p.kappa),ms=performance.now()-t;
 const err=Math.max(...res.x.map((v,i)=>Math.abs(v-f.x[i])/Math.max(1,Math.abs(f.x[i]))));
 assert(err<1e-6);assert(Math.abs(S.dot(c,res.x)-f.B)/f.B<1e-9);assert(res.x.every((v,i)=>v>=lo[i]-1e-8&&v<=hi[i]+1e-8));
 assert(res.x.every((v,i)=>v<=lo[i]+1e-6||v>=hi[i]-1e-6||Math.abs(p.kappa*r[i]*Math.exp(-p.kappa*v/V[i])/c[i]-res.lambda)<1e-9));
 checks.push({share:f.share,max_relative_error:err,budget_error:S.dot(c,res.x)-f.B,solve_ms:ms});assert(ms<100);
}

// Kesetaraan roundQuota JS-Python (round_fixtures.json ditulis oleh edushield.write_round_fixtures)
const rf=JSON.parse(fs.readFileSync(__dirname+'/app/round_fixtures.json','utf8')),rounding=[];
for(const f of rf){const cc=D.kab.map(d=>f.remote&&d.remote?p.C0*(1+f.remote):p.C0),t0=performance.now(),q=S.roundQuota(f.x,V,r,cc,f.B,lo,hi,p.kappa),ms=performance.now()-t0;
 assert.deepStrictEqual(q.z,f.z);assert.deepStrictEqual(q.turun,f.turun);assert.deepStrictEqual(q.bentrok,f.bentrok);
 const rel=(a,b)=>Math.abs(a-b)/Math.max(1,Math.abs(b));
 assert(Math.abs(q.sisa-f.sisa)/f.B<1e-9&&rel(q.loss,f.loss)<1e-9&&rel(q.lossPct,f.loss_pct)<1e-9);
 assert(S.dot(cc,q.z)<=f.B+1e-9);rounding.push({share:f.share,remote:f.remote,sisa:q.sisa,loss:q.loss,loss_pct:q.lossPct,ms});}
// Kesetaraan auditValue JS-Python (audit_fixtures.json ditulis oleh edushield.write_audit_fixtures)
const af=JSON.parse(fs.readFileSync(__dirname+'/app/audit_fixtures.json','utf8')),audit=[];
for(const f of af){const t0=performance.now(),a=S.auditAll(V,r,c,f.B,p.alpha,p.beta,p.kappa,Array.from({length:f.n},(_,i)=>i)),ms=performance.now()-t0;
 const rel=(u,v)=>Math.abs(u-v)/Math.max(1,Math.abs(v));let worst=0;
 f.A.forEach((v,i)=>{worst=Math.max(worst,rel(a.A[i],v));f.L[i].forEach((l,j)=>worst=Math.max(worst,rel(a.L[i][j],l)));});
 assert(worst<1e-6,'audit '+f.share+' '+worst);
 assert(a.L.every(l=>l.every(v=>v>=-1e-9)),'L negatif');
 assert(Math.abs(S.auditValue(3,V,r,c,f.B,p.alpha,p.beta,p.kappa,a.xP)-f.A[3])<1e-6);
 assert(S.auditValue(3,V,r,c,f.B,p.alpha,p.beta,p.kappa,a.xP,[0])===0||Math.abs(S.auditValue(3,V,r,c,f.B,p.alpha,p.beta,p.kappa,a.xP,[0]))<1e-9);
 audit.push({share:f.share,n:f.n,max_rel_error:worst,total_ms:ms,ms_per_region:ms/f.n});}
const res=S.simulate(D.kab,p),keys=['merata','kemiskinan','greedy','proporsional','edushield'];
keys.forEach((k,j)=>{const expected=Object.values(D.nasional.alokasi)[j].tercegah;assert(Math.abs(res.evaluated[k]-expected)<1e-6);});
for(const cfg of [p,{...p,share:.3},{...p,share:.8},{...p,remote:.15},{...p,kappa:.8},{...p,kappa:3}]){
 const out=S.simulate(D.kab,cfg);let prev=out.x.merata;
 for(const x of out.hh){assert(x.every((v,i)=>v>=.9*prev[i]-1e-7));assert(Math.abs(S.dot(out.c,x)-out.B)/out.B<1e-9);prev=x;}
 // Skema aktual sengaja tidak meredistribusi sisa pagu (TRD 4.5): biaya + sisaAktual = B; skema lain tepat B.
 for(const [k,x] of Object.entries(out.x)){if(k==='aktual'){assert(S.dot(out.c,x)<=out.B*(1+1e-9)&&Math.abs(S.dot(out.c,x)+out.sisaAktual-out.B)/out.B<1e-9);continue;}assert(Math.abs(S.dot(out.c,x)-out.B)/out.B<1e-9);}
}
assert.throws(()=>S.simulate(D.kab,{...p,share:.1}),/Pagu/);assert.throws(()=>S.simulate(D.kab,{...p,alpha:.7}),/Pagu|batas/);assert.throws(()=>S.simulate(D.kab,{...p,kappa:0}),/Parameter/);
assert.equal(new Set(D.kab.map(d=>d.id)).size,514);assert.equal(new Set(D.kab.map(d=>d.prov)).size,38);
// Skema aktual: data sintetis kecil, hasil tangan sama dengan test_kkt.py (c=1, B=100); tanpa pip_aktual skema tidak muncul
{const kabA=[{V:100,r_hat:.02,r_sim:.02,p0:10,remote:false,pip_aktual:40},{V:50,r_hat:.03,r_sim:.03,p0:12,remote:false,pip_aktual:30},{V:10,r_hat:.04,r_sim:.04,p0:20,remote:false,pip_aktual:20},{V:40,r_hat:.01,r_sim:.01,p0:5,remote:false,pip_aktual:0}];
 const pA={C0:1,remote:0,share:.5,alpha:0,beta:1,kappa:1.74},o=S.simulate(kabA,pA),cA=o.c;
 assert.equal(o.B,100);const w=[40,30,20,0],s=o.B/S.dot(cA,w),want=w.map((v,i)=>Math.min(v*s,kabA[i].V));
 [400/9,100/3,10,0].forEach((v,i)=>assert(Math.abs(want[i]-v)<1e-12));assert(Math.abs(o.sisaAktual-110/9)<1e-12);
 want.forEach((v,i)=>assert(Math.abs(o.x.aktual[i]-v)<1e-12));assert(Math.abs(o.sisaAktual-(o.B-S.dot(cA,want)))<1e-12&&o.sisaAktual>0);
 assert('aktual' in o.evaluated&&Number.isFinite(o.evaluated.aktual));
 const nuAkt=S.simulate(kabA.map(d=>({...d,pip_aktual:null})),pA);assert(!('aktual' in nuAkt.x)&&!('aktual' in nuAkt.evaluated)&&nuAkt.sisaAktual===null);
 const part=S.simulate(kabA.map((d,i)=>i?d:{...d,pip_aktual:null}),pA);assert(!('aktual' in part.x));
 // Sejak M8 data aplikasi memuat pip_aktual untuk 514 wilayah, jadi skema aktual wajib muncul.
 assert(D.kab.every(d=>Number.isFinite(d.pip_aktual))&&('aktual' in S.simulate(D.kab,p).x));}
const report={status:'PASS',checks,rounding,audit,summary_parity:'all 5 schemes < 1e-6 absolute students',hold_harmless:'6 scenarios × 5 years',invalid_scenarios:'rejected'};
fs.mkdirSync(__dirname+'/verification',{recursive:true});fs.writeFileSync(__dirname+'/verification/solver_report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
