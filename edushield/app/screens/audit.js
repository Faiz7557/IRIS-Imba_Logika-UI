'use strict';
/* U5: layar Audit data (langkah 3, fitur hero F3). Nilai audit per wilayah (TRD 4.3): siswa tertahan bila kebutuhan wilayah itu
   meleset -25% atau +25% dari proksi. Nilai bawaan dibaca dari kab[i].audit bila ada; selain itu dihitung bertahap di peramban
   (CHUNK wilayah per requestAnimationFrame) memakai EduSolver.auditLoss (dasar auditValue; L(-25%) dan L(+25%) diperlukan tabel). */
(function(){
const DELTAS=[-.25,.25],CHUNK=20,OPSI=[10,20,50],AWAL=50;
let N=20,semua=false,cache=null,job=null,batalSig=null,pesan='',painted=null,narrow=null;
const sig=()=>JSON.stringify([params,EduStore.get().koreksi.filter(k=>k.status==='diterima').map(k=>[k.wilayah,k.bidang,k.nilai_usul])]);
const nKoreksi=()=>EduStore.get().koreksi.filter(k=>k.status==='diterima').length;
const scen=P=>`porsi anggaran ${pct(P.share,0)}, cakupan ${pct(P.alpha,0)}–${pct(P.beta,0)}, κ ${fmt(P.kappa,2)}${nKoreksi()?`, ${nKoreksi()} koreksi data diterima`:''}`;
const isNarrow=()=>matchMedia('(max-width:700px)').matches;
const sr=(i)=>D.kab[i];
function susun(A,L,extra){const n=A.length,order=A.map((_,i)=>i).sort((a,b)=>A[b]-A[a]||a-b),total=A.reduce((s,v)=>s+v,0)||1;let c=0;
 const cum=order.map(i=>(c+=A[i])/total),s=[...A].sort((a,b)=>a-b),median=n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;return {A,L,order,total,cum,median,...extra};}
// Nilai bawaan dari paket data (skenario bawaan, tanpa koreksi). Bentuk yang dikenali: kab[i].audit={A,L:[L(-25%),L(+25%)]} (atau Lm/Lp).
function dariData(){if(!defaults()||EduStore.terapkan(D.kab)!==D.kab)return null;const A=[],L=[];
 for(const d of D.kab){const a=d.audit;if(!a||!Number.isFinite(a.A))return null;const l=a.L||[a.Lm,a.Lp];if(!(Number.isFinite(l[0])&&Number.isFinite(l[1])))return null;A.push(a.A);L.push([l[0],l[1]]);}
 return susun(A,L,{sig:'bawaan',sumber:'data',skenario:scen(D.meta.params)});}
function current(){const s=sig();if(cache&&cache.sig===s)return {c:cache,ok:true};const d=dariData();if(d)return {c:d,ok:true};return {c:cache,ok:false};}
const perlu=()=>!current().c&&batalSig!==sig();

function batal(diam){if(job){cancelAnimationFrame(job.id);job=null;}if(!diam)batalSig=sig();}
function mulai(){
 batal(true);batalSig=null;
 const R=result,P={...params},s=sig(),n=R.V.length,A=new Array(n),L=new Array(n),t0=performance.now(),J=job={sig:s,i:0,n,id:0};
 const step=()=>{if(job!==J)return;const e=Math.min(n,J.i+CHUNK);
  for(;J.i<e;J.i++){const l=S.auditLoss(J.i,R.V,R.r,R.c,R.B,P.alpha,P.beta,P.kappa,R.x.edushield,DELTAS);L[J.i]=l;A[J.i]=(l[0]+l[1])/2;}
  const bar=document.getElementById('au-prog');
  if(bar){bar.setAttribute('aria-valuenow',J.i);bar.setAttribute('aria-valuetext',`${J.i} dari ${n} wilayah`);bar.firstElementChild.style.width=(100*J.i/n)+'%';document.getElementById('au-prog-t').textContent=`${fmt(J.i)} dari ${fmt(n)} wilayah · ${fmt(100*J.i/n,0)}%`;}
  if(J.i<n){J.id=requestAnimationFrame(step);return;}
  cache=susun(A,L,{sig:s,sumber:'hitung',ms:performance.now()-t0,skenario:scen(P)});job=null;
  if(document.getElementById('au-body')){paint();const h=document.getElementById('au-h2');document.getElementById('au-live').textContent='Nilai audit selesai dihitung untuk skenario aktif.';h&&h.focus({preventScroll:true});}};
 J.id=requestAnimationFrame(step);}

const marks=()=>{const m=new Map();for(const e of EduStore.get().log)if(e.aksi==='tandai_audit')m.set(e.wilayah,e);return m;};
const boleh=()=>role!=='B'&&EduStore.get().status!=='final';
const alasanTolak=()=>role==='B'?'Menandai wilayah hanya tersedia untuk peran Analis pusat.':EduStore.get().status==='final'?'Usulan sudah final; wilayah tidak dapat ditandai lagi.':'';
function tandaBtn(i,m){const d=sr(i),on=m.has(d.nama),off=!on&&!boleh();
 return `<button type="button" class="au-mark${on?' is-on':''}" data-au="tandai" data-i="${i}"${on||off?' disabled':''} aria-label="${on?'Sudah ditandai untuk audit':'Tandai untuk audit'}: ${esc(d.nama)}">${on?'✓ Ditandai':'Tandai untuk audit'}</button>`;}
function ditandaiHtml(m){return `<h2>Wilayah yang ditandai untuk audit</h2>`+(m.size?`<ul class="au-list">${[...m.values()].map(e=>`<li><strong>${esc(e.wilayah)}</strong> · nilai audit ${fmt(e.nilai_audit,2)} siswa tertahan · simulasi</li>`).join('')}</ul>`:'<p class="muted">Belum ada wilayah yang ditandai. Tombol “Tandai untuk audit” pada tabel mencatat satu entri di log alur usulan (perangkat ini). Pengiriman permintaan verifikasi ke dinas dilakukan di langkah Usulan & koreksi.</p>')+(alasanTolak()?`<p class="muted" role="note">${esc(alasanTolak())}</p>`:'');}

function kontrol(c,ok){
 const st=!c?'Belum ada nilai audit untuk skenario ini.':c.sumber==='data'?`Nilai bawaan dari paket data, skenario bawaan (${esc(c.skenario)}).`:`Dihitung di peramban ini dalam ${fmt(c.ms,0)} ms untuk skenario: ${esc(c.skenario)}.`;
 return `<div class="au-ctl"><button type="button" class="${ok?'':'primary'}" data-au="hitung">Hitung ulang untuk skenario aktif</button><span class="muted" id="au-status">${st}</span></div>`+
  (c&&!ok?`<p class="notice warn" role="note">Nilai di bawah dihitung untuk skenario lain (${esc(c.skenario)}). Skenario aktif sekarang: ${esc(scen(params))}. Tekan “Hitung ulang untuk skenario aktif” agar peringkat sesuai.</p>`:'');}
function progres(){return `<section class="panel au-run" aria-busy="true"><h2 id="au-h2" tabindex="-1">Menghitung nilai audit</h2><p>Setiap wilayah digeser −25% dan +25% satu per satu, lalu kuota disusun ulang dua kali. Layar tetap dapat dipakai selama perhitungan; Anda dapat membatalkannya.</p>
<div class="au-prog" id="au-prog" role="progressbar" aria-label="Kemajuan perhitungan nilai audit" aria-valuemin="0" aria-valuemax="${job.n}" aria-valuenow="${job.i}" aria-valuetext="${job.i} dari ${job.n} wilayah"><span style="width:${100*job.i/job.n}%"></span></div>
<p class="muted" id="au-prog-t">${fmt(job.i)} dari ${fmt(job.n)} wilayah · ${fmt(100*job.i/job.n,0)}%</p><button type="button" data-au="batal">Batalkan perhitungan</button></section>`;}
function kosong(){return kontrol(null,false)+`<section class="panel"><h2 id="au-h2" tabindex="-1">Perhitungan dibatalkan</h2><p>Belum ada peringkat untuk skenario aktif. Tekan “Hitung ulang untuk skenario aktif” untuk menghitung 514 wilayah.</p></section>`;}

function hasil(c){
 const n=c.A.length,k=Math.min(N,n),X=c.cum[k-1],top=c.order.slice(0,k),m=marks(),rows=c.order.slice(0,semua?n:Math.min(AWAL,n));
 const fig=EduViz.pareto.html({vals:top.map(i=>c.A[i]),names:top.map(i=>sr(i).nama),cum:c.cum.slice(0,k),unit:'siswa tertahan',narrow:narrow=isNarrow(),total:c.total});
 return `<section class="panel au-hero"><h2 id="au-h2" tabindex="-1">Seberapa terkonsentrasi nilai audit?</h2>
<p class="au-big">Audit <strong>${fmt(k)}</strong> wilayah teratas menangkap <strong class="au-x">${fmt(100*X,1)}%</strong> nilai audit <span class="au-tag">simulasi</span></p>
<div class="au-seg" role="group" aria-label="Jumlah wilayah teratas yang diaudit">${OPSI.map(v=>`<button type="button" data-au="n" data-n="${v}" aria-pressed="${v===k}">${v} teratas</button>`).join('')}</div>
<p class="muted">Total nilai audit ${fmt(c.total,1)} siswa tertahan dari ${fmt(n)} wilayah; median ${fmt(c.median,2)} per wilayah. Nilai audit satu wilayah = rata-rata siswa tertahan bila kebutuhannya meleset −25% atau +25% dari proksi, lalu kuota direncanakan dengan angka yang salah.</p>${fig}</section>
<section class="panel"><h2>Peringkat ${fmt(n)} wilayah menurut nilai audit</h2><p class="muted">Menampilkan ${fmt(rows.length)} dari ${fmt(n)} wilayah, nilai audit menurun. <button type="button" class="quiet" data-au="semua">${semua?`Tampilkan ${AWAL} teratas`:`Tampilkan semua ${fmt(n)}`}</button></p>
<div class="table-wrap"><table class="au-tbl"><thead><tr><th class="num">#</th><th>Wilayah / provinsi</th><th class="num">Nilai audit A (siswa tertahan)</th><th class="num">L(−25%)</th><th class="num">L(+25%)</th><th>Tindakan</th></tr></thead><tbody>${rows.map((i,r)=>{const d=sr(i);
  return `<tr><td class="num">${r+1}</td><td>${esc(d.nama)}<br><small class="muted">${esc(d.prov)}</small></td><td class="num"><strong>${fmt(c.A[i],2)}</strong></td><td class="num">${fmt(c.L[i][0],2)}</td><td class="num">${fmt(c.L[i][1],2)}</td><td class="au-act"><a href="#peta" data-au-prof="${i}" aria-label="Buka profil ${esc(d.nama)} di peta">Profil →</a> ${tandaBtn(i,m)}</td></tr>`;}).join('')}</tbody></table></div>
<p class="muted">L(δ) = siswa tertahan yang hilang bila kebutuhan wilayah itu ternyata meleset δ dari proksi dan kuota tetap direncanakan dengan proksi. Semua angka simulasi.</p></section>`;}

function body(){if(job)return progres();const {c,ok}=current();painted=sig();return c?kontrol(c,ok)+hasil(c):kosong();}
function paint(){const el=document.getElementById('au-body');if(!el)return;el.innerHTML=body();EduUI.tables();}
function refreshMarks(){if(!document.getElementById('au-body'))return;const m=marks();document.querySelectorAll('[data-au="tandai"]').forEach(b=>{const d=sr(+b.dataset.i),on=m.has(d.nama);b.disabled=on||!boleh();b.classList.toggle('is-on',on);b.textContent=on?'✓ Ditandai':'Tandai untuk audit';b.setAttribute('aria-label',(on?'Sudah ditandai untuk audit':'Tandai untuk audit')+': '+d.nama);});
 const p=document.getElementById('au-ditandai');if(p)p.innerHTML=ditandaiHtml(m);const e=document.getElementById('au-msg');if(e)e.textContent=pesan;}

const DEF=`<p>Untuk setiap wilayah <i>i</i> dan galat δ ∈ {−${fmt(.25,2)}; +${fmt(.25,2)}}:</p><ol>
<li><b>V′</b>: salinan V dengan hanya V′<sub>i</sub> = V<sub>i</sub>(1+δ).</li>
<li><b>xᴾ</b>: kuota rencana dari model dengan V (proksi), batas cakupan [αV<sub>j</sub>, βV<sub>j</sub>]. Dihitung sekali.</li>
<li><b>xˢ</b>: kuota setelah wilayah diaudit, dari model dengan V′, batas [α·min(V<sub>j</sub>,V′<sub>j</sub>), βV′<sub>j</sub>]. Lantai memakai nilai yang lebih kecil agar rencana lama tetap layak sehingga L ≥ 0.</li>
<li><b>x̃ᴾ</b> = min(xᴾ, βV′): kuota rencana di atas kapasitas sebenarnya tidak memberi manfaat.</li>
<li><b>L<sub>i</sub>(δ)</b> = Σ<sub>j</sub> b(xˢ<sub>j</sub>; V′<sub>j</sub>) − Σ<sub>j</sub> b(x̃ᴾ<sub>j</sub>; V′<sub>j</sub>), dengan b(x; V) = V·ρ·(1 − e<sup>−κx/V</sup>), dalam siswa tertahan.</li>
<li><b>Nilai audit A<sub>i</sub></b> = ½ [L<sub>i</sub>(−${fmt(.25,2)}) + L<sub>i</sub>(+${fmt(.25,2)})]. Peringkat menurun; kurva kumulatif = porsi ΣA yang ditangkap N wilayah teratas.</li></ol>`;
const BATAS=`<div class="notice warn au-batas" role="note"><strong>Dua batas pendekatan.</strong> (1) Hanya satu wilayah digeser dalam satu waktu: galat yang terjadi bersamaan di banyak wilayah, misalnya satu sumber data yang salah untuk seluruh provinsi, tidak tercakup. (2) Besar galat 25% adalah asumsi, bukan galat terukur dari sumber data. Angka di layar ini simulasi.</div>`;

function audit(){
 if(perlu())mulai();
 const lama=(()=>{try{return (EduScreens.robustness()||'').replace(/^<div class="heading">.*?<\/p><\/div><\/div>/,'');}catch(e){return '';}})();
 return `<div class="heading"><div><span class="page-context">Langkah 3 · ${EduApp.role==="B"?"Ruang Dinas Pendidikan":"Ruang analis pusat"}</span><h1>Audit data</h1><p class="sub">Sebelum usulan dikirim, data wilayah mana yang paling layak diperiksa dulu?</p></div></div>
<p class="au-sim"><b>Data simulasi.</b> Galat kebutuhan ±${fmt(25,0)}% di satu wilayah per kali adalah asumsi · skenario aktif: ${esc(scen(params))}.</p>
<p id="au-live" class="au-live" role="status"></p>
<div id="au-body">${body()}</div>${BATAS}
<details class="au-def"><summary>Cara menghitung nilai audit</summary>${DEF}</details>
<section class="panel" id="au-ditandai">${ditandaiHtml(marks())}</section><p id="au-msg" class="au-msg" role="status"></p>
<div class="au-next"><a class="pill primary" href="#replay">Sudahkah aturan ini diuji pada data lampau? →</a></div>
<details class="au-def"><summary>Uji ketahanan lama (hasil referensi 30 ulangan, tidak mengikuti skenario aktif)</summary>${lama}</details>`;}

const onAudit=()=>document.body.dataset.page==='audit';
document.addEventListener('click',ev=>{if(!onAudit())return;const a=ev.target.closest&&ev.target.closest('a[data-au-prof]');if(a){selected=+a.dataset.auProf;return;}
 const b=ev.target.closest&&ev.target.closest('[data-au]');if(!b||b.disabled)return;const act=b.dataset.au;
 if(act==='hitung'){mulai();paint();document.querySelector('[data-au="batal"]')?.focus({preventScroll:true});}
 else if(act==='batal'){batal();paint();document.querySelector('[data-au="hitung"]')?.focus({preventScroll:true});}
 else if(act==='n'){N=+b.dataset.n;paint();document.querySelector(`[data-au="n"][data-n="${N}"]`)?.focus({preventScroll:true});}
 else if(act==='semua'){semua=!semua;paint();document.querySelector('[data-au="semua"]')?.focus({preventScroll:true});}
 else if(act==='tandai'){const i=+b.dataset.i,c=current().c,r=EduStore.transisi('tandai_audit',{peran:role==='B'?'dinas':'analis',wilayah:sr(i).nama,nilai:c.A[i]});
  pesan=r.ok?`${sr(i).nama} ditandai untuk audit (simulasi, tercatat di log alur usulan).`:r.alasan;refreshMarks();}});
window.addEventListener('edushield-store',()=>{if(job&&job.sig!==sig())batal(true);if(!onAudit()||!document.getElementById('au-body'))return;if(!job&&perlu())mulai();if(painted!==sig()||job)paint();refreshMarks();});
document.getElementById('role')?.addEventListener('change',()=>{if(onAudit())refreshMarks();}); // app.js memperbarui `role` lebih dulu
let rz=0;window.addEventListener('resize',()=>{cancelAnimationFrame(rz);rz=requestAnimationFrame(()=>{if(onAudit()&&document.getElementById('au-body')&&!job&&narrow!==null&&narrow!==isNarrow())paint();});});
EduScreens.audit=audit;
window.EduAudit={get ms(){return cache&&cache.ms;},get menghitung(){return !!job;},get top(){return cache?cache.order.slice(0,20).map(i=>[D.kab[i].nama,cache.A[i]]):null;}};
})();
