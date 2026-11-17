'use strict';
/* U2: layar Peta risiko (langkah 1). Memilih wilayah tidak membangun ulang peta; hanya profil dan tabel. */
(function(){
const KLS=['Ⅰ','Ⅱ','Ⅲ','Ⅳ'],RNG=['< 1%','1–2,5%','2,5–5%','≥ 5%'];
const kelas=EduViz.peta.kelas;
let showAll=false,map=null;
function attribution(){const g=window.EDU_GEO,kv={};`${g.sumber}\n${g.lisensi}`.split('\n').forEach(l=>{const m=l.match(/^# ([^:]+): (.*)$/);if(m)kv[m[1]]=m[2];});
 const lic=(kv['Lisensi/catatan']||'').split(';').slice(0,3).map(s=>s.trim()).join('; ');
 return `Batas wilayah: ${esc(kv['Sumber']||'')}, diakses ${esc(kv['Diakses']||'')}. Lisensi: ${esc(lic)}.`;}
const profil=()=>EduScreens.profile();
function tabel(){const idx=visible().sort((a,b)=>D.kab[b].r_hat-D.kab[a].r_hat),n=idx.length;
 return `<p class="muted">${showAll?`Menampilkan ${n} wilayah`:`Menampilkan ${Math.min(20,n)} laju tertinggi dari ${n} wilayah`} pada filter aktif. ${n>20?`<button type="button" class="peta-more">${showAll?'Tampilkan 20 teratas':'Tampilkan semua '+n}</button>`:''}</p>`+districtTable(showAll?idx:idx.slice(0,20)).replace('Rentang stabilitas','Interval '+pct(D.meta.interval.nominal,0));}
function mark(){document.querySelectorAll('#peta-tabel [data-district]').forEach(b=>{if(+b.dataset.district===selected)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});}
// U8: delegasi fase tangkap pada kotak tabel; menghentikan onclick lama (bindDistricts) tanpa menunggu urutan bind().
function bindTable(){const box=document.getElementById('peta-tabel');if(!box)return;
 box.addEventListener('click',e=>{const b=e.target.closest('[data-district]');if(b){e.stopPropagation();pick(+b.dataset.district);return;}
  if(e.target.closest('.peta-more')){showAll=!showAll;box.innerHTML=tabel();EduUI.tables();mark();box.querySelector('.peta-more')?.focus();}},true);mark();}
function pick(i){selected=i;map&&map.select(i);const p=document.getElementById('peta-profil');p.innerHTML=profil();EduIcons.decorate(p);mark();}
function peta(){
 const vis=new Set(visible()),dimOn=!!(filter||query);
 const legend=KLS.map((k,c)=>`<li><svg width="26" height="16" aria-hidden="true"><rect width="26" height="16" rx="3" class="pk${c}"/></svg><span><b>Kelas ${k}</b> · laju ${RNG[c]}</span></li>`).join('');
 const out=`<div class="peta-head"><span class="page-context">Langkah 1 · ${EduApp.role==="B"?"Ruang Dinas Pendidikan":"Ruang analis pusat"}</span><h1>Peta risiko</h1><p class="sub">Di mana risiko putus sekolah paling tinggi? Pilih satu kabupaten / kota untuk melihat alasannya.</p></div>
<p class="peta-sim"><b>Data simulasi.</b> Laju putus sekolah dan kuota berasal dari model; kemiskinan dari BPS 2025.</p>`+filters()+
 `<section class="panel peta-panel"><h2>Laju putus sekolah terprediksi · 514 kabupaten / kota</h2><button type="button" class="peta-skip">Lewati peta, ke tabel</button>`+
 EduViz.peta.html({cls:kelas,dim:i=>dimOn&&!vis.has(i),sel:selected,gugus:filter,label:'Peta choropleth 514 kabupaten dan kota menurut kelas risiko Ⅰ sampai Ⅳ. Untuk papan ketik gunakan tabel di bawah peta.'})+
 `<ul class="peta-legend" aria-label="Legenda kelas risiko">${legend}</ul><p class="muted peta-hint">Kelas juga dibedakan oleh pola: Ⅰ dan Ⅱ polos (beda tingkat warna), Ⅲ titik, Ⅳ arsir silang. Lingkaran kecil menandai wilayah yang terlalu kecil untuk diklik langsung.</p><p class="muted peta-attr">${attribution()}</p></section>`+
 `<div id="peta-profil" aria-live="polite">${profil()}</div>`+
 `<section class="panel"><h2>Tabel setara peta</h2><div id="peta-tabel" tabindex="-1">${tabel()}</div></section>`+
 `<div class="peta-next"><a class="pill primary" href="#simulator">Bagi kuota untuk peta ini →</a></div>`;
 // Peta dipasang setelah render() menaruh HTML (butuh DOM); klik tabel memakai delegasi tangkap, jadi tidak bergantung pada urutan bind().
 queueMicrotask(()=>{const root=document.querySelector('.peta-wrap');if(!root)return;
  map=EduViz.peta.mount(root,{tip:i=>{const d=D.kab[i];return `${d.nama}, ${d.prov} · Kelas ${KLS[kelas(i)]} · laju ${pct(d.r_hat)} · simulasi`;},select:pick});
  document.querySelector('.peta-skip').onclick=()=>document.getElementById('peta-tabel').focus();
  bindTable();});
 return out;}
EduScreens.peta=peta;
})();
