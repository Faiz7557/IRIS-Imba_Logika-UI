'use strict';
/* U7 (F6): tur pemandu enam langkah dan mode presentasi ?demo=1. Tanpa dependensi; tidak menyunting layar.
   Kartu non-modal (<dialog>.show()): fokus pindah ke kartu, tidak dijebak, kembali ke "Mulai tur" saat ditutup.
   ?demo=1 menulis ke localStorage: hanya EduStore.reset() (menghapus kunci 'edushield-usulan-v1'). Tema tidak ditulis. */
(function(){
const W=window,doc=document,$=s=>doc.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
// Satu langkah per layar bernomor. Isi dari pertanyaan layar (brief §4); tanpa angka hasil. `t` = selektor sorotan berurutan (toleran).
const STEPS=[
 {r:'peta',judul:'Peta risiko',tanya:'Di mana risikonya?',isi:'Peta memberi kelas risiko tiap kabupaten dan kota. Klik satu wilayah untuk melihat profil dan usulan kuotanya.',coba:'Coba: klik satu wilayah.',t:['[data-tour]','.peta-svg','#peta-profil']},
 {r:'simulator',judul:'Simulator kuota',tanya:'Bagaimana membagi pagu ini?',isi:'Bejana menunjukkan kuota tiap wilayah pada satu harga bayangan. Geser porsi anggaran dan garis harga bayangan ikut bergerak.',coba:'Coba: geser porsi anggaran.',t:['[data-tour]','#bejana-host','.bejana-panel'],keep:'#share'},
 {r:'audit',judul:'Audit data',tanya:'Data mana yang harus diperiksa dulu?',isi:'Wilayah diurutkan menurut nilai audit, yaitu siswa yang tertahan bila datanya keliru. Tandai wilayah yang perlu diperiksa sebelum usulan dikirim.',coba:'Coba: tandai satu wilayah.',t:['[data-tour]','.au-svg','.au-hero']},
 {r:'replay',judul:'Replay',tanya:'Bagaimana aturan ini bila dijalankan tahun lalu?',isi:'Aturan diuji pada data lampau untuk melihat ketahanannya terhadap data, bukan efek kausal bantuan.',coba:'Lihat grafik perbandingan skema.',t:['[data-tour]','#main svg','#main .panel']},
 {r:'usulan',judul:'Usulan dan koreksi',tanya:'Siapa menyetujui apa?',isi:'Bilah status menunjukkan posisi usulan, dari draf sampai final. Tiap tombol menamai langkah berikutnya dan pelakunya.',coba:'Coba: kirim ke dinas (simulasi di perangkat ini).',t:['[data-tour]','.u-steps','#main .panel'],keep:'[data-u="kirim"]'},
 {r:'lembar',judul:'Lembar final',tanya:'Apa yang ditetapkan dan bagaimana mengauditnya?',isi:'Lembar memuat kuota bulat, parameter, versi data, hash, dan log keputusan. Ekspor CSV atau JSON, atau cetak. Ini usulan, bukan penetapan penerima.',coba:'Coba: ekspor CSV.',t:['[data-tour]','#csv','#main .panel'],up:'.actions'}
];
let active=false,i=0,card,ring,timer,own=false,last=null,raf=0,seq=0;

function find(s){let el=null;for(const q of s.t){el=$('#main '+q)||(q[0]==='#'&&q.indexOf(' ')<0?$(q):null);if(el&&el.getClientRects().length){if(s.up&&el.closest(s.up))el=el.closest(s.up);return el;}}
 return $('#main h1')||$('#main');}
function build(){
 card=doc.createElement('dialog');card.className='tour-card';card.setAttribute('aria-labelledby','tour-judul');card.tabIndex=-1;
 card.innerHTML='<div class="tour-count" id="tour-count"></div><h2 id="tour-judul"></h2><p class="tour-tanya" id="tour-tanya"></p><p id="tour-isi"></p><p class="tour-coba" id="tour-coba"></p><div class="tour-actions"><button type="button" id="tour-prev">Sebelumnya</button><button type="button" id="tour-next" class="primary">Berikutnya</button><button type="button" id="tour-skip" class="tour-skip">Lewati tur</button></div><p class="tour-keys">Papan ketik: panah kanan atau Enter lanjut, panah kiri mundur, Esc menutup.</p>';
 ring=doc.createElement('div');ring.className='tour-ring';ring.setAttribute('aria-hidden','true');
 doc.body.append(ring,card);
 $('#tour-prev').onclick=()=>prev();$('#tour-next').onclick=()=>next();$('#tour-skip').onclick=()=>stop();
}
function place(){
 if(!active)return;const s=STEPS[i],el=find(s);if(!el)return;
 const vw=innerWidth,vh=innerHeight,tb=($('.toolbar')?.getBoundingClientRect().bottom)||0,pad=6,gap=12;
 const cw=card.offsetWidth,ch=card.offsetHeight;let r=el.getBoundingClientRect();
 // gulir bila perlu: sorotan di bawah toolbar; bila muat bersama kartu, kartu di bawahnya.
 if(last!==el){last=el;const want=r.height+ch+gap*3<=vh-tb?tb+gap:tb+gap;const top=r.top+scrollY-want;scrollTo({top:Math.max(0,top),behavior:reduced.matches?'auto':'smooth'});}
 r=el.getBoundingClientRect();
 const vt=Math.max(r.top,tb),vb=Math.min(r.bottom,vh),vl=Math.max(r.left,0),vr=Math.min(r.right,vw);
 const show=vb>vt&&vr>vl;ring.style.display=show?'block':'none';
 if(show)Object.assign(ring.style,{left:vl-pad+'px',top:vt-pad+'px',width:vr-vl+2*pad+'px',height:vb-vt+2*pad+'px'});
 const cx=x=>Math.min(Math.max(8,x),vw-cw-8),cy=y=>Math.min(Math.max(tb+8,y),vh-ch-8);
 // `keep`: kontrol yang diminta langkah ini ("Coba: …") tidak boleh tertutup kartu.
 const k=s.keep&&$('#main '+s.keep),kr=k&&k.getClientRects().length?(k.closest('.control')||k).getBoundingClientRect():null;
 const hit=([x,y],R)=>R?Math.max(0,Math.min(x+cw,R.right)-Math.max(x,R.left))*Math.max(0,Math.min(y+ch,R.bottom)-Math.max(y,R.top)):0;
 const cand=[[cx(vl),vb+pad+gap],[cx(vl),vt-pad-gap-ch],[vr+pad+gap,cy(vt)],[vl-pad-gap-cw,cy(vt)]].filter(([x,y])=>x>=8&&y>=tb+8&&x+cw<=vw-8&&y+ch<=vh-8&&!hit([x,y],kr));
 let pos=cand[0];
 if(!pos){ // tidak ada ruang bebas: pilih sudut dengan tumpang tindih terkecil
  const ov=([x,y])=>Math.max(0,Math.min(x+cw,vr)-Math.max(x,vl))*Math.max(0,Math.min(y+ch,vb)-Math.max(y,vt));
  const dock=vw<700?[[8,vh-ch-8],[8,tb+8]]:[[vw-cw-16,vh-ch-16],[16,vh-ch-16],[vw-cw-16,tb+16]];
  pos=dock.reduce((a,b)=>ov(b)+hit(b,kr)<ov(a)+hit(a,kr)?b:a);}
 Object.assign(card.style,{left:pos[0]+'px',top:pos[1]+'px'});
}
function sched(){cancelAnimationFrame(raf);raf=requestAnimationFrame(place);}
function paint(){
 const s=STEPS[i];$('#tour-count').textContent=`Langkah ${i+1} dari ${STEPS.length}`;
 $('#tour-judul').textContent=s.judul;$('#tour-tanya').textContent=s.tanya;$('#tour-isi').textContent=s.isi;$('#tour-coba').textContent=s.coba;
 $('#tour-prev').disabled=i===0;$('#tour-next').textContent=i===STEPS.length-1?'Selesai':'Berikutnya';
}
// Pindah ke langkah n: ganti rute, tunggu render (handler boot.js berjalan lebih dulu), lalu sorot.
function go(n,focus=true){
 i=Math.max(0,Math.min(STEPS.length-1,n));const s=STEPS[i],my=++seq;last=null;paint();
 const ready=()=>{if(my!==seq||!active)return;let tries=0;const wait=()=>{if(my!==seq||!active)return;const ok=doc.body.dataset.page===s.r;
   if(!ok&&tries++<20){setTimeout(wait,25);return;}
   place();sched();if(focus)card.focus({preventScroll:true});};setTimeout(wait,0);};
 if(location.hash==='#'+s.r)ready();else{own=true;location.hash='#'+s.r;setTimeout(()=>{own=false;},0);ready();}
}
function start(){
 if(!card)build();
 if(active){go(0);return;}
 active=true;card.show();ring.hidden=false;paint();
 timer=setInterval(()=>{if(!active)return;place();if(doc.activeElement===doc.body&&card.open)card.focus({preventScroll:true});},300);
 go(0);
}
function stop(opts){
 if(!active)return;active=false;seq++;clearInterval(timer);cancelAnimationFrame(raf);card.close();ring.style.display='none';last=null;
 if(!opts||opts.focus!==false){const b=$('#tour-start');(b&&!b.closest('[inert]')&&b.getClientRects().length?b:$('#menu-toggle'))?.focus({preventScroll:true});}
}
function next(){if(!active)return;if(i>=STEPS.length-1)stop();else go(i+1);}
function prev(){if(active&&i>0)go(i-1);}
W.EduTour={start,stop,next,prev,get active(){return active},get step(){return i},get steps(){return STEPS.length}};

doc.addEventListener('keydown',e=>{
 if(!active||e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();stop();return;}
 const t=e.target,field=t.closest&&t.closest('input,select,textarea,[contenteditable],[role=slider]');
 const onBtn=t.closest&&t.closest('button,a');
 if(field)return;
 if(e.key==='ArrowRight'||(e.key==='Enter'&&!onBtn&&!(t.closest&&t.closest('#main a,#main button')))){e.preventDefault();next();}
 else if(e.key==='ArrowLeft'){e.preventDefault();prev();}
},true);
addEventListener('resize',sched);addEventListener('scroll',sched,{passive:true});
// Pindah rute oleh pengguna (bukan tur) menutup tur tanpa merebut fokus.
addEventListener('hashchange',()=>{if(active&&!own&&location.hash!=='#'+STEPS[i].r)stop({focus:false});});

// Tombol "Mulai tur" aktif begitu tur terpasang.
$('#tour-start')?.removeAttribute('aria-disabled');

// ?demo=1: keadaan awal yang sama setiap kali. Parameter bawaan, store kosong, Analis pusat, tema terang (tanpa menulis localStorage), wilayah bawaan.
function demo(){
 try{params={...D.meta.params,remote:0};result=S.simulate(D.kab,params);selected=D.kab.findIndex(d=>d.nama==='Sumba Tengah');filter='';query='';}
 catch(e){$('#reset')?.click();}
 W.EduStore?.reset();
 const role=$('#role');if(role&&role.value!=='A'){role.value='A';role.dispatchEvent(new Event('change'));}
 doc.documentElement.dataset.theme='light';
 doc.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice==='light')));
 doc.querySelector('meta[name="theme-color"]')?.setAttribute('content','#f5f6f8');
}
if(new URLSearchParams(location.search).get('demo')==='1'){
 demo();
 // Setelah render pertama boot.js (skrip defer selesai sebelum DOMContentLoaded).
 const go1=()=>{doc.body.dataset.demo='1';$('#toast')?.classList.remove('is-visible');start();};
 if(doc.readyState==='loading')addEventListener('DOMContentLoaded',()=>setTimeout(go1,0));else setTimeout(go1,0);
}
})();
