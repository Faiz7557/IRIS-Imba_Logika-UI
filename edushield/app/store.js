'use strict';
/* U6: keadaan alur usulan antarperan (TRD §3.3). Hanya agregat; satu-satunya data di localStorage selain tema. */
(function(){
const KEY='edushield-usulan-v1',STATUS=['draf','dikirim','koreksi','diputuskan','final'],BIDANG=['V','p0'];
// Tabel transisi sah: aksi -> peran yang boleh, status asal, status tujuan (fungsi bila bergantung pada keadaan).
const T={
 kirim:{peran:'analis',dari:['draf'],ke:()=>'dikirim'},
 ajukan_koreksi:{peran:'dinas',dari:['dikirim','koreksi'],ke:()=>'koreksi'},
 terima_koreksi:{peran:'analis',dari:['koreksi'],ke:s=>s.koreksi.filter(k=>k.status==='menunggu').length>1?'koreksi':'diputuskan'},
 tolak_koreksi:{peran:'analis',dari:['koreksi'],ke:s=>s.koreksi.filter(k=>k.status==='menunggu').length>1?'koreksi':'diputuskan'},
 putuskan_tanpa_koreksi:{peran:'analis',dari:['dikirim'],ke:()=>'diputuskan'},
 finalkan:{peran:'analis',dari:['diputuskan'],ke:()=>'final'}
};
const W=typeof window!=='undefined'?window:globalThis,fresh=()=>({versi:1,skenario:{},status:'draf',koreksi:[],log:[]});
let state=null,persisten=true;
const clone=o=>JSON.parse(JSON.stringify(o));
const data=()=>(W.EDUSHIELD_DATA&&W.EDUSHIELD_DATA.kab)||[];
const wil=n=>data().find(d=>d.nama===n);
function ok(s){return s&&s.versi===1&&STATUS.includes(s.status)&&Array.isArray(s.koreksi)&&Array.isArray(s.log)&&s.skenario&&typeof s.skenario==='object';}
function load(){let raw=null;try{raw=W.localStorage.getItem(KEY);}catch(e){persisten=false;}
 if(raw){try{const s=JSON.parse(raw);if(ok(s))return s;}catch(e){}}
 return fresh();}
function save(){try{W.localStorage.setItem(KEY,JSON.stringify(state));persisten=true;}catch(e){persisten=false;}}
function notify(){try{if(W.dispatchEvent&&typeof CustomEvent==='function')W.dispatchEvent(new CustomEvent('edushield-store'));}catch(e){}}
function waktu(){const d=new Date(Date.now()+7*36e5);return d.toISOString().slice(0,19)+'+07:00';}
const fin=v=>typeof v==='number'&&isFinite(v);
// nilai efektif suatu bidang: data dasar + koreksi yang sudah diterima
function nilai(s,nama,bidang){const d=wil(nama);let v=d?d[bidang]:undefined;for(const k of s.koreksi)if(k.status==='diterima'&&k.wilayah===nama&&k.bidang===bidang)v=k.nilai_usul;return v;}
const tolak=alasan=>({ok:false,alasan});
function cekAlasan(a){return typeof a==='string'&&a.trim().length>=10&&a.trim().length<=500;}

// Aksi kecil di luar tabel transisi (U5): menandai wilayah untuk audit data. Tidak mengubah status; satu entri log.
function tandaiAudit(m){
 if(m.peran!=='analis')return tolak('Hanya analis pusat yang dapat menandai wilayah untuk audit.');
 if(state.status==='final')return tolak('Usulan sudah final; wilayah tidak dapat ditandai lagi.');
 const d=wil(m.wilayah);if(!d)return tolak('Wilayah tidak ditemukan.');
 const a=Number(m.nilai);if(m.nilai===''||m.nilai==null||!fin(a)||a<0)return tolak('Nilai audit harus berupa angka tidak negatif.');
 if(state.log.some(e=>e.aksi==='tandai_audit'&&e.wilayah===d.nama))return tolak('Wilayah ini sudah ditandai.');
 const s=clone(state);s.log.push({t:waktu(),peran:'analis',aksi:'tandai_audit',wilayah:d.nama,nilai_audit:a,sebelum:'belum ditandai',sesudah:'ditandai',alasan:'Ditandai untuk diperiksa; nilai audit '+String(Math.round(a*100)/100).replace('.',',')+' siswa tertahan (simulasi).',status_sebelum:s.status,status_sesudah:s.status});
 state=s;save();notify();return {ok:true,status:s.status};}
function transisi(aksi,muatan){
 muatan=muatan||{};if(aksi==='tandai_audit')return tandaiAudit(muatan);const t=Object.prototype.hasOwnProperty.call(T,aksi)?T[aksi]:null;
 if(!t)return tolak('Aksi tidak dikenal.');
 const peran=muatan.peran;
 if(peran!==t.peran)return tolak('Aksi ini hanya untuk peran '+(t.peran==='analis'?'analis pusat':'dinas')+'.');
 if(!t.dari.includes(state.status))return tolak('Aksi tidak sah pada status "'+state.status+'".');
 const s=clone(state),sebelum=state.status,e={t:waktu(),peran,aksi,alasan:''};
 if(aksi==='kirim'){
  const sk={};for(const k of ['C0','share','alpha','beta','kappa','remote']){const v=(muatan.skenario||{})[k];if(v!==undefined){if(!fin(v))return tolak('Parameter skenario tidak valid.');sk[k]=v;}}
  s.skenario=sk;e.alasan=cekAlasan(muatan.alasan)?muatan.alasan.trim():'Usulan kuota dikirim ke dinas.';
 }else if(aksi==='ajukan_koreksi'){
  const d=wil(muatan.wilayah);if(!d)return tolak('Wilayah tidak ditemukan.');
  if(!BIDANG.includes(muatan.bidang))return tolak('Bidang koreksi harus V atau p0.');
  const baru=Number(muatan.nilai_usul),lama=nilai(s,d.nama,muatan.bidang);
  if(muatan.nilai_usul===''||muatan.nilai_usul==null||!fin(baru))return tolak('Nilai usulan harus berupa angka.');
  if(muatan.bidang==='V'&&(baru<.25*lama||baru>4*lama))return tolak('Nilai V harus antara 0,25 dan 4 kali nilai saat ini ('+lama+').');
  if(muatan.bidang==='V'&&baru<=0)return tolak('Nilai V harus positif.');
  if(muatan.bidang==='p0'&&(baru<0||baru>100))return tolak('Nilai p0 harus antara 0 dan 100.');
  if(!cekAlasan(muatan.alasan))return tolak('Alasan harus 10 sampai 500 karakter.');
  if(s.koreksi.some(k=>k.status==='menunggu'&&k.wilayah===d.nama&&k.bidang===muatan.bidang))return tolak('Masih ada koreksi menunggu untuk wilayah dan bidang ini.');
  const nv=muatan.bidang==='V'?Math.round(baru):Math.round(baru*100)/100;
  s.koreksi.push({id:'k'+(s.koreksi.length+1),wilayah:d.nama,bidang:muatan.bidang,nilai_lama:lama,nilai_usul:nv,alasan:muatan.alasan.trim(),status:'menunggu',alasan_putusan:''});
  Object.assign(e,{wilayah:d.nama,sebelum:lama,sesudah:nv,alasan:muatan.alasan.trim(),bidang:muatan.bidang});
 }else if(aksi==='terima_koreksi'||aksi==='tolak_koreksi'){
  const k=s.koreksi.find(x=>x.id===muatan.id);
  if(!k||k.status!=='menunggu')return tolak('Koreksi tidak ditemukan atau sudah diputuskan.');
  if(!cekAlasan(muatan.alasan))return tolak('Alasan putusan harus 10 sampai 500 karakter.');
  k.status=aksi==='terima_koreksi'?'diterima':'ditolak';k.alasan_putusan=muatan.alasan.trim();
  Object.assign(e,{wilayah:k.wilayah,bidang:k.bidang,sebelum:k.nilai_lama,sesudah:k.status==='diterima'?k.nilai_usul:k.nilai_lama,alasan:k.alasan_putusan});
 }else if(aksi==='putuskan_tanpa_koreksi'){
  if(!cekAlasan(muatan.alasan))return tolak('Alasan harus 10 sampai 500 karakter.');e.alasan=muatan.alasan.trim();
 }else{ // finalkan
  e.alasan=cekAlasan(muatan.alasan)?muatan.alasan.trim():'Usulan difinalkan.';
 }
 s.status=t.ke(state);e.status_sebelum=sebelum;e.status_sesudah=s.status;
 // 'sebelum'/'sesudah' pada entri log: nilai bila ada, jika tidak status.
 if(e.sebelum===undefined){e.sebelum=sebelum;e.sesudah=s.status;}
 s.log.push(e);state=s;save();notify();
 return {ok:true,status:s.status};
}
function reset(){state=fresh();try{W.localStorage.removeItem(KEY);persisten=true;}catch(e){persisten=false;}notify();}
// Salinan kab dengan koreksi diterima diterapkan; objek yang tidak berubah dipakai bersama.
function terapkan(kab){const ada=state.koreksi.filter(k=>k.status==='diterima');if(!ada.length)return kab;
 return kab.map(d=>{const mine=ada.filter(k=>k.wilayah===d.nama);if(!mine.length)return d;const c={...d};for(const k of mine)c[k.bidang]=k.nilai_usul;return c;});}
function ekspor(){return JSON.stringify(clone(state),null,2);}
state=load();
W.EduStore={get:()=>clone(state),transisi,reset,ekspor,terapkan,get persisten(){return persisten;},aturan:T,nilai:(n,b)=>nilai(state,n,b)};
notify();
})();
