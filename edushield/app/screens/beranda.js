'use strict';
/* U9: Beranda. Semua angka dibaca dari paket data (D) dan skenario aktif (result, params); tidak ada angka tertulis tangan. */
(function(){
const LANGKAH=[
 ['peta','Peta risiko','Di mana risikonya?'],
 ['simulator','Simulator kuota','Bagaimana membagi pagu ini?'],
 ['audit','Audit data','Data mana yang harus diperiksa dulu?'],
 ['replay','Replay','Bagaimana aturan ini bila dijalankan tahun lalu?'],
 ['usulan','Usulan & koreksi','Siapa menyetujui apa?'],
 ['lembar','Lembar final','Apa yang ditetapkan dan bagaimana mengauditnya?']];
const num=v=>Number.isFinite(v)?v:null; // data hilang -> kartu disembunyikan, bukan 0
function kartu(label,nilai,detail){return `<section class="panel u9-kpi"><span class="metric-label">${label}</span><strong class="metric">${nilai}</strong><span class="metric-detail">${detail}</span></section>`;}
const KLS=['Ⅰ','Ⅱ','Ⅲ','Ⅳ'];
let force2d=false; // tombol 2D; sengaja tidak disimpan (hanya selama halaman terbuka)
const tip=i=>{const d=D.kab[i],A=d.audit&&d.audit.A;return `${d.nama}, ${d.prov} · nilai audit ${Number.isFinite(A)?fmt(A):'–'} siswa · simulasi`;};
const pilih=i=>{selected=i;location.hash='#peta';};
const kontrasTinggi=()=>!!(window.matchMedia&&matchMedia('(prefers-contrast: more)').matches); // pola SVG membedakan kelas, warna 3D tidak
const peta2d=()=>EduViz.peta.html({cls:EduViz.peta.kelas,dim:()=>false,sel:-1,label:'Peta 514 kabupaten dan kota menurut kelas risiko Ⅰ sampai Ⅳ. Semua angka juga ada di kartu dan layar Peta risiko.'});
function hero(top20){
 const mode=!force2d&&!kontrasTinggi()&&EduViz.peta3d.supported()?'3d':'2d';
 const legend=KLS.map((k,c)=>`<li><i class="hero-sw" style="background:var(--pk${c})"></i>Kelas ${k}</li>`).join('')+'<li>tinggi = nilai audit</li>';
 const label=top20!=null?`Peta 514 kabupaten dan kota, 20 wilayah teratas memuat ${fmt(top20,1)}% nilai audit`:'Peta 514 kabupaten dan kota menurut nilai audit';
 queueMicrotask(()=>{const root=document.getElementById('beranda-hero');if(!root)return;
  if(mode==='2d'){EduViz.peta.mount(root.querySelector('.peta-wrap'),{tip,select:pilih});return;}
  // membangun 514 wilayah ±1 dtk di main thread: tunggu paint pertama dulu
  requestAnimationFrame(()=>setTimeout(()=>{if(!root.isConnected)return;const slot=root.querySelector('.hero-map');
   try{const A=EduViz.peta3d.heights(D.kab.map(d=>d.audit&&d.audit.A));EduViz.peta3d.mount(slot,{h:i=>A[i],cls:EduViz.peta.kelas,label,tip,select:pilih});}
   catch(e){slot.innerHTML=peta2d();root.dataset.mode='2d';EduViz.peta.mount(slot.querySelector('.peta-wrap'),{tip,select:pilih});}},0));});
 return `<section class="panel peta-panel u9-hero" id="beranda-hero" data-mode="${mode}"><div class="hero-map">${mode==='2d'?peta2d():''}</div>
 <p class="print-only hero-print">${esc(label)}.</p><div class="hero-foot"><ul class="peta-legend" aria-label="Legenda kelas risiko">${legend}</ul><button type="button" class="pill" id="hero-2d" aria-pressed="${force2d}">Peta 2D</button></div></section>`;
}
document.addEventListener('click',e=>{if(!(e.target.closest&&e.target.closest('#hero-2d')))return;force2d=!force2d;render();document.getElementById('hero-2d')?.focus({preventScroll:true});});
function beranda(){
 const ms=D.nasional.mc_schemes,gk=num(ms['EduShield (KKT)']&&ms['EduShield (KKT)'].median),gp=num(ms['Proporsional risiko']&&ms['Proporsional risiko'].median),B=num(result.B);
 const A=D.kab.map(d=>d.audit&&d.audit.A).filter(Number.isFinite).sort((a,b)=>b-a),totA=A.reduce((s,v)=>s+v,0),top20=A.length>=20&&totA>0?100*A.slice(0,20).reduce((s,v)=>s+v,0)/totA:null;
 const kartuList=[
  kartu('Wilayah',fmt(D.kab.length),'kabupaten / kota di paket data'),
  B!=null?kartu('Pagu skenario',`Rp${fmt(B/1000,1)} <small>miliar</small>`,`porsi anggaran ${pct(params.share,0)} dari biaya cakupan penuh · skenario aktif`):'',
  top20!=null?kartu('Data yang paling menentukan',`${fmt(top20,1)}%`,`nilai audit tertangkap dengan memeriksa 20 dari ${fmt(D.kab.length)} wilayah · skenario dasar · simulasi`):'',
  gk!=null&&gp!=null?kartu('Selisih dua aturan pembagian',`${fmt(gp-gk,2)} <small>pp</small>`,`proporsional risiko +${fmt(gp,2)}% vs KKT +${fmt(gk,2)}% atas merata · median 30 ulangan · simulasi`):''].join('');
 const tingkat=D.meta.tingkat_data,outcome=String(D.meta.outcome||'');
 return `<div class="heading"><div><span class="page-context">Beranda · Perencanaan kuota PIP SMA/SMK</span><h1>Sebelum kuota PIP dibagi, data wilayah mana yang harus diperiksa dulu?</h1><p class="sub">Aturan pembagian yang wajar, proporsional risiko maupun KKT, memberi kuota yang hampir sama; yang paling mengubah hasil adalah mutu data kebutuhan. ${top20!=null?`Memeriksa 20 dari ${fmt(D.kab.length)} wilayah menangkap <b class="em">${fmt(top20,1)}%</b> nilai audit, yaitu siswa yang tertahan bila data wilayah itu keliru.`:'EduShield mengurutkan kabupaten / kota menurut nilai audit, yaitu siswa yang tertahan bila data wilayah itu keliru.'}</p></div></div>
 <div class="u9-actions"><button type="button" class="pill primary" data-u9-tur>Mulai tur</button><a class="pill" href="#audit">Langsung ke audit data</a></div>
 ${hero(top20)}
 <div class="u9-kpis">${kartuList}</div>
 <section class="panel"><h2>Enam langkah</h2><ol class="u9-steps">${LANGKAH.map(([r,judul,tanya],k)=>`<li><a href="#${r}"><span class="u9-n" aria-hidden="true">${k+1}</span><strong>${esc(judul)}</strong><span>${esc(tanya)}</span></a></li>`).join('')}</ol></section>
 <p class="u9-label"><strong>Simulasi.</strong> Outcome putus sekolah: ${esc(outcome)}; tingkat data ${esc(tingkat)} (semi-sintetis). Usulan, bukan penetapan penerima. <a href="#metode">Metode & batas data</a></p>`;
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-u9-tur]');if(b&&window.EduTour&&EduTour.start)EduTour.start();});
EduScreens.beranda=beranda;
})();
