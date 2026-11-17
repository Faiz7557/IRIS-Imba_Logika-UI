'use strict';
/* Bejana (TRD §5): syarat KKT sebagai bejana. SVG murni, tanpa dependensi.
   Satu bejana per wilayah; bejana "tergantung" dari bibir di atas (kedalaman ke bawah).
   Sumbu tegak = manfaat tambahan per rupiah m (siswa / Rp1 miliar), SKALA LOG, makin dalam makin besar.
   - kedalaman bejana  : dari bibir sampai ln m0, m0 = κ·ρᵢ/cᵢ (manfaat tambahan awal)
   - isian (air)       : naik dari dasar sampai permukaan ln m(x) = ln m0 − κ·xᵢ/Vᵢ. Pada skala log, tinggi air = κ·xᵢ/Vᵢ,
                         jadi tinggi isian sebanding dengan xᵢ/Vᵢ (TRD) dan luasnya sebanding dengan kuota.
   - garis mendatar    : λ* (harga bayangan). Syarat KKT: wilayah interior bermuka air tepat di garis.
                         Wilayah di lantai α: dipaksa terisi lebih, muka air di ATAS garis (▼).
                         Wilayah di batas atas β: tidak boleh terisi lebih, muka air di BAWAH garis (▲).
   - lebar bejana      : ~ √Vᵢ (bukan Vᵢ linear: rasio kebutuhan antarwilayah sampai 27×, bejana kecil tak terbaca).
   update(state) hanya mengubah atribut dan teks; DOM tidak dibangun ulang, jadi drag penggeser tak putus. */
(function(){
const NS='http://www.w3.org/2000/svg',E=1e-6;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nfm=d=>new Intl.NumberFormat('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d}),n0=nfm(0),n1=nfm(1),n2=nfm(2);
const el=(tag,at,parent,text)=>{const e=document.createElementNS(NS,tag);for(const k in at)e.setAttribute(k,at[k]);if(text!=null)e.textContent=text;if(parent)parent.appendChild(e);return e;};
const setA=(e,k,v)=>{if(e.getAttribute(k)!==v)e.setAttribute(k,v);};
const setT=(e,t)=>{if(e.textContent!==t)e.textContent=t;};
const R=v=>String(Math.round(v*10)/10);
const SIMBOL={floor:'▼',cap:'▲',int:'●'},KATA={floor:'lantai',cap:'batas atas',int:'interior'},KATA_T={floor:'Lantai α',cap:'Batas atas β',int:'Interior'};
const TICKS=[.5,1,2,5,10,20,50,100,200,500,1000];
const ML=46,MR=58,SLOT=56,T=92,H=250;

/* Aturan pilihan wilayah (deterministik, dari skenario bawaan D.meta.params dan kuota D.kab[i].x.edushield):
   1. Lima contoh esai tetap: Supiori, Nduga, Sumba Tengah (batas atas), Kota Yogyakarta, Kota Surabaya (lantai).
   2. Satu wilayah lantai tambahan dengan r_hat tertinggi di antara yang di lantai (bukan contoh).
   3. Empat wilayah interior pada kuantil 0, 1/3, 2/3, 1 dari urutan r_hat menurun di antara yang interior (bukan contoh).
   4. Wilayah yang dipilih pengguna (extra), bila belum termasuk. Total 10-11 (maks 12). Urutan tampil: r_hat menurun.
   Status di sini hanya dasar pemilihan; status tampil dihitung ulang tiap update. */
function pilih(D,extra){
 const P=D.meta.params,K=D.kab,idx=n=>K.findIndex(d=>d.nama===n);
 const contoh=['Supiori','Nduga','Sumba Tengah','Kota Yogyakarta','Kota Surabaya'].map(idx).filter(i=>i>=0);
 const st=i=>{const x=K[i].x.edushield,V=K[i].V;return x<=P.alpha*V*(1+E)?'floor':x>=P.beta*V*(1-E)?'cap':'int';};
 const byR=a=>a.slice().sort((a,b)=>K[b].r_hat-K[a].r_hat||a-b),all=K.map((_,i)=>i).filter(i=>!contoh.includes(i));
 const chosen=contoh.slice(),lantai=byR(all.filter(i=>st(i)==='floor'))[0];if(lantai!=null)chosen.push(lantai);
 const inte=byR(all.filter(i=>st(i)==='int'));
 for(const q of [0,1/3,2/3,1]){const i=inte[Math.round(q*(inte.length-1))];if(i!=null&&!chosen.includes(i))chosen.push(i);}
 if(extra!=null&&extra>=0&&!chosen.includes(extra)&&chosen.length<12)chosen.push(extra);
 return byR(chosen);
}

let cur=null;
function create(container,items,opts){
 opts=opts||{};const n=items.length,W=ML+MR+n*SLOT,Hh=T+H+58,Vmax=Math.max(...items.map(d=>d.V));
 container.textContent='';
 const root=document.createElement('div');root.className='bejana';container.appendChild(root);
 const scroll=document.createElement('div');scroll.className='bj-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Bejana kuota per wilayah, dapat digulir mendatar');root.appendChild(scroll);
 const svg=el('svg',{class:'bj-svg',viewBox:`0 0 ${W} ${Hh}`,role:'img','aria-labelledby':'bj-title bj-desc',focusable:'false'},scroll);
 el('title',{id:'bj-title'},svg,'Bejana kuota per wilayah');
 el('desc',{id:'bj-desc'},svg,`${n} wilayah terpilih. Tiap bejana menunjukkan kuota yang mengisi wilayah itu; garis mendatar adalah harga bayangan (λ*). Ringkasan teks dan tabel setara ada di bawah gambar.`);
 const defs=el('defs',{},svg),pat=el('pattern',{id:'bj-hatch',width:'6',height:'6',patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);el('line',{x1:'0',y1:'0',x2:'0',y2:'6',class:'bj-hatchline'},pat);
 const gGrid=el('g',{class:'bj-grid','aria-hidden':'true'},svg),ticks=TICKS.map(v=>({v,line:el('line',{x1:ML,x2:W-MR+6},gGrid),text:el('text',{x:ML-6,'text-anchor':'end'},gGrid,n0.format(v))}));
 el('text',{class:'bj-axis',transform:`translate(11 ${T+H/2}) rotate(-90)`,'text-anchor':'middle','aria-hidden':'true'},svg,'siswa / Rp1 miliar · skala log');
 el('line',{class:'bj-rimline',x1:ML,x2:W-MR+6,y1:T,y2:T},svg);
 const vs=items.map((d,k)=>{
  const cx=ML+SLOT*(k+.5),w=22+30*Math.sqrt(d.V/Vmax),g=el('g',{class:'bj-v'},svg);
  const nm=d.nama.length>16?d.nama.slice(0,15)+'…':d.nama;
  const label=el('text',{class:'bj-name',transform:`translate(${R(cx-4)} ${T-9}) rotate(-40)`},g,nm);el('title',{},label,d.nama+(d.prov?' — '+d.prov:''));
  const water=el('rect',{class:'bj-water',x:R(cx-w/2),width:R(w)},g),hatch=el('rect',{class:'bj-hatch',x:R(cx-w/2),width:R(w),fill:'url(#bj-hatch)'},g),vessel=el('path',{class:'bj-vessel'},g),surf=el('line',{class:'bj-surf',x1:R(cx-w/2),x2:R(cx+w/2)},g);
  const yl=T+H+18;
  return {d,g,cx,w,water,hatch,vessel,surf,sym:el('text',{class:'bj-sym',x:R(cx),y:yl,'text-anchor':'middle'},g),word:el('text',{class:'bj-word',x:R(cx),y:yl+14,'text-anchor':'middle'},g),pct:el('text',{class:'bj-pct',x:R(cx),y:yl+28,'text-anchor':'middle'},g),status:'',row:null};
 });
 const lam=el('g',{class:'bj-lam','aria-hidden':'true'},svg);el('line',{x1:ML,x2:W-MR+6,y1:'0',y2:'0',class:'bj-lamline'},lam);
 const lamT=el('text',{x:ML+4,y:'-6','text-anchor':'start',class:'bj-lamtext'},lam,'λ*');
 const sum=document.createElement('p');sum.className='bj-summary';sum.setAttribute('aria-live','polite');sum.setAttribute('aria-atomic','true');root.appendChild(sum);
 const leg=document.createElement('ul');leg.className='bj-legend';leg.innerHTML='<li><span aria-hidden="true">●</span> interior: muka air tepat di garis λ*</li><li><span aria-hidden="true">▼</span> lantai α: dipaksa terisi, muka air di atas garis</li><li><span aria-hidden="true">▲</span> batas atas β: penuh, muka air di bawah garis</li>';root.appendChild(leg);
 let table=null;
 if(opts.table!==false){
  const det=document.createElement('details');det.className='bj-details';det.innerHTML='<summary>Tabel setara bejana</summary><div class="table-wrap"><table><thead><tr><th>Wilayah</th><th class="num">Kebutuhan (proksi)</th><th class="num">Kuota</th><th class="num">Cakupan</th><th>Posisi</th></tr></thead><tbody></tbody></table></div>';
  const tb=det.querySelector('tbody');
  vs.forEach(v=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(v.d.nama)}</td><td class="num"></td><td class="num"></td><td class="num"></td><td></td>`;tb.appendChild(tr);v.row=[...tr.children].slice(1);});
  det.querySelector('.table-wrap').tabIndex=0;det.querySelector('.table-wrap').setAttribute('role','region');det.querySelector('.table-wrap').setAttribute('aria-label','Tabel setara bejana');
  root.appendChild(det);table=det;
 }
 const inst={root,svg,items,vs,ticks,lam,lamT,sum,table,W,timer:0,lastSum:'',update:s=>update(s,inst)};
 cur=inst;return inst;
}

function update(s,inst){
 inst=inst||cur;if(!inst||!s)return;
 const {vs,ticks}=inst,k=s.kappa,lamM=s.lambda*1000,N=vs.length;
 const lm0=new Array(N);let lo=Infinity,hi=-Infinity;
 for(let i=0;i<N;i++){const l=Math.log(k*vs[i].d.rho/s.c[i]*1000);lm0[i]=l;if(l<lo)lo=l;if(l>hi)hi=l;}
 let lnMin=lo-k-.12,lnMax=hi+.12;const ll=Math.log(lamM);
 if(ll-.15<lnMin)lnMin=ll-.15;if(ll+.15>lnMax)lnMax=ll+.15;
 const sc=H/(lnMax-lnMin),Y=l=>T+(l-lnMin)*sc;
 let nf=0,nc=0,ni=0;
 for(let i=0;i<N;i++){
  const v=vs[i],V=v.d.V,x=s.x[i],tol=E*V,st=x<=s.lo[i]+tol?'floor':x>=s.hi[i]-tol?'cap':'int';
  if(st==='floor')nf++;else if(st==='cap')nc++;else ni++;
  const yb=Y(lm0[i]),ys=Math.max(T,Y(lm0[i]-k*x/V)),x0=v.cx-v.w/2,x1=v.cx+v.w/2;
  setA(v.vessel,'d',`M${R(x0)} ${T}V${R(yb)}H${R(x1)}V${T}`);
  const wy=R(ys),wh=R(Math.max(0,yb-ys));
  setA(v.water,'y',wy);setA(v.water,'height',wh);setA(v.hatch,'y',wy);setA(v.hatch,'height',wh);setA(v.surf,'y1',wy);setA(v.surf,'y2',wy);
  if(st!==v.status){v.status=st;setA(v.g,'data-status',st);setA(v.g,'class','bj-v is-'+st);setT(v.sym,SIMBOL[st]);setT(v.word,KATA[st]);}
  const cov=x/V;setT(v.pct,n0.format(100*cov)+'%');
  if(v.row){setT(v.row[0],n0.format(V));setT(v.row[1],n1.format(x));setT(v.row[2],n0.format(100*cov)+'%');setT(v.row[3],(st==='int'?'● ':st==='cap'?'▲ ':'▼ ')+KATA_T[st]);}
 }
 for(const t of ticks){const l=Math.log(t),ok=l>lnMin&&l<lnMax;if(ok){const y=R(Y(l));setA(t.line,'y1',y);setA(t.line,'y2',y);setA(t.text,'y',R(Y(l)+3.5));setA(t.line,'visibility','visible');setA(t.text,'visibility','visible');}else{setA(t.line,'visibility','hidden');setA(t.text,'visibility','hidden');}}
 inst.lam.style.transform=`translateY(${R(Y(ll))}px)`;
 setT(inst.lamT,`λ* = ${n2.format(lamM)}`);
 const msg=`Harga bayangan λ* = ${n2.format(lamM)} siswa per Rp1 miliar · simulasi. Dari ${N} wilayah terpilih: ${nf} di lantai (α), ${nc} di batas atas (β), ${ni} interior.`;
 inst.pending=msg;
 if(!inst.lastSum){inst.lastSum=msg;inst.sum.textContent=msg;}
 else{clearTimeout(inst.timer);inst.timer=setTimeout(()=>{inst.lastSum=inst.pending;inst.sum.textContent=inst.pending;},200);}
}

window.EduViz=window.EduViz||{};
window.EduViz.bejana={pilih,create,update:s=>update(s,cur)};
})();
