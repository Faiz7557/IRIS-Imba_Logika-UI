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
const res=S.simulate(D.kab,p),keys=['merata','kemiskinan','greedy','proporsional','edushield'];
keys.forEach((k,j)=>{const expected=Object.values(D.nasional.alokasi)[j].tercegah;assert(Math.abs(res.evaluated[k]-expected)<1e-6);});
for(const cfg of [p,{...p,share:.3},{...p,share:.8},{...p,remote:.15},{...p,kappa:.8},{...p,kappa:3}]){
 const out=S.simulate(D.kab,cfg);let prev=out.x.merata;
 for(const x of out.hh){assert(x.every((v,i)=>v>=.9*prev[i]-1e-7));assert(Math.abs(S.dot(out.c,x)-out.B)/out.B<1e-9);prev=x;}
 for(const x of Object.values(out.x))assert(Math.abs(S.dot(out.c,x)-out.B)/out.B<1e-9);
}
assert.throws(()=>S.simulate(D.kab,{...p,share:.1}),/Pagu/);assert.throws(()=>S.simulate(D.kab,{...p,alpha:.7}),/Pagu|batas/);assert.throws(()=>S.simulate(D.kab,{...p,kappa:0}),/Parameter/);
assert.equal(new Set(D.kab.map(d=>d.id)).size,514);assert.equal(new Set(D.kab.map(d=>d.prov)).size,38);
const report={status:'PASS',checks,summary_parity:'all 5 schemes < 1e-6 absolute students',hold_harmless:'6 scenarios × 5 years',invalid_scenarios:'rejected'};
fs.mkdirSync(__dirname+'/verification',{recursive:true});fs.writeFileSync(__dirname+'/verification/solver_report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
