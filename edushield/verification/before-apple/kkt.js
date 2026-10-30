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
 for(let z=0;z<200;z++){const m=(a+b)/2;if(dot(c,allocation(Math.exp(m)))>B)a=m;else b=m;}
 const lambda=Math.exp(b);return {x:allocation(lambda),lambda};
}
function fill(order,c,B,lo,hi){let x=lo.slice(),left=B-dot(c,x);for(const i of order){const add=Math.min(hi[i]-x[i],Math.max(0,left/c[i]));x[i]+=add;left-=add*c[i];}return x;}
function proportional(w,c,B,lo,hi){let a=0,b=1;const alloc=m=>w.map((v,i)=>clip(m*v,lo[i],hi[i]));while(dot(c,alloc(b))<B-1e-8)b*=2;for(let z=0;z<200;z++){let m=(a+b)/2;if(dot(c,alloc(m))<B)a=m;else b=m;}return alloc(b);}
function benefit(x,V,r,k=1.74){return sum(x.map((v,i)=>V[i]*r[i]*(-Math.expm1(-k*v/V[i]))));}
function simulate(kab,p){
 const V=kab.map(d=>d.V),r=kab.map(d=>d.r_hat),c=kab.map(d=>p.C0*(d.remote?1+p.remote:1));
 // share refers to weighted full-coverage cost under the CURRENT cost scenario.
 const B=p.share*dot(c,V),lo=V.map(v=>p.alpha*v),hi=V.map(v=>p.beta*v);
 const result=kkt(V,r,c,B,lo,hi,p.kappa),order=key=>kab.map((_,i)=>i).sort((a,b)=>key(b)-key(a));
 const x={merata:V.map(v=>p.share*v),kemiskinan:fill(order(i=>kab[i].p0),c,B,lo,hi),greedy:fill(order(i=>r[i]),c,B,lo,hi),proporsional:proportional(V.map((v,i)=>v*r[i]),c,B,lo,hi),edushield:result.x,
 oracle:kkt(V,kab.map(d=>d.r_sim),c,B,lo,hi,p.kappa).x};
 let prev=x.merata.slice();const hh=[];
 for(let t=0;t<5;t++){prev=kkt(V,r,c,B,lo.map((v,i)=>Math.max(v,.9*prev[i])),hi,p.kappa).x;hh.push(prev);}
 return {V,r,c,B,x,hh,lambda:result.lambda,modeled:Object.fromEntries(Object.entries(x).map(([k,a])=>[k,benefit(a,V,r,p.kappa)])),evaluated:Object.fromEntries(Object.entries(x).map(([k,a])=>[k,benefit(a,V,kab.map(d=>d.r_sim),p.kappa)]))};
}
const api={sum,dot,kkt,benefit,simulate};root.EduSolver=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
