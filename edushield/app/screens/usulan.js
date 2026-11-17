'use strict';
/* U6: layar Usulan & koreksi (langkah 5). Keadaan ada di store.js; layar ini hanya membaca dan memanggil EduStore.transisi. */
(function(){
const ST=['draf','dikirim','koreksi','diputuskan','final'],LBL={draf:'Draf',dikirim:'Dikirim',koreksi:'Koreksi diajukan',diputuskan:'Diputuskan',final:'Final'};
const AKSI={kirim:'Usulan dikirim ke dinas',ajukan_koreksi:'Koreksi diajukan',terima_koreksi:'Koreksi diterima',tolak_koreksi:'Koreksi ditolak',putuskan_tanpa_koreksi:'Diputuskan tanpa koreksi',finalkan:'Usulan difinalkan',tandai_audit:'Wilayah ditandai untuk audit data'};
const PERAN={analis:'Analis pusat',dinas:'Dinas Pendidikan'},BID={V:'populasi rentan (V)',p0:'persentase kemiskinan (p0)'};
const WHO={draf:'analis',dikirim:'dinas',koreksi:'analis',diputuskan:'analis',final:''};
const NEXT={draf:'kirim usulan ke dinas',dikirim:'dinas memeriksa data wilayahnya',koreksi:'analis memutuskan koreksi',diputuskan:'analis memfinalkan usulan'};
let wil=null,pesan='',galat='';
const me=()=>role==='B'?'dinas':'analis';
const jam=t=>esc(t.slice(0,16).replace('T',' '))+' WIB';
const idx=n=>D.kab.findIndex(d=>d.nama===n);
function bar(s){return `<ol class="u-steps" aria-label="Status usulan">${ST.map((k,i)=>{const now=k===s.status,done=ST.indexOf(s.status)>i;return `<li class="${now?'is-now':done?'is-done':''}"${now?' aria-current="step"':''}><span class="u-n" aria-hidden="true">${done?'✓':i+1}</span>${LBL[k]}${now?'<span class="u-sr"> (status sekarang)</span>':done?'<span class="u-sr"> (selesai)</span>':''}</li>`;}).join('')}</ol>`;}
function dampak(s){const acc=s.koreksi.filter(k=>k.status==='diterima');if(!acc.length)return '';
 const base=S.simulate(D.kab.slice(),params); // salinan: melewati penerapan koreksi, jadi ini hasil data awal
 return panel('Dampak koreksi yang diterima',`<div class="table-wrap"><table><thead><tr><th>Wilayah</th><th>Bidang</th><th class="num">Nilai</th><th class="num">Kuota sebelum</th><th class="num">Kuota sesudah</th></tr></thead><tbody>${acc.map(k=>{const i=idx(k.wilayah);return `<tr><td>${esc(k.wilayah)}</td><td>${esc(BID[k.bidang])}</td><td class="num">${fmt(k.nilai_lama,2)} → ${fmt(k.nilai_usul,2)}</td><td class="num">${fmt(base.x.edushield[i],1)}</td><td class="num"><strong>${fmt(result.x.edushield[i],1)}</strong> · simulasi</td></tr>`;}).join('')}</tbody></table></div><p class="muted">Kuota sebelum dihitung dari data awal pada skenario yang sama. Koreksi yang diterima kini dipakai di Simulator.</p>`);}
function langkah(s){const p=me(),w=WHO[s.status],boleh=w===p;let title,body='';
 if(s.status==='final'){title='Alur selesai';body='<p>Usulan sudah difinalkan. Lembar final memuat parameter, kuota, dan ringkasan log ini. Alur ini berjalan di perangkat ini sebagai simulasi, bukan penetapan penerima.</p>';}
 else{title='Langkah berikutnya: '+NEXT[s.status];
  body=`<p class="u-who">Pelaku: <strong>${PERAN[w]}</strong>${boleh?' (Anda)':''}</p>`;
  if(s.status==='draf')body+=`<button class="primary" data-u="kirim"${boleh?'':' disabled'}>Kirim ke dinas (simulasi alur di perangkat ini)</button><p class="muted">Tidak ada data yang meninggalkan perangkat; perpindahan status hanya dicatat di sini.</p>`;
  if(s.status==='dikirim')body+=`<p>Dinas dapat mengajukan koreksi lewat formulir di ruang Dinas. Bila tidak ada koreksi, analis dapat langsung memutuskan.</p><label for="u-tk">Alasan memutuskan tanpa koreksi (10–500 karakter)</label><textarea id="u-tk" maxlength="500" rows="2"${p==='analis'?'':' disabled'}></textarea><button data-u="tanpa"${p==='analis'?'':' disabled'}>Putuskan tanpa koreksi</button>`;
  if(s.status==='koreksi')body+=`<p>${s.koreksi.filter(k=>k.status==='menunggu').length} koreksi menunggu putusan di antrean.</p>`;
  if(s.status==='diputuskan')body+=`<button class="primary" data-u="finalkan"${boleh?'':' disabled'}>Finalkan usulan</button>`;
  if(!boleh&&s.status!=='dikirim')body+=`<p class="u-wait" role="note">Sedang menunggu ${PERAN[w]}. <button class="quiet" data-u="lihat" data-r="${w==='dinas'?'B':'A'}">Lihat sebagai ${w==='dinas'?'Dinas':'Analis pusat'}</button></p>`;
  if(s.status==='dikirim'&&p==='analis')body+=`<p class="u-wait" role="note">Sedang menunggu Dinas Pendidikan. <button class="quiet" data-u="lihat" data-r="B">Lihat sebagai Dinas</button></p>`;}
 return panel(esc(title),body,'u-next');}
function ringkas(s){const k=Object.keys(s.skenario).length?s.skenario:params;
 return panel('Ringkasan usulan',`<div class="grid"><div><span>Anggaran skenario</span><strong class="metric">Rp${fmt(result.B/1000,1)} <small>miliar</small></strong></div><div><span>Manfaat tambahan per rupiah (λ*)</span><strong class="metric">${fmt(result.lambda*1000,2)} <small>siswa / Rp1 miliar</small></strong></div><div><span>Wilayah dalam usulan</span><strong class="metric">${fmt(D.kab.length)}</strong></div></div><p class="muted">Porsi anggaran ${pct(k.share,0)}, cakupan ${pct(k.alpha,0)}–${pct(k.beta,0)}, κ ${fmt(k.kappa,2)}${s.status==='draf'?' · parameter aktif di Simulator':' · parameter saat dikirim'} · simulasi.</p>`);}
function antrean(s){const q=s.koreksi,ok=me()==='analis'&&s.status==='koreksi';
 return panel('Antrean koreksi',q.length?`<ul class="u-q">${q.map(k=>`<li class="u-k u-${k.status}"><div class="u-kh"><strong>${esc(k.wilayah)}</strong> · ${esc(BID[k.bidang])}: ${fmt(k.nilai_lama,2)} → ${fmt(k.nilai_usul,2)} <span class="u-tag">${k.status==='menunggu'?'Menunggu':k.status==='diterima'?'✓ Diterima':'✕ Ditolak'}</span></div><p>Alasan dinas: ${esc(k.alasan)}</p>${k.status==='menunggu'?`<label for="u-a-${esc(k.id)}">Alasan putusan (10–500 karakter)</label><textarea id="u-a-${esc(k.id)}" maxlength="500" rows="2"${ok?'':' disabled'}></textarea><div class="actions"><button class="primary" data-u="terima" data-id="${esc(k.id)}"${ok?'':' disabled'}>Terima</button><button data-u="tolak" data-id="${esc(k.id)}"${ok?'':' disabled'}>Tolak</button></div>`:`<p>Putusan: ${esc(k.alasan_putusan)}</p>`}</li>`).join('')}</ul>`:'<p>Belum ada koreksi dari dinas.</p>');}
function formDinas(s){const i=wil==null?selected:wil,d=D.kab[i],lo=params.alpha*d.V,hi=params.beta*d.V,x=result.x.edushield[i],aktif=me()==='dinas'&&(s.status==='dikirim'||s.status==='koreksi'),pos=x<=lo+.5?'di batas bawah cakupan':x>=hi-.5?'di batas atas cakupan':'di antara batas, ditentukan harga bayangan';
 return panel(esc('Wilayah Anda'),`<label for="u-wil">Kabupaten / kota</label><select id="u-wil">${D.kab.map((k,j)=>`<option value="${j}"${j===i?' selected':''}>${esc(k.nama)} — ${esc(k.prov)}</option>`).join('')}</select><div class="grid u-g"><div><span>Kuota usulan</span><strong class="metric positive" id="u-kuota">${fmt(x,1)}</strong><small class="muted">siswa · simulasi</small></div><div><span>Populasi rentan (V)</span><strong class="metric">${fmt(d.V)}</strong></div><div><span>Kemiskinan (p0)</span><strong class="metric">${fmt(d.p0,2)}%</strong></div></div><p>Prediksi laju ${pct(d.r_hat)}; kuota ${pos} (λ* ${fmt(result.lambda,3)}).</p>`)
 +panel('Ajukan koreksi data',`<form id="u-form" novalidate><div class="form-grid"><div><label for="u-bid">Bidang</label><select id="u-bid"><option value="V">Populasi rentan (V)</option><option value="p0">Persentase kemiskinan (p0)</option></select></div><div><label for="u-val">Nilai usulan</label><input id="u-val" type="number" step="any" inputmode="decimal" required></div></div><p class="muted">V boleh 0,25–4 kali nilai saat ini; p0 antara 0 dan 100.</p><label for="u-why">Alasan (10–500 karakter)</label><textarea id="u-why" maxlength="500" rows="3" required></textarea><p id="u-err" class="u-err" role="alert">${esc(galat)}</p><button class="primary"${aktif?'':' disabled'}>Ajukan koreksi</button>${aktif?'':'<p class="muted">Tersedia setelah analis mengirim usulan dan sebelum diputuskan.</p>'}</form>`);}
function logHtml(s){return panel('Log keputusan',s.log.length?`<ol class="u-log">${s.log.slice().reverse().map(e=>`<li><time datetime="${esc(e.t)}">${jam(e.t)}</time> · <strong>${esc(PERAN[e.peran]||e.peran)}</strong> · ${esc(AKSI[e.aksi]||e.aksi)}${e.wilayah?' · '+esc(e.wilayah):''}<br><span class="muted">${e.bidang?esc(BID[e.bidang])+': ':''}${esc(e.sebelum)} → ${esc(e.sesudah)} · ${esc(e.alasan)}</span></li>`).join('')}</ol>`:'<p>Belum ada perpindahan. Log mencatat peran, waktu, nilai sebelum dan sesudah, dan alasan.</p>');}
function usulan(){const s=EduStore.get(),analis=me()==='analis';
 return head('Usulan & koreksi','Siapa menyetujui apa? Usulan berpindah antara analis pusat dan dinas; setiap langkah tercatat dan bertahan setelah muat ulang.')
 +bar(s)+`<p id="u-msg" class="u-msg" role="status" tabindex="-1">${esc(pesan)}</p>`+(EduStore.persisten?'':note('Penyimpanan peramban tidak tersedia. Keadaan alur hanya bertahan selama tab ini terbuka.'))
 +langkah(s)+(analis?ringkas(s):formDinas(s))+antrean(s)+dampak(s)+logHtml(s)
 +`<div class="actions u-foot"><a class="pill" href="#lembar">Lanjut ke lembar final →</a><button class="quiet" data-u="reset">Atur ulang alur</button></div>`;}
function jalan(aksi,m,ok){const r=EduStore.transisi(aksi,{peran:me(),...m});
 if(!r.ok){galat=r.alasan;const e=document.getElementById('u-err');if(e){e.textContent=r.alasan;}else{pesan=r.alasan;render();}return;}
 galat='';pesan=ok;render();document.getElementById('u-msg')?.focus({preventScroll:true});}
const val=id=>(document.getElementById(id)||{}).value;
document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('[data-u]');if(!b||document.body.dataset.page!=='usulan'||b.disabled)return;const a=b.dataset.u;
 if(a==='kirim')jalan('kirim',{skenario:{...params}},'Usulan dikirim ke dinas (simulasi di perangkat ini).');
 else if(a==='tanpa')jalan('putuskan_tanpa_koreksi',{alasan:val('u-tk')},'Usulan diputuskan tanpa koreksi.');
 else if(a==='terima'||a==='tolak')jalan(a+'_koreksi',{id:b.dataset.id,alasan:val('u-a-'+b.dataset.id)},a==='terima'?'Koreksi diterima; kuota wilayah dihitung ulang.':'Koreksi ditolak.');
 else if(a==='finalkan')jalan('finalkan',{},'Usulan final.');
 else if(a==='lihat'){const sel=document.getElementById('role');sel.value=b.dataset.r;sel.dispatchEvent(new Event('change'));}
 else if(a==='reset'&&confirm('Atur ulang alur? Status, koreksi, dan log di perangkat ini dihapus.')){EduStore.reset();pesan='Alur diatur ulang.';galat='';render();document.getElementById('u-msg')?.focus({preventScroll:true});}});
document.addEventListener('submit',ev=>{if(ev.target.id!=='u-form')return;ev.preventDefault();const i=wil==null?selected:wil;
 jalan('ajukan_koreksi',{wilayah:D.kab[i].nama,bidang:val('u-bid'),nilai_usul:val('u-val'),alasan:val('u-why')},'Koreksi diajukan; menunggu putusan analis pusat.');});
document.addEventListener('change',ev=>{if(ev.target.id==='u-wil'){wil=+ev.target.value;render();document.getElementById('u-wil')?.focus({preventScroll:true});}});
EduScreens.usulan=usulan;
})();
