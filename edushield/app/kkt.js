/* Costs and budget in million IDR; quotas continuous. No dependencies. */
(function(root){
'use strict';
const sum=a=>a.reduce((s,x)=>s+x,0), dot=(a,b)=>sum(a.map((v,i)=>v*b[i]));
const clip=(v,l,h)=>Math.min(h,Math.max(l,v));
function validate(V,r,c,B,lo,hi,k){
 if(!V.length||[r,c,lo,hi].some(a=>a.length!==V.length)||!Number.isFinite(B)||!(k>0)) throw Error('Parameter tidak valid.');
 V.forEach((v,i)=>{if(![v,r[i],c[i],lo[i],hi[i]].every(Number.isFinite)||v<=0||r[i]<=0||c[i]<=0||lo[i]<0||lo[i]>hi[i]||hi[i]>v)throw Error('Data atau batas kuota tidak valid.');});
 if(B<dot(c,lo)-1e-7||B>dot(c,hi)+1e-7)throw Error('Pagu tidak layak: ubah pagu atau batas cakupan.');
}
function kkt(V,r,c,B,lo,hi,k=1.74){
 validate(V,r,c,B,lo,hi,k);
 let a=Math.log(1e-12),b=Math.log(Math.max(...r.map((r,i)=>k*r/c[i])));
 const allocation=l=>V.map((v,i)=>clip(v/k*Math.log(k*Math.max(r[i],1e-12)/(l*c[i])),lo[i],hi[i]));
 for(let z=0;z<200;z++){const oldA=a,oldB=b,m=(a+b)/2;if(dot(c,allocation(Math.exp(m)))>B)a=m;else b=m;if(a===oldA&&b===oldB)break;}
 const lambda=Math.exp(b);return {x:allocation(lambda),lambda};
}
function fill(order,c,B,lo,hi){let x=lo.slice(),left=B-dot(c,x);for(const i of order){const add=Math.min(hi[i]-x[i],Math.max(0,left/c[i]));x[i]+=add;left-=add*c[i];}return x;}
function proportional(w,c,B,lo,hi){let a=0,b=1;const alloc=m=>w.map((v,i)=>clip(m*v,lo[i],hi[i]));while(dot(c,alloc(b))<B-1e-8)b*=2;for(let z=0;z<200;z++){const oldA=a,oldB=b,m=(a+b)/2;if(dot(c,alloc(m))<B)a=m;else b=m;if(a===oldA&&b===oldB)break;}return alloc(b);}
function benefit(x,V,r,k=1.74){return sum(x.map((v,i)=>V[i]*r[i]*(-Math.expm1(-k*v/V[i]))));}
// Skema "aktual" (TRD 4.5); setara scheme_actual di edushield.py. Sisa pagu setelah pemotongan ke [0,V] tidak diredistribusi.
// Hanya bila SEMUA wilayah punya pip_aktual (angka berhingga >=0, jumlah >0); selain itu null (tanpa nilai nol).
function actualScheme(kab,c,B){
 const w=kab.map(d=>d.pip_aktual);
 if(!w.length||!w.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0)||sum(w)<=0)return null;
 const s=B/dot(c,w),x=w.map((v,i)=>clip(v*s,0,kab[i].V));return {x,sisa:B-dot(c,x)};
}
function simulate(kab,p){
 const V=kab.map(d=>d.V),r=kab.map(d=>d.r_hat),c=kab.map(d=>p.C0*(d.remote?1+p.remote:1));
 // share refers to weighted full-coverage cost under the CURRENT cost scenario.
 const B=p.share*dot(c,V),lo=V.map(v=>p.alpha*v),hi=V.map(v=>p.beta*v);
 const result=kkt(V,r,c,B,lo,hi,p.kappa),order=key=>kab.map((_,i)=>i).sort((a,b)=>key(b)-key(a));
 const x={merata:V.map(v=>p.share*v),kemiskinan:fill(order(i=>kab[i].p0),c,B,lo,hi),greedy:fill(order(i=>r[i]),c,B,lo,hi),proporsional:proportional(V.map((v,i)=>v*r[i]),c,B,lo,hi),edushield:result.x,
 oracle:kkt(V,kab.map(d=>d.r_sim),c,B,lo,hi,p.kappa).x};
 const akt=actualScheme(kab,c,B);if(akt)x.aktual=akt.x;
 let prev=x.merata.slice();const hh=[];
 for(let t=0;t<5;t++){prev=kkt(V,r,c,B,lo.map((v,i)=>Math.max(v,.9*prev[i])),hi,p.kappa).x;hh.push(prev);}
 return {V,r,c,B,x,hh,sisaAktual:akt?akt.sisa:null,lambda:result.lambda,modeled:Object.fromEntries(Object.entries(x).map(([k,a])=>[k,benefit(a,V,r,p.kappa)])),evaluated:Object.fromEntries(Object.entries(x).map(([k,a])=>[k,benefit(a,V,kab.map(d=>d.r_sim),p.kappa)]))};
}
// Pembulatan kuota (TRD 4.1); setara dengan round_quota di edushield.py. Seri: indeks terkecil menang.
// sisa < c_i hanya pasti untuk wilayah yang belum menyentuh floor(hi); jika ceil(lo) > floor(hi) batas atas menang (bentrok).
function roundQuota(x,V,rho,c,B,lo,hi,k=1.74){
 const E=1e-9,n=x.length,zhi=hi.map(v=>Math.floor(v+E)),zlo0=lo.map(v=>Math.ceil(v-E)),zlo=zlo0.map((v,i)=>Math.min(v,zhi[i]));
 const bentrok=[];zlo0.forEach((v,i)=>{if(v>zhi[i])bentrok.push(i);});
 const z=x.map((v,i)=>Math.min(Math.max(zlo[i],Math.floor(v+E)),zhi[i]));
 const gain=(i,m)=>V[i]*rho[i]*(Math.exp(-k*(m-1)/V[i])-Math.exp(-k*m/V[i]))/c[i];
 let sisa=B-dot(c,z);const turun=new Set();
 while(sisa<-E){let bi=-1,bg=0;for(let i=0;i<n;i++)if(z[i]>zlo[i]){const g=gain(i,z[i]);if(bi<0||g<bg){bi=i;bg=g;}}
  if(bi<0)break;z[bi]--;sisa+=c[bi];turun.add(bi);}
 const layak=sisa>=-E;if(layak)sisa=Math.max(sisa,0);
 const g=z.map((v,i)=>v+1<=zhi[i]?gain(i,v+1):-1);
 for(;;){let bi=-1;for(let i=0;i<n;i++)if(z[i]+1<=zhi[i]&&c[i]<=sisa+E&&(bi<0||g[i]>g[bi]))bi=i;
  if(bi<0)break;z[bi]++;sisa-=c[bi];g[bi]=z[bi]+1<=zhi[bi]?gain(bi,z[bi]+1):-1;}
 if(layak)sisa=Math.max(sisa,0);
 const bx=benefit(x,V,rho,k),bz=benefit(z,V,rho,k);
 return {z,sisa,loss:bx-bz,lossPct:100*(bx-bz)/bx,turun:[...turun].sort((a,b)=>a-b),bentrok,layak};
}
// Nilai audit data (TRD 4.3); setara dengan audit_value di edushield.py. Satu wilayah per panggilan agar layar bisa
// menghitung bertahap. xP = kkt(V).x diteruskan (hitung sekali). Lantai rencana setelah audit alpha*min(V,V') (TRD 4.3) membuat x~P selalu layak, jadi L>=0.
function auditLoss(i,V,rho,c,B,alpha,beta,k,xP,deltas=[-.25,.25]){
 return deltas.map(d=>{const V2=V.slice();V2[i]*=1+d;
  const xS=kkt(V2,rho,c,B,V2.map((v,j)=>alpha*Math.min(V[j],v)),V2.map(v=>beta*v),k).x;
  return benefit(xS,V2,rho,k)-benefit(xP.map((v,j)=>Math.min(v,beta*V2[j])),V2,rho,k);});
}
function auditValue(i,V,rho,c,B,alpha,beta,k,xP,deltas){const L=auditLoss(i,V,rho,c,B,alpha,beta,k,xP,deltas);return sum(L)/L.length;}
function auditAll(V,rho,c,B,alpha,beta,k,idx,deltas){
 const xP=kkt(V,rho,c,B,V.map(v=>alpha*v),V.map(v=>beta*v),k).x;idx=idx||V.map((_,i)=>i);
 const L=idx.map(i=>auditLoss(i,V,rho,c,B,alpha,beta,k,xP,deltas));return {A:L.map(l=>sum(l)/l.length),L,idx,xP};
}
const api={sum,dot,kkt,benefit,simulate,actualScheme,roundQuota,auditLoss,auditValue,auditAll};root.EduSolver=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
