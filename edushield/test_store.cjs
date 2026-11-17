// Self-check EduStore (Node, tanpa peramban, tanpa menulis berkas). Jalankan: node test_store.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'app','store.js'),'utf8');
function muat(ls){const mem={};const w={EDUSHIELD_DATA:{kab:[{nama:'Aaa',V:1000,p0:10},{nama:'Bbb',V:500,p0:20}]},localStorage:ls||{getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}}};
 w.window=w;vm.runInNewContext(src,w);return {S:w.EduStore,w,mem};}
const A=(m={})=>({peran:'analis',...m}),B=(m={})=>({peran:'dinas',...m});
const alasan='Alasan yang cukup panjang.';
let {S,mem}=muat();
// alur sah penuh + satu log per perpindahan
assert.equal(S.get().status,'draf');
let n=0;const sah=(r,st)=>{assert.equal(r.ok,true,JSON.stringify(r));assert.equal(S.get().status,st);assert.equal(S.get().log.length,++n);};
sah(S.transisi('kirim',A({skenario:{share:.55}})),'dikirim');
sah(S.transisi('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:1500,alasan})),'koreksi');
sah(S.transisi('ajukan_koreksi',B({wilayah:'Bbb',bidang:'p0',nilai_usul:30,alasan})),'koreksi');
sah(S.transisi('terima_koreksi',A({id:'k1',alasan})),'koreksi');
sah(S.transisi('tolak_koreksi',A({id:'k2',alasan})),'diputuskan');
sah(S.transisi('finalkan',A()),'final');
const e=S.get().log[0];
assert.match(e.t,/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+07:00$/);
for(const k of ['peran','aksi','sebelum','sesudah','alasan'])assert(k in e,k);
// koreksi diterima mengubah V di terapkan; yang ditolak tidak
const kab=[{nama:'Aaa',V:1000,p0:10},{nama:'Bbb',V:500,p0:20}],t=S.terapkan(kab);
assert.equal(t[0].V,1500);assert.equal(t[1].p0,20);assert.equal(kab[0].V,1000);
// persisten: instance baru membaca keadaan yang sama
({S}=muat({getItem:k=>mem[k]??null,setItem(){},removeItem(){}}));assert.equal(S.get().status,'final');assert.equal(S.get().log.length,6);
// tidak sah: tak mengubah keadaan
({S,mem}=muat());
const tak=(a,m,msg)=>{const b=JSON.stringify(S.get()),r=S.transisi(a,m);assert.equal(r.ok,false,msg);assert(r.alasan);assert.equal(JSON.stringify(S.get()),b,msg);};
tak('finalkan',A(),'finalkan dari draf');tak('kirim',B(),'dinas mengirim');tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:1100,alasan}),'koreksi saat draf');
tak('terima_koreksi',A({id:'k1',alasan}),'terima saat draf');tak('hapus_semua',A(),'aksi asing');tak('__proto__',A(),'proto');
S.transisi('kirim',A());
tak('kirim',A(),'kirim dua kali');tak('finalkan',A(),'final dari dikirim');tak('ajukan_koreksi',A({wilayah:'Aaa',bidang:'V',nilai_usul:1100,alasan}),'analis ajukan koreksi');
tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:5000,alasan}),'V >4x');tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:100,alasan}),'V <0,25x');
tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'p0',nilai_usul:101,alasan}),'p0>100');tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'p0',nilai_usul:-1,alasan}),'p0<0');
tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:'abc',alasan}),'NaN');tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:1100,alasan:'pendek'}),'alasan pendek');
tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:1100,alasan:'x'.repeat(501)}),'alasan panjang');tak('ajukan_koreksi',B({wilayah:'Zzz',bidang:'V',nilai_usul:1100,alasan}),'wilayah asing');
tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'kuota',nilai_usul:1100,alasan}),'bidang asing');
assert.equal(S.transisi('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:1100,alasan})).ok,true);
tak('ajukan_koreksi',B({wilayah:'Aaa',bidang:'V',nilai_usul:1200,alasan}),'duplikat menunggu');tak('terima_koreksi',A({id:'k1',alasan:'pendek'}),'alasan putusan pendek');
tak('terima_koreksi',A({id:'k9',alasan}),'id asing');tak('finalkan',A(),'final saat koreksi');
// tandai_audit (U5): satu entri log, status tetap, ditolak bila final / bukan analis / ganda / nilai buruk
({S}=muat());
{const st=S.get().status,n0=S.get().log.length,r=S.transisi('tandai_audit',A({wilayah:'Aaa',nilai:12.345}));
 assert.equal(r.ok,true);assert.equal(S.get().status,st);assert.equal(S.get().log.length,n0+1);
 const e=S.get().log.at(-1);assert.equal(e.aksi,'tandai_audit');assert.equal(e.wilayah,'Aaa');assert.equal(e.nilai_audit,12.345);assert.equal(e.status_sebelum,e.status_sesudah);}
tak('tandai_audit',A({wilayah:'Aaa',nilai:1}),'tandai ganda');tak('tandai_audit',B({wilayah:'Bbb',nilai:1}),'dinas menandai');
tak('tandai_audit',A({wilayah:'Zzz',nilai:1}),'wilayah asing');tak('tandai_audit',A({wilayah:'Bbb',nilai:'abc'}),'nilai NaN');tak('tandai_audit',A({wilayah:'Bbb',nilai:-1}),'nilai negatif');tak('tandai_audit',A({wilayah:'Bbb'}),'nilai kosong');
assert.equal(S.transisi('tandai_audit',A({wilayah:'Bbb',nilai:0})).ok,true);
{const salin=JSON.stringify(S.get());({S}=muat({getItem:()=>salin,setItem(){},removeItem(){}}));assert.equal(S.get().log.filter(e=>e.aksi==='tandai_audit').length,2);} // bertahan lewat muat ulang
({S}=muat());for(const a of [['kirim',A()],['putuskan_tanpa_koreksi',A({alasan})],['finalkan',A()]])assert.equal(S.transisi(...a).ok,true);
tak('tandai_audit',A({wilayah:'Aaa',nilai:1}),'tandai saat final');
// reset
S.reset();assert.equal(JSON.stringify(S.get()),JSON.stringify({versi:1,skenario:{},status:'draf',koreksi:[],log:[]}));assert.equal(S.terapkan(kab),kab);
assert.equal(JSON.parse(S.ekspor()).status,'draf');
// localStorage melempar galat: tetap berfungsi di memori
const boom=()=>{throw new Error('tak tersedia');};
({S}=muat({getItem:boom,setItem:boom,removeItem:boom}));
assert.equal(S.persisten,false);assert.equal(S.transisi('kirim',A()).ok,true);assert.equal(S.get().status,'dikirim');S.reset();assert.equal(S.get().status,'draf');
// data rusak di localStorage diabaikan
({S}=muat({getItem:()=>'{rusak',setItem(){},removeItem(){}}));assert.equal(S.get().status,'draf');
console.log('PASS test_store');
