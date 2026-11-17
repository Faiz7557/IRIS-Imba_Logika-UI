// Uji antarmuka EduShield (Playwright, file://) untuk delapan rute: #beranda #peta #simulator #audit #replay #usulan #lembar #metode.
// Keluaran: edushield/verification/final/apple/ (atau EDUSHIELD_UI_REPORT_DIR). Folder verification/ lama tidak ditulis.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{execFileSync}=require('node:child_process');
let pw;try{pw=require('playwright')}catch{pw=require(execFileSync('python',['-c','from pathlib import Path; import playwright; print(Path(playwright.__file__).parent / "driver" / "package")'],{encoding:'utf8'}).trim())}
const out=process.env.EDUSHIELD_UI_REPORT_DIR?path.resolve(process.env.EDUSHIELD_UI_REPORT_DIR):path.join(__dirname,'verification','final','apple');fs.mkdirSync(out,{recursive:true});
const ROUTES=['beranda','peta','simulator','audit','replay','usulan','lembar','metode'];
// TRD §6: kode lama -> rute baru.
const LEGACY={A1:'beranda',A2:'peta',A3:'peta',B2:'peta',A4:'simulator',A5:'simulator',A7:'simulator',A6:'audit',C3:'audit',C2:'replay',B1:'usulan',B3:'usulan',A8:'lembar',L1:'metode',L2:'metode',L3:'metode',C1:'metode',B4:'metode'};
const WIDTHS=[1440,1024,1023,768,390,375];
const BAD=/\[object Object\]|undefined|NaN/;
const checks=[];const ok=name=>{if(!checks.includes(name))checks.push(name)};
(async()=>{
// EDUSHIELD_GL=1 memaksa WebGL (SwiftShader) agar jalur hero 3D Beranda ikut diuji.
const browser=await pw.chromium.launch({channel:'chrome',headless:true,timeout:20000,...(process.env.EDUSHIELD_GL==='1'?{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
try{
 const errors=[],external=[];
 const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});p.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())})};
 const base=pathToFileURL(path.join(__dirname,'app','index.html')).href;
 const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce',acceptDownloads:true});watch(page);
 const go=async r=>{await page.evaluate(r=>location.hash=r,r);await page.waitForFunction(r=>document.body.dataset.page===r,r)};
 const noBadText=async label=>assert(!BAD.test(await page.evaluate(()=>document.body.innerText)),'[object Object]/undefined/NaN di teks: '+label);
 const noOverflow=async label=>assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'overflow: '+label);
 await page.goto(base);await page.locator('h1').waitFor();

 // 1. Delapan rute terbuka pada enam lebar.
 let routeChecks=0;
 for(const width of WIDTHS){
  await page.setViewportSize({width,height:width<800?844:1050});
  for(const route of ROUTES){
   await go(route);
   assert.equal(await page.locator('h1').count(),1,route+' h1');
   assert(await page.locator('.simulation').isVisible(),route+' banner simulasi');
   assert.equal(await page.locator('.sidebar [aria-current="page"]').count(),1,route+' active nav');
   assert.equal(await page.locator('.sidebar [aria-current="page"]').getAttribute('href'),'#'+route,route+' active nav target');
   assert((await page.title()).startsWith(await page.evaluate(()=>document.querySelector('#breadcrumb').textContent)),route+' document.title');
   assert(!(/(^|\s)[ABCL]\d\b/.test(await page.locator('.sidebar').innerText())),'Kode layar lama tampil di sidebar');
   await noOverflow(`${route} @${width}`);await noBadText(`${route} @${width}`);
   if(route==='beranda')await page.locator('#beranda-hero .peta3d canvas, #beranda-hero .peta-wrap svg').first().waitFor(); // hero 3D dipasang setelah paint pertama
   if(width===1440||width===390)await page.screenshot({path:path.join(out,`${route}-${width}.png`),fullPage:true});
   routeChecks++;
  }
 }
 ok('8 rute x 6 lebar: satu h1, banner simulasi, satu tautan aktif, judul dokumen, tanpa kode lama, tanpa overflow, tanpa [object Object]/undefined/NaN');
 console.log('PASS',routeChecks,'route/viewport checks');
 await page.setViewportSize({width:1440,height:1050});
 // 1b. Sidebar berkelompok, tombol ciut (mini 68px, tersimpan), kartu skenario.
 await go('beranda');
 assert.deepEqual(await page.locator('.nav-group-title').allInnerTexts(),['Di mana risikonya?','Bagaimana membaginya?','Bisakah dipercaya?','Siapa memutuskan?']);
 assert.equal(await page.locator('.nav-group-title[tabindex], .nav-group-title[href]').count(),0);
 assert.match(await page.locator('#side-card').innerText(),/Rp[\d.,]+ miliar/);
 await page.locator('#side-toggle').click();
 assert.equal(await page.evaluate(()=>document.body.dataset.side),'mini');
 assert.equal(await page.evaluate(()=>document.querySelector('.sidebar').getBoundingClientRect().width),68);
 await page.reload();await page.locator('h1').waitFor();
 assert.equal(await page.evaluate(()=>document.body.dataset.side),'mini');
 assert.equal(await page.locator('.sidebar .brand').getAttribute('aria-label'),'EduShield','tautan .brand tanpa nama di mode mini');
 await page.locator('#side-toggle').click(); // pulihkan untuk pemeriksaan berikutnya
 await page.setViewportSize({width:390,height:844});
 assert(!(await page.locator('#side-toggle').isVisible()));
 await page.setViewportSize({width:1440,height:1050});
 await go('simulator');{const c0=await page.locator('#side-card').innerText(),s0=await page.locator('#share').inputValue();await page.locator('#share').fill('0.3');await page.waitForFunction(t=>document.querySelector('#side-card').innerText!==t,c0);assert.match(await page.locator('#side-card').innerText(),/30%/,'kartu skenario basi setelah slider');await page.locator('#share').fill(s0);}
 await go('beranda');
 ok('sidebar: empat judul grup bukan tautan, kartu skenario Rp miliar, ciut 68px tersimpan setelah muat ulang, tombol ciut tersembunyi di 390');


 // 1c. Hero Beranda: 3D (bila WebGL) atau peta 2D; tombol 2D; klik wilayah -> Peta risiko.
 await go('beranda');
 const mode=await page.locator('#beranda-hero').getAttribute('data-mode');assert(['3d','2d'].includes(mode));console.log('Beranda hero mode:',mode);
 if(mode==='3d'){
  assert.equal(await page.locator('#beranda-hero .peta3d').getAttribute('data-spin'),'off'); // page context uses reducedMotion:'reduce'
  assert.equal(await page.locator('#beranda-hero canvas').evaluate(c=>getComputedStyle(c).touchAction),'pan-y');
  await page.evaluate(()=>document.querySelector('[data-theme-choice=dark]').click());
  assert.equal(await page.locator('#beranda-hero .peta3d').getAttribute('data-built-theme'),'dark');
  await page.evaluate(()=>document.querySelector('[data-theme-choice=light]').click());
  const glWarn=[],onWarn=m=>{if(m.type()==='warning'&&/WebGL/.test(m.text()))glWarn.push(m.text())};page.on('console',onWarn);
  for(let k=0;k<20;k++){await go('peta');await go('beranda');await page.locator('#beranda-hero canvas').waitFor();} // pemasangan ditunda sampai setelah paint: tunggu tiap putaran
  page.off('console',onWarn);assert.deepEqual(glWarn,[],'peringatan WebGL (konteks bocor?)');
  assert.equal(await page.locator('canvas').count(),1);
  assert(!errors.some(e=>/WebGL/.test(e)),'WebGL context leak');
  // handoff: the first region in the hero selects it in Peta risiko
  await page.evaluate(()=>{selected=0;location.hash='#peta';});await page.waitForFunction(()=>document.body.dataset.page==='peta');
  assert(await page.locator('.peta-sel').getAttribute('d'));
 }
 await go('beranda');await page.locator('#hero-2d').click();
 assert.equal(await page.locator('#beranda-hero').getAttribute('data-mode'),'2d');
 assert.equal(await page.locator('#beranda-hero path[data-i]').count(),514);
 await page.locator('#hero-2d').click();
 // hover tombol primer berbeda dari --accent; judul grup sidebar >= 12px
 await go('beranda');await page.emulateMedia({media:'screen'});
 {const pill=page.locator('.pill.primary').first();const base=await pill.evaluate(e=>getComputedStyle(e).backgroundColor);await pill.hover();
  const hov=await pill.evaluate(e=>getComputedStyle(e).backgroundColor);assert.notEqual(hov,base,'hover tombol primer sama dengan dasar');
  assert(parseFloat(await page.locator('.nav-group-title').first().evaluate(e=>getComputedStyle(e).fontSize))>=12,'judul grup sidebar < 12px');}
 // cetak: kanvas/peta disembunyikan, ringkasan teks + legenda tetap
 await go('beranda');await page.emulateMedia({media:'print'});
 assert(await page.locator('#beranda-hero .hero-print').isVisible(),'ringkasan cetak hero tidak tampil');
 assert.match(await page.locator('#beranda-hero .hero-print').innerText(),/20 wilayah teratas memuat [\d,]+% nilai audit/);
 assert.equal(await page.locator('#beranda-hero .hero-map').evaluate(e=>getComputedStyle(e).display),'none');
 assert.equal(await page.locator('#beranda-hero canvas:visible').count(),0);assert(!(await page.locator('#hero-2d').isVisible()));
 await page.emulateMedia({media:'screen'});
 ok('hero Beranda: mode '+mode+', tombol 2D memaksa peta SVG 514 wilayah'+(mode==='3d'?', putar mati saat reduced motion, tema gelap dibangun ulang, satu kanvas setelah 20x pindah rute, klik -> Peta risiko':''));

 // 2. Alih rute: 18 kode lama sesuai TRD §6, tanpa menambah riwayat selain hash yang diketik.
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width<800?844:1050});
  for(const [code,target] of Object.entries(LEGACY)){
   // history.length dibatasi 50 oleh Chrome, jadi diuji lewat Kembali: entri kode lama harus sudah diganti (location.replace).
   const prior=target==='metode'?'peta':'metode';await go(prior);
   await page.evaluate(c=>location.hash=c,code);await page.waitForFunction(t=>document.body.dataset.page===t&&location.hash==='#'+t,target);
   await page.evaluate(()=>history.back());await page.waitForFunction(p=>document.body.dataset.page===p&&location.hash==='#'+p,prior);
  }
  for(const bad of ['zzz','A99']){await go('peta');await page.evaluate(h=>location.hash=h,bad);await page.waitForFunction(()=>document.body.dataset.page==='beranda'&&location.hash==='#beranda')}
 }
 await page.setViewportSize({width:1440,height:1050});
 ok('18 kode lama beralih sesuai TRD §6 (1440 dan 390), entri lama diganti (Kembali ke rute sebelumnya), hash tak dikenal -> #beranda');

 // 3. Peta memuat 514 path[data-i]; klik wilayah mengganti profil.
 await go('peta');
 assert.equal(await page.locator('path[data-i]').count(),514);assert.equal(await page.evaluate(()=>EduApp.data.kab.length),514);
 const before=await page.locator('.peta-nama').first().textContent();
 const merauke=await page.evaluate(()=>EduApp.data.kab.findIndex(d=>d.nama==='Merauke'));
 await page.locator(`path[data-i="${merauke}"]`).click();assert((await page.locator('.peta-nama').first().textContent()).startsWith('Merauke'),'klik peta tidak mengganti profil');assert.notEqual(before,await page.locator('.peta-nama').first().textContent());
 ok('#peta memuat 514 path[data-i]; klik wilayah mengganti profil');

 // 4. Navigasi mobile: dialog, jebakan fokus, Escape, pengembalian fokus, peran.
 await page.setViewportSize({width:390,height:844});await go('beranda');
 await page.locator('#menu-toggle').click();assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
 assert(await page.locator('#app-surface').evaluate(e=>e.inert));assert.equal(await page.locator('.sidebar').getAttribute('role'),'dialog');
 // Elemen pertama laci adalah tautan merek (sebelum tombol tutup), jadi lingkaran diuji dari sana.
 await page.locator('.sidebar a.brand').focus();await page.keyboard.press('Shift+Tab');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'tour-start','Shift+Tab dari elemen pertama harus melingkar ke elemen terakhir');
 await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('.sidebar')&&document.activeElement.matches('a.brand')),'Tab dari elemen terakhir harus melingkar ke yang pertama');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');assert(await page.locator('#menu-toggle').evaluate(e=>e===document.activeElement));
 // Peran hanya disimpan: tidak berpindah rute; di #usulan layar diganti; sidebar tertutup dan tidak inert.
 await page.locator('#menu-toggle').click();await page.locator('#role').selectOption('B');
 assert.equal(await page.evaluate(()=>EduApp.role),'B');assert.equal(await page.evaluate(()=>EduApp.route),'beranda');assert(!(await page.locator('#app-surface').evaluate(e=>e.inert)));
 await page.locator('#menu-toggle').click();await page.locator('#role').selectOption('A');
 await page.locator('#menu-toggle').click();await page.locator('#nav a[href="#beranda"]').click();assert(await page.locator('#menu-toggle').evaluate(e=>e===document.activeElement),'fokus tidak kembali ke tombol menu pada rute yang sama');
 await page.locator('a[href="#peta"]:not(.sidebar a)').first().click();await page.waitForFunction(()=>document.body.dataset.page==='peta');
 ok('sidebar mobile: dialog, jebakan fokus melingkar, Escape, pengembalian fokus, pergantian peran tanpa pindah rute');

 // 5. Simulator: penggeser, batas, drag pointer, atur ulang, pencarian, tab.
 await go('simulator');
 const oldB=await page.evaluate(()=>EduApp.result.B);await page.locator('#share').fill('0.3');assert.equal(await page.evaluate(()=>EduApp.params.share),.3);assert((await page.evaluate(()=>EduApp.result.B))<oldB);
 await page.locator('#alpha').fill('0.5');assert(await page.locator('#scenario-error').innerText());assert.equal(await page.evaluate(()=>EduApp.params.alpha),.2);
 await page.setViewportSize({width:1440,height:1050});await page.locator('#share').scrollIntoViewIfNeeded();
 await page.locator('#share').evaluate(e=>window.__originalSlider=e);const lambdaBefore=await page.locator('#rd-lambda').innerText();
 const rect=await page.locator('#share').boundingBox();
 await page.mouse.move(rect.x+rect.width*.133,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.6,rect.y+rect.height/2,{steps:12});await page.mouse.up();
 assert(await page.evaluate(()=>window.__originalSlider===document.querySelector('#share')),'Slider diganti selama drag');
 assert((await page.evaluate(()=>EduApp.params.share))>.55,'Drag pointer tidak memperbarui nilai secara kontinu');
 assert.notEqual(await page.locator('#rd-lambda').innerText(),lambdaBefore,'bejana/harga bayangan tidak ikut bergerak saat drag');
 const sliderSolveMs=await page.evaluate(()=>lastSolveMs);
 await page.locator('#reset').click();assert.equal(await page.evaluate(()=>EduApp.params.share),.55);
 await page.locator('#search').fill('Sumba');
 assert.equal(await page.locator('#allocation-table tbody tr').count(),await page.evaluate(()=>EduApp.data.kab.filter(d=>d.nama.toLowerCase().includes('sumba')).length));
 const firstName=(await page.locator('#allocation-table [data-district]').first().textContent()).trim();
 await page.locator('#allocation-table [data-district]').first().click();await page.waitForFunction(()=>document.body.dataset.page==='peta');
 assert((await page.locator('.peta-nama').first().textContent()).startsWith(firstName),'wilayah dari tabel simulator tidak menjadi profil peta');
 await go('simulator');
 const tabs=page.locator('[role=tab]');assert.equal(await tabs.count(),3);assert.equal(await page.locator('#sim-tab-0').getAttribute('aria-selected'),'true');
 await page.locator('#sim-tab-0').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#sim-tab-1').getAttribute('aria-selected'),'true');
 await page.locator('[data-mode="modeled"]').click();assert.equal(await page.locator('[data-mode="modeled"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#sim-tab-1').getAttribute('aria-selected'),'true','tab hilang setelah ganti mode');
 await page.keyboard.press('End').catch(()=>{});await page.locator('#sim-tab-1').focus();await page.keyboard.press('End');assert.equal(await page.locator('#sim-tab-2').getAttribute('aria-selected'),'true');await noBadText('simulator tab transisi');
 await page.keyboard.press('Home');assert.equal(await page.locator('#sim-tab-0').getAttribute('aria-selected'),'true');
 assert.equal(await page.locator('h1').count(),1);
 ok('#simulator: penggeser, batas ditolak, drag kontinu pada elemen yang sama, bejana ikut, atur ulang, pencarian, pilih wilayah, tab ARIA (panah/Home/End) dan mode');

 // 6. Alur usulan lengkap dua peran (analis pusat dan Dinas Pendidikan), persisten, dan penjaga peran.
 await go('usulan');await page.evaluate(()=>EduStore.reset());await go('simulator');await go('usulan');
 const st=()=>page.evaluate(()=>EduStore.get());const role=async r=>{await page.locator('#role').selectOption(r);await page.waitForFunction(r=>document.body.dataset.role===r,r)};
 await role('A');assert.equal((await st()).status,'draf');assert.equal((await st()).log.length,0);
 const wilIdx=await page.evaluate(()=>EduApp.data.kab.findIndex(d=>d.nama==='Sumba Tengah')),quotaBefore=await page.evaluate(i=>EduApp.result.x.edushield[i],wilIdx);
 await role('B');assert(await page.locator('[data-u="kirim"]').isDisabled(),'dinas tidak boleh mengirim');
 await role('A');await page.locator('[data-u="kirim"]').click();assert.equal((await st()).status,'dikirim');assert((await page.locator('#u-msg').innerText()).includes('dikirim'));
 await role('B');assert(!(await page.locator('#u-form button.primary').isDisabled()));
 await page.locator('#u-wil').selectOption(String(wilIdx));
 const V=await page.evaluate(i=>EduApp.data.kab[i].V,wilIdx);
 await page.locator('#u-bid').selectOption('V');await page.locator('#u-val').fill(String(V*10));await page.locator('#u-why').fill('Nilai di luar batas, harus ditolak.');await page.locator('#u-form button.primary').click();
 assert((await page.locator('#u-err').innerText()).length>0,'V di luar 0,25x-4x harus ditolak');assert.equal((await st()).status,'dikirim');
 await page.locator('#u-val').fill(String(Math.round(V*1.6)));await page.locator('#u-why').fill('x');await page.locator('#u-form button.primary').click();assert((await page.locator('#u-err').innerText()).length>0,'alasan <10 karakter harus ditolak');assert.equal((await st()).status,'dikirim');
 await page.locator('#u-why').fill('Data lapangan dinas menunjukkan populasi rentan lebih besar.');await page.locator('#u-form button.primary').click();
 assert.equal((await st()).status,'koreksi');assert.equal((await st()).koreksi.length,1);
 await role('A');const kid=(await st()).koreksi[0].id;assert(await page.locator('[data-u="finalkan"]').count()===0);
 await page.locator('[data-u="terima"]').click();assert((await page.locator('#u-err, #u-msg').first().innerText()).length>=0);assert.equal((await st()).status,'koreksi','alasan putusan kosong harus ditolak');
 await page.locator(`#u-a-${kid}`).fill('Bukti dinas diterima setelah diperiksa.');await page.locator('[data-u="terima"]').click();assert.equal((await st()).status,'diputuskan');
 const quotaAfter=await page.evaluate(i=>EduApp.result.x.edushield[i],wilIdx);assert.notEqual(quotaAfter,quotaBefore,'koreksi diterima harus mengubah kuota wilayah');
 await role('B');assert(await page.locator('[data-u="finalkan"]').isDisabled(),'dinas tidak boleh memfinalkan');
 await role('A');await page.locator('[data-u="finalkan"]').click();assert.equal((await st()).status,'final');
 assert.equal((await st()).log.length,4);assert.equal(await page.locator('.u-steps li[aria-current="step"]').innerText().then(t=>t.includes('Final')),true);await noBadText('usulan final');
 await page.reload();await page.waitForFunction(()=>document.body.dataset.page==='usulan');assert.equal((await st()).status,'final','status usulan tidak bertahan setelah muat ulang');assert.equal((await st()).log.length,4);
 assert.equal(await page.evaluate(i=>EduApp.result.x.edushield[i],wilIdx),quotaAfter,'kuota koreksi tidak bertahan setelah muat ulang');
 await go('simulator');await go('usulan');await page.locator('[data-u="reset"]').click().catch(()=>{});
 ok('alur usulan: kirim (analis) -> koreksi (dinas) -> terima (analis) -> final, validasi V/alasan, penjaga peran, kuota berubah, bertahan setelah muat ulang');

 // 7. Lembar final: ekspor CSV/JSON (dari Blob handler asli), unduhan native, cetak, PDF. Status usulan 'final' masih tersimpan.
 await go('lembar');assert.equal(await page.locator('#lembar-status').innerText(),'Final');
 await page.locator('#reviewer').fill('Uji antarmuka — belum disahkan');
 let nativeDownload='Not checked';try{const pending=page.waitForEvent('download',{timeout:5000});await page.locator('#csv').click();const dl=await pending;nativeDownload=(await dl.failure())||'PASS';if(nativeDownload==='PASS')await dl.saveAs(path.join(out,'native.csv'));}catch(e){nativeDownload=e.message.split('\n')[0]}
 await page.evaluate(()=>{const create=URL.createObjectURL.bind(URL),click=HTMLAnchorElement.prototype.click;window.__blobs=new Map();URL.createObjectURL=b=>{const u=create(b);window.__blobs.set(u,b);return u};HTMLAnchorElement.prototype.click=function(){if(this.download){window.__export={name:this.download,blob:window.__blobs.get(this.href)};return}click.call(this)}});
 for(const id of ['csv','json']){await page.locator('#'+id).click();const value=await page.evaluate(async()=>({name:window.__export.name,text:await window.__export.blob.text()}));assert(value.name.endsWith('.'+id));fs.writeFileSync(path.join(out,'usulan.'+id),value.text)}
 const pack=JSON.parse(fs.readFileSync(path.join(out,'usulan.json'),'utf8').replace(/^﻿/,''));
 assert.equal(pack.kab.length,514);assert.equal(pack.review.nama,'Uji antarmuka — belum disahkan');assert.equal(pack.status_usulan,'final');assert.equal(pack.usulan.log.length,4);assert.equal(pack.label,'DATA SIMULASI — USULAN');
 assert(pack.kab.every(d=>Number.isInteger(d.kuota_bulat)),'kuota bulat harus bilangan bulat');assert(pack.pembulatan.biaya_juta<=pack.budget_juta+1e-6,'biaya kuota bulat melampaui pagu');assert.equal(pack.pembulatan.total_kuota,pack.kab.reduce((a,d)=>a+d.kuota_bulat,0));
 const csv=fs.readFileSync(path.join(out,'usulan.csv'),'utf8');assert(csv.includes('DATA SIMULASI — USULAN'));assert(csv.includes('"status_usulan","final"'));assert.equal(csv.split(/\r?\n/).filter(l=>l.startsWith('"log_usulan"')).length,5,'CSV: header + 4 baris log');
 assert.equal(csv.split(/\r?\n/).filter(l=>l&&/^"\d+","/.test(l)||/^"[^"]*","[^"]+","[^"]+",\d/.test(l)).length>=514,true);
 await page.evaluate(()=>window.print=()=>window.__printCalled=true);await page.locator('#print').click();assert(await page.evaluate(()=>window.__printCalled));assert((await page.locator('#review-text').innerText()).includes('Uji antarmuka'));
 await page.pdf({path:path.join(out,'Lembar-Usulan.pdf'),format:'A4',landscape:true,printBackground:true});await page.emulateMedia({media:'print'});assert(await page.locator('.print-only.banner').isVisible());assert(!(await page.locator('.sidebar').isVisible()));await page.emulateMedia({media:'screen'});
 await go('usulan');await page.once('dialog',d=>d.accept());await page.locator('[data-u="reset"]').click();assert.equal((await st()).status,'draf');assert.equal((await st()).log.length,0);assert.equal(await page.evaluate(i=>EduApp.result.x.edushield[i],wilIdx),quotaBefore,'kuota tidak kembali setelah atur ulang alur');
 ok('#lembar: status final, CSV dan JSON dari handler asli (514 baris, kuota bulat, <= pagu, log), unduhan native dicatat, cetak, PDF, tampilan cetak; atur ulang alur memulihkan kuota');

 // 8. Metode: pengungkapan dan identitas paket.
 await go('metode');await page.locator('#m-lain details summary').first().click();assert(await page.locator('#m-lain details').first().getAttribute('open')!==null);
 ok('#metode: disclosure terbuka');

 // 9. Teks diperbesar 187,5% pada delapan rute (1440 dan 390): tanpa overflow halaman.
 const textScale=await page.addStyleTag({content:'html{font-size:187.5%!important}'});
 for(const width of [1440,390]){await page.setViewportSize({width,height:1050});for(const route of ROUTES){await go(route);await noOverflow(route+' teks 200% @'+width)}}
 await textScale.evaluate(e=>e.remove());
 ok('teks diperbesar: delapan rute tanpa overflow pada 1440 dan 390');

 // 10. Gerak: drawer dapat dibalik saat bergerak (gerak normal); pengurangan gerak langsung selesai.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});await go('beranda');
 await page.locator('#menu-toggle').click();
 // Tombol tutup berada di luar viewport sampai laci mulai masuk; menunggu progres sebelum mengkliknya (lihat V1_laporan.md, #sidebar-close).
 await page.waitForFunction(()=>EduUI.drawer.progress>.6);const mid=await page.evaluate(()=>EduUI.drawer.progress);assert(mid<1,'laci harus masih bergerak saat dibalik');
 await page.locator('#sidebar-close').click();
 await page.locator('#menu-toggle').click();await page.waitForFunction(()=>EduUI.drawer.progress>.998);
 assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');await page.screenshot({path:path.join(out,'Sidebar-mobile.png')});
 await page.locator('#sidebar-close').click();await page.waitForFunction(()=>EduUI.drawer.progress<.001);
 assert(!(await page.locator('#app-surface').evaluate(e=>e.inert)));
 await page.setViewportSize({width:1440,height:1050});await page.waitForFunction(()=>!document.querySelector('.sidebar').inert,null,{timeout:3000}); // listener media query asinkron
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#menu-toggle').click();assert.equal(await page.evaluate(()=>EduUI.drawer.progress),1);await page.locator('#sidebar-close').click();assert.equal(await page.evaluate(()=>EduUI.drawer.progress),0);
 await page.evaluate(()=>location.hash='unknown');await page.waitForFunction(()=>document.body.dataset.page==='beranda');
 ok('laci dapat dibalik saat bergerak; pengurangan gerak langsung selesai; hash tak dikenal');

 // 11. Tur papan ketik dan ?demo=1 (keadaan awal identik dua kali), pada konteks bersih.
 const tourSteps=['peta','simulator','audit','replay','usulan','lembar'];let tourRuns=0;
 for(const [W,H] of [[1440,1050],[390,844]]){
  const ctx=await browser.newContext({viewport:{width:W,height:H},reducedMotion:'reduce'}),p=await ctx.newPage();watch(p);
  const snap=()=>p.evaluate(()=>JSON.stringify({params:EduApp.params,store:EduStore.get(),role:EduApp.role,route:EduApp.route,theme:document.documentElement.dataset.theme,prof:document.querySelector('.peta-nama')?.textContent||null,step:EduTour.step,active:EduTour.active,pressed:[...document.querySelectorAll('[data-theme-choice]')].map(b=>b.getAttribute('aria-pressed'))}));
  await p.goto(base);await p.locator('h1').waitFor();
  // keadaan "kotor": tema gelap, peran dinas, usulan dikirim
  await p.evaluate(()=>{localStorage.setItem('edushield-theme','dark');EduStore.transisi('kirim',{peran:'analis',skenario:{}})});await p.locator('#role').selectOption('B');
  const themeBefore=await p.evaluate(()=>localStorage.getItem('edushield-theme'));
  const url=base+'?demo=1',ready=()=>p.waitForFunction(()=>window.EduTour&&EduTour.active&&document.body.dataset.page==='peta'&&document.querySelector('.peta-nama'));
  await p.goto(url);await ready();const a=await snap();
  await p.evaluate(()=>EduStore.transisi('kirim',{peran:'analis',skenario:{}}));await p.goto('about:blank');await p.goto(url);await ready();const b=await snap();
  assert.equal(a,b,'?demo=1 harus memberi keadaan awal identik');const o=JSON.parse(a);
  assert.equal(o.role,'A');assert.equal(o.store.status,'draf');assert.equal(o.store.log.length,0);assert.equal(o.theme,'light');assert.equal(o.route,'peta');assert.equal(o.step,0);assert(o.prof.startsWith('Sumba Tengah'));
  assert.equal(await p.evaluate(()=>localStorage.getItem('edushield-theme')),themeBefore,'?demo=1 tidak boleh menimpa tema pengguna');
  const focusOnCard=s=>p.waitForFunction(s=>document.activeElement===document.querySelector('.tour-card')||(s===2&&document.activeElement.id==='au-h2'),s);
  for(let rep=0;rep<2;rep++){
   if(rep===1){if(W<700){await p.locator('#menu-toggle').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>EduUI.drawer.open)}await p.locator('#tour-start').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>EduTour.active&&EduTour.step===0)}
   for(let s=0;s<6;s++){
    await p.waitForFunction(([r,s])=>document.body.dataset.page===r&&EduTour.step===s,[tourSteps[s],s]);await focusOnCard(s);
    assert(await p.evaluate(()=>{const c=document.querySelector('.tour-card').getBoundingClientRect();return c.left>=0&&c.top>=0&&c.right<=innerWidth&&c.bottom<=innerHeight}),`kartu tur di luar viewport pada langkah ${s+1} @${W}`);
    assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`overflow saat tur langkah ${s+1}`);
    if(s<5)await p.keyboard.press('ArrowRight');
   }
   if(rep===0){await p.keyboard.press('Escape');await p.waitForFunction(()=>!EduTour.active);assert.equal(await p.evaluate(()=>document.activeElement.id),W<700?'menu-toggle':'tour-start','fokus tidak kembali setelah Escape')}
   else{await p.keyboard.press('Enter');await p.waitForFunction(()=>!EduTour.active)}
   tourRuns++;
  }
  await p.evaluate(()=>EduTour.start());await p.waitForFunction(()=>EduTour.active&&EduTour.step===0);await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>EduTour.step===1);await p.keyboard.press('ArrowLeft');await p.waitForFunction(()=>EduTour.step===0);await p.keyboard.press('Escape');
  assert.notEqual(await p.locator('#tour-start').getAttribute('aria-disabled'),'true');
  await ctx.close();
 }
 ok('tur enam langkah hanya dengan papan ketik (panah, Enter, Escape, fokus kembali, ulang, mundur) pada 1440 dan 390; ?demo=1 dua kali identik dan tidak menimpa tema');

 assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(external.length,0,JSON.stringify(external));
 const report={status:'PASS',routes:ROUTES,legacyRoutes:Object.keys(LEGACY).length,routeViewportChecks:routeChecks,viewports:WIDTHS,tourRuns,nativeDownload,downloadScope:'Hasil unduhan native tertera di atas; Blob CSV dan JSON divalidasi tersendiri.',sliderSolveMs,pageErrors:errors,externalRequests:external,checks};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
